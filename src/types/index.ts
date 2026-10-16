export type EmotionType =
  | 'neutral'
  | 'happy'
  | 'thinking'
  | 'surprised'
  | 'teasing'
  | 'shy'
  | 'sad';

export type RoomEnvironmentType = 'bedroom' | 'cyber' | 'garden';
export type CameraAngle = 'portrait' | 'upper' | 'full';

export interface GroundingSource {
  title: string;
  uri: string;
}

export type MemoryCategory = 'preference' | 'experience' | 'topic' | 'nickname' | 'custom';

export interface CompanionMemory {
  id: string;
  category: MemoryCategory;
  content: string;
  timestamp: number;
}

export interface PendingMemory {
  id: string;
  category: MemoryCategory;
  content: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  emotion?: EmotionType;
  groundingSources?: GroundingSource[];
  searchNotice?: string;
  suggestedMemory?: {
    category: MemoryCategory;
    content: string;
  };
}

export interface AppSettings {
  assistantNickname: string;
  userNickname: string;
  voiceEnabled: boolean;
  autoSpeak: boolean;
  voicePitch: number;
  voiceRate: number;
  voiceVolume: number;
  selectedVoiceURI: string;
  soundEffectsEnabled: boolean;
  particlesEnabled: boolean;
  hornGlowEnabled: boolean;
  animationsEnabled: boolean;
  avatarMode: 'animated' | 'illustrated';
  autoDetectMemories: boolean;
  memories: CompanionMemory[];
  roomEnvironment: RoomEnvironmentType;
  lowPerformanceMode: boolean;
  cameraAngle: CameraAngle;
}

export const DEFAULT_SETTINGS: AppSettings = {
  assistantNickname: 'Zero Two',
  userNickname: 'Darling',
  voiceEnabled: true,
  autoSpeak: true,
  voicePitch: 1.2,
  voiceRate: 1.05,
  voiceVolume: 1.0,
  selectedVoiceURI: '',
  soundEffectsEnabled: true,
  particlesEnabled: true,
  hornGlowEnabled: true,
  animationsEnabled: true,
  avatarMode: 'animated',
  autoDetectMemories: true,
  memories: [
    {
      id: 'initial-memory-1',
      category: 'preference',
      content: 'Loves sweet treats, especially honey-dipped foods and fruit lollipops.',
      timestamp: Date.now() - 86400000,
    },
    {
      id: 'initial-memory-2',
      category: 'experience',
      content: 'Promised to be partners and pilot our day through anything together.',
      timestamp: Date.now() - 43200000,
    },
  ],
  roomEnvironment: 'bedroom',
  lowPerformanceMode: false,
  cameraAngle: 'upper',
};

export type ActiveTab = 'chat' | 'room' | 'avatar' | 'live' | 'settings';
