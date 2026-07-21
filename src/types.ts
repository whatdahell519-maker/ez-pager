export type PagerUrgency = 'normal' | 'urgent' | 'emergency';

export type PagerTone = 'classic' | 'two-tone' | 'siren' | 'high-frequency' | 'burst';

export interface PageMessage {
  id: string;
  channel: string;
  message: string;
  urgency: PagerUrgency;
  tone: PagerTone;
  senderName: string;
  timestamp: string;
  repeatCount: number;
}

export interface PagerChannelState {
  channelId: string;
  isConnected: boolean;
  activeClientsCount: number;
  lastReceivedAt?: string;
}

export type PagerViewMode = 'split' | 'receiver' | 'sender';
