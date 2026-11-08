import { Participant } from '@/types/nexora';

const AVATAR_COLORS = [
  '#E11D48', // Velvet Crimson
  '#BE123C', // Wine Red
  '#9F1239', // Deep Burgundy
  '#F43F5E', // Rose Crimson
  '#FB7185', // Soft Rose
  '#D97706', // Golden Cinema Glow
  '#881337', // Deep Plum Wine
];

const DEFAULT_NAMES = [
  'Amor',
  'Pipoca',
  'Cineasta',
  'Meu Par',
  'Estrela',
  'Sessão a Dois',
  'Companhia',
];

export const DEFAULT_PARTICIPANT: Participant = {
  id: 'cad_init',
  name: 'Meu Par',
  avatar: '❤️',
  color: '#E11D48',
  role: 'admin',
  isHost: true,
  isMuted: false,
  isDeafened: false,
  isCamOn: false,
  isSharingScreen: false,
  isSpeaking: false,
  joinedAt: 0,
  volume: 100,
};

export function getOrCreateLocalParticipant(): Participant {
  if (typeof window === 'undefined') {
    return DEFAULT_PARTICIPANT;
  }

  try {
    const saved = localStorage.getItem('nexora_user_profile');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.id && parsed.name) {
        return {
          ...parsed,
          isMuted: false,
          isDeafened: false,
          isCamOn: false,
          isSharingScreen: false,
          isSpeaking: false,
          joinedAt: Date.now(),
        };
      }
    }
  } catch {
    // ignore
  }

  const randomName = DEFAULT_NAMES[Math.floor(Math.random() * DEFAULT_NAMES.length)];
  const randomColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
  const randomId = 'nx_' + Math.random().toString(36).substring(2, 9);
  const initials = randomName.substring(0, 2).toUpperCase();

  const newProfile: Participant = {
    id: randomId,
    name: randomName,
    avatar: initials,
    color: randomColor,
    role: 'admin',
    isHost: true,
    isMuted: false,
    isDeafened: false,
    isCamOn: false,
    isSharingScreen: false,
    isSpeaking: false,
    joinedAt: Date.now(),
    volume: 100,
  };

  try {
    localStorage.setItem('nexora_user_profile', JSON.stringify(newProfile));
  } catch {
    // ignore
  }

  return newProfile;
}

type Listener = () => void;
const listeners = new Set<Listener>();

let cachedParticipant: Participant | null = null;

export function subscribeParticipant(listener: Listener) {
  listeners.add(listener);
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', listener);
  }
  return () => {
    listeners.delete(listener);
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', listener);
    }
  };
}

export function getLocalParticipantSnapshot(): Participant {
  if (typeof window === 'undefined') {
    return DEFAULT_PARTICIPANT;
  }
  if (!cachedParticipant) {
    cachedParticipant = getOrCreateLocalParticipant();
  }
  return cachedParticipant;
}

export function saveLocalParticipant(participant: Participant) {
  cachedParticipant = participant;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('nexora_user_profile', JSON.stringify(participant));
    } catch {
      // ignore
    }
    listeners.forEach((listener) => {
      try {
        listener();
      } catch {
        // ignore
      }
    });
  }
}
