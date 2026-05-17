# WebSocket Chat Gateway — Frontend Integration Specification

Service: `omn-wss-chat-gateway`
Protocol: **STOMP over WebSocket / SockJS**
Base URL: configured per environment — see [Environments](#8-environments)

---

## Table of Contents

1. [Connection](#1-connection)
2. [STOMP Frame Headers](#2-stomp-frame-headers)
3. [Subscriptions](#3-subscriptions)
4. [Sending Messages](#4-sending-messages)
5. [Receiving Messages](#5-receiving-messages)
6. [Message Type Reference](#6-message-type-reference)
7. [Session Lifecycle](#7-session-lifecycle)
8. [Environments](#8-environments)
9. [Error Scenarios](#9-error-scenarios)

---

## 1. Connection

### Endpoint

```
/ws
```

The backend registers **two variants** at the same path:

| Variant | Client URL format | Notes |
|---|---|---|
| **SockJS** (with fallback) | `http(s)://<host>/ws` | Use when native WebSocket is blocked (corporate proxies, etc.) |
| **Native WebSocket** | `ws(s)://<host>/ws` | Preferred — lower overhead, no polling |

### Protocol

The service uses **STOMP 1.2** on top of the WebSocket transport.

---

## 2. STOMP Frame Headers

### CONNECT frame — required and optional headers

| Header | Required | Description |
|---|---|---|
| `sessionId` | ✅ **Yes** | Client-generated **UUID v4**. Must be unique per connection and stable for its entire lifetime. Used by the backend for multi-pod sticky routing in Redis. |
| `heart-beat` | ❌ Optional | Standard STOMP heartbeat pair. Recommended value: `10000,10000` (10 s send / 10 s receive). |

> **The `sessionId` header is mandatory.**
> On CONNECT the backend stores `ws:session:{sessionId} → podId` in Redis with a **24-hour TTL**.
> If this header is missing, routing of responses back to the client will fail.

**Example CONNECT frame:**

```
CONNECT
accept-version:1.2
heart-beat:10000,10000
sessionId:550e8400-e29b-41d4-a716-446655440001

^@
```

---

## 3. Subscriptions

Subscribe immediately after receiving the `CONNECTED` frame.

### 3.1 User queue — chat responses

```
/user/queue/chat-response
```

**Session-scoped.** Only the session that subscribed receives deliveries here.
All agent/bot messages, typing indicators, and ACD events arrive on this destination.

### 3.2 Conversation topic — presence / broadcast events

```
/topic/conversation/{conversationId}
```

Replace `{conversationId}` with the active conversation identifier.
Receives broadcast events visible to all subscribers of that conversation
(e.g., `LEAVE` when any participant disconnects).

| Destination | Scope | Event types delivered |
|---|---|---|
| `/user/queue/chat-response` | Per session | `AGENT`, `BOT`, `TYPING`, `OPEN`, `CLOSE`, `LEAVE`, `ACD_START`, `ACD_END`, `CUSTOMER_END` |
| `/topic/conversation/{conversationId}` | All subscribers of that conversation | `LEAVE` (system disconnect notification) |

---

## 4. Sending Messages

### Destination

```
/app/chat.send
```

### Payload — `WsChatMessageDto`

| Field | Type | Required | Description |
|---|---|---|---|
| `conversationId` | `string` | ✅ Yes | Conversation identifier. Used as the Kafka message key to guarantee ordering per conversation. |
| `userId` | `string` | ✅ Yes | End-user identifier. |
| `text` | `string` | ✅ Yes | Message content. |
| `sessionId` | — | ❌ **Omit** | Do not include. The backend sets this automatically from the STOMP session. |

**Example SEND frame:**

```
SEND
destination:/app/chat.send
content-type:application/json

{
  "conversationId": "conv-00000001",
  "userId":         "cliente-123456",
  "text":           "Hola, necesito ayuda"
}
^@
```

> **Important — first message registration:**
> The **first SEND** for a given `conversationId` in a session registers
> `ws:conv:{conversationId} → sessionId` in Redis (TTL 24 h).
> This mapping is required so that responses arriving via Kafka can be routed
> back to the correct WebSocket session.
> Every subsequent SEND on the same `conversationId` refreshes the TTL.

---

## 5. Receiving Messages

All responses are delivered as JSON payloads to `/user/queue/chat-response`.

### Payload — `AdvisorMessageEventDto`

| Field | Type | Nullable | Description |
|---|---|---|---|
| `id` | `string` | ✅ Yes | Genesys message ID. `null` for non-message events (typing, presence, ACD). |
| `conversationId` | `string` | ❌ No | Conversation this message belongs to. |
| `senderId` | `string` | ❌ No | Fixed origin identifier (see [§6](#6-message-type-reference)). |
| `senderName` | `string` | ❌ No | Agent nickname or empty string `""`. Never `null`. |
| `content` | `string` | ❌ No | Message text or event name (see per-type detail in [§6](#6-message-type-reference)). |
| `type` | `string` | ❌ No | Enum value. See [§6](#6-message-type-reference). |
| `timestamp` | `string` | ❌ No | Server processing time. Format: `yyyy-MM-dd'T'HH:mm:ss`. |
| `genesysMessageId` | `string` | ✅ Yes | Genesys internal message ID. `null` for ACD events. |

**Example — agent message:**

```json
{
  "id": "msg-abc123",
  "conversationId": "conv-00000001",
  "senderId": "genesys-agent",
  "senderName": "john.doe@bank.com",
  "content": "Hello, how can I help you?",
  "type": "AGENT",
  "timestamp": "2026-05-17T10:30:00",
  "genesysMessageId": "gmsg-xyz789"
}
```

**Example — typing indicator (on):**

```json
{
  "id": null,
  "conversationId": "conv-00000001",
  "senderId": "genesys-agent",
  "senderName": "john.doe@bank.com",
  "content": "john.doe@bank.com is typing...",
  "type": "TYPING",
  "timestamp": "2026-05-17T10:31:00",
  "genesysMessageId": "gmsg-evt001"
}
```

**Example — ACD routing start:**

```json
{
  "id": null,
  "conversationId": "conv-00000001",
  "senderId": "genesys-system",
  "senderName": "",
  "content": "ACD_START",
  "type": "ACD_START",
  "timestamp": "2026-05-17T10:28:00",
  "genesysMessageId": null
}
```

---

## 6. Message Type Reference

### Full enum table

| `type` | `senderId` | `senderName` | `content` | `id` | `genesysMessageId` |
|---|---|---|---|---|---|
| `AGENT` | `genesys-agent` | Agent nickname | Agent's message text | set | set |
| `BOT` | `genesys-bot` | Nickname or `""` | Bot's message text | set | set |
| `TYPING` | `genesys-agent` | Nickname or `""` | `"<name> is typing..."` (on) / `""` (off) | `null` | set |
| `OPEN` | `genesys-agent` | `""` | `"OPEN"` | `null` | set |
| `CLOSE` | `genesys-agent` | `""` | `"CLOSE"` | `null` | set |
| `LEAVE` | `genesys-agent` | `""` | `"LEAVE"` | `null` | set |
| `ACD_START` | `genesys-system` | `""` | `"ACD_START"` | `null` | `null` |
| `ACD_END` | `genesys-system` | `""` | `"ACD_END"` | `null` | `null` |
| `CUSTOMER_END` | `genesys-system` | `""` | `"CUSTOMER_END"` | `null` | `null` |

### Distinguishing TYPING ON vs TYPING OFF

Both states arrive with `type = "TYPING"`. Differentiate using the `content` field:

| `content` value | Meaning |
|---|---|
| Non-empty string (e.g. `"John is typing..."`) | Typing started → show indicator |
| Empty string `""` | Typing stopped → hide indicator |

### Suggested UI behaviour per type

| `type` | Suggested UI action |
|---|---|
| `AGENT` | Display agent message bubble |
| `BOT` | Display bot message bubble |
| `TYPING` | Show / hide typing indicator |
| `OPEN` | Conversation opened — activate input field |
| `CLOSE` | Conversation closed — disable input, show end state |
| `LEAVE` | Show participant-left notice |
| `ACD_START` | Show "Connecting to agent…" status indicator |
| `ACD_END` | Hide ACD indicator |
| `CUSTOMER_END` | Customer disconnected — close or reset conversation view |

---

## 7. Session Lifecycle

```
Client                                        Backend (any pod)
  │                                                │
  │── CONNECT  sessionId:<uuid> ─────────────────▶│  Redis SET ws:session:{sessionId} → podId  TTL 24h
  │◀─ CONNECTED ──────────────────────────────────│
  │                                                │
  │── SUBSCRIBE /user/queue/chat-response ────────▶│
  │── SUBSCRIBE /topic/conversation/{convId} ─────▶│
  │                                                │
  │── SEND /app/chat.send ────────────────────────▶│  Redis SET ws:conv:{conversationId} → sessionId  TTL 24h
  │    { conversationId, userId, text }             │  Kafka PUBLISH → chat-inbound  key=conversationId
  │                                                │
  │                              (processor service responds)
  │                                                │
  │                              Kafka CONSUME ◀── chat-response  key=conversationId
  │                                                │  1. Redis GET ws:conv:{conversationId} → sessionId
  │                                                │  2. Redis GET ws:session:{sessionId}  → podId
  │                                                │  3a. Same pod  → deliver via SimpMessagingTemplate
  │                                                │  3b. Other pod → Redis PUBLISH ws:pod:{podId}
  │◀─ MESSAGE /user/queue/chat-response ──────────│
  │                                                │
  │── DISCONNECT ─────────────────────────────────▶│  Redis DEL ws:session:{sessionId}
  │                                                │  PUBLISH /topic/conversation/{convId}  type=LEAVE
```

### Redis key TTL reference

| Key pattern | TTL | Created / refreshed on |
|---|---|---|
| `ws:session:{sessionId}` | 24 h | CONNECT |
| `ws:conv:{conversationId}` | 24 h | Every SEND to `/app/chat.send` |

### Reconnection after session expiry

If the client reconnects after the 24 h TTL expires:

1. Generate a **new `sessionId`** UUID client-side.
2. CONNECT using the new `sessionId`.
3. Re-subscribe to `/user/queue/chat-response` and `/topic/conversation/{convId}`.
4. Send any message to `/app/chat.send` to re-register the `conversationId → sessionId` mapping.

---

## 8. Environments

| Environment | WebSocket URL | SockJS URL |
|---|---|---|
| Local | `ws://localhost:8080/ws` | `http://localhost:8080/ws` |
| Development | `wss://omn-wss-chat-gateway.dev.bancopichincha.com/ws` | `https://omn-wss-chat-gateway.dev.bancopichincha.com/ws` |
| Staging | `wss://omn-wss-chat-gateway.test.bancopichincha.com/ws` | `https://omn-wss-chat-gateway.test.bancopichincha.com/ws` |
| Production | `wss://omn-wss-chat-gateway.bancopichincha.com/ws` | `https://omn-wss-chat-gateway.bancopichincha.com/ws` |

> All non-local environments require **WSS / HTTPS (TLS)**.

---

## 9. Error Scenarios

| Scenario | Backend behaviour | Frontend recovery |
|---|---|---|
| `conversationId` not registered in Redis (first message not received) | Response silently discarded; warning logged | Re-send a message to `/app/chat.send` to re-register the mapping |
| Session TTL expired (24 h passed) | Routing fails; response discarded | Disconnect → reconnect with a new `sessionId` → re-subscribe → re-send a message |
| Pod restart / crash | `ws:session` key persists in Redis; new pod picks up routing transparently via Redis Pub/Sub | No action needed; routing auto-recovers on next response |
| WebSocket connection dropped by network | `DISCONNECT` event fires; Redis session key is deleted | Reconnect with same or new `sessionId`; re-subscribe and re-send |
| Message received with unknown `type` | N/A — `type` is set exclusively by the processor service | Handle gracefully: ignore or show a generic notification |
| `sessionId` header missing in CONNECT | Session registered with STOMP internal ID; routing may not match | Always include `sessionId` header in CONNECT frame |

