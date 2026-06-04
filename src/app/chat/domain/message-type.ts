export type MessageType =
  | 'AGENT'
  | 'TEXT'
  | 'BOT'
  | 'TYPING'
  | 'OPEN'
  | 'CLOSE'
  | 'LEAVE'
  | 'ACD_START'
  | 'ACD_END'
  | 'CUSTOMER_END';

export const SENDER_AGENT = 'genesys-agent';
export const SENDER_BOT = 'genesys-bot';
export const SENDER_SYSTEM = 'genesys-system';
