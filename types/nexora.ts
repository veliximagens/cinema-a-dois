export interface Participant {
  id: string;
  name: string;
  avatar: string;
  color: string;
  role: 'admin' | 'moderator' | 'member';
  isHost: boolean;
  isMuted: boolean;
  isDeafened: boolean;
  isCamOn: boolean;
  isSharingScreen: boolean;
  isSpeaking: boolean;
  joinedAt: number;
  volume: number; // 0 to 100 for local playback
}

export interface RoomInvite {
  token: string;
  roomId: string;
  createdAt: number;
  createdBy: string;
  createdByName?: string;
  expiresAt: number | null; // null = sem expiração
  maxUses: number | null; // null = ilimitado
  usesCount: number;
  isRevoked: boolean;
}

export interface RoomInfo {
  id: string;
  name: string;
  isPrivate: boolean;
  password?: string;
  maxParticipants: number;
  createdAt: number;
  createdBy: string;
  createdByName: string;
  presenterId?: string;
  screenConfig?: ScreenQualityConfig;
  invites?: RoomInvite[];
}

export interface ScreenQualityConfig {
  resolution: '1080p' | '720p' | '4k';
  frameRate: 60 | 30;
  withAudio: boolean;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  senderColor: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
}

export interface RealtimeStats {
  resolution: string;
  fps: number;
  bitrateKbps: number;
  packetLoss: number;
  rttMs: number;
  codec: string;
  connectionState: RTCIceConnectionState | 'idle';
}

export interface SignalingMessage {
  type:
    | 'join'
    | 'leave'
    | 'participant_joined'
    | 'participant_left'
    | 'offer'
    | 'answer'
    | 'candidate'
    | 'state_update'
    | 'chat'
    | 'room_ended'
    | 'room_closed'
    | 'kick'
    | 'mute_remote'
    | 'screen_started'
    | 'screen_stopped'
    | 'invite_created'
    | 'invite_revoked';
  roomId: string;
  senderId: string;
  targetId?: string;
  payload?: any;
  timestamp: number;
}

export interface IceServerConfig {
  urls: string | string[];
  username?: string;
  credential?: string;
}
