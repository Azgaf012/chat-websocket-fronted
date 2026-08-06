export interface MessageAckRequestDto {
  userId: string;
  messageId: string;
}

export interface MessageAckResponseDto extends MessageAckRequestDto {
  status: 'ACKNOWLEDGED';
}
