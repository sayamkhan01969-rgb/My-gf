import neutralImg from './images/zero_two_neutral_1792137659099.jpg';
import teasingImg from './images/zero_two_teasing_1792137673844.jpg';
import happyImg from './images/zero_two_happy_1792137689142.jpg';
import thinkingImg from './images/zero_two_thinking_1792137708600.jpg';
import surprisedImg from './images/zero_two_surprised_1792137724616.jpg';
import { EmotionType } from '../types';

export interface EmotionData {
  id: EmotionType;
  label: string;
  emoji: string;
  image: string;
  subtitle: string;
  glowColor: string;
  borderColor: string;
  tagline: string;
}

export const AVATAR_EMOTIONS: Record<EmotionType, EmotionData> = {
  neutral: {
    id: 'neutral',
    label: 'Relaxed',
    emoji: '✨',
    image: neutralImg,
    subtitle: 'Ready for action, Darling.',
    glowColor: 'rgba(255, 59, 129, 0.45)',
    borderColor: 'border-pink-500/40',
    tagline: 'Code 002 online and synced.',
  },
  happy: {
    id: 'happy',
    label: 'Cheerful',
    emoji: '🌸',
    image: happyImg,
    subtitle: 'Ahaha! You really know how to make me smile!',
    glowColor: 'rgba(255, 105, 180, 0.55)',
    borderColor: 'border-pink-400',
    tagline: 'Pure happiness with Darling!',
  },
  teasing: {
    id: 'teasing',
    label: 'Teasing',
    emoji: '😈',
    image: teasingImg,
    subtitle: "What's that face for, Darling? Blushing already?",
    glowColor: 'rgba(225, 29, 72, 0.55)',
    borderColor: 'border-rose-500',
    tagline: 'Playful mischief mode activated.',
  },
  surprised: {
    id: 'surprised',
    label: 'Surprised',
    emoji: '😲',
    image: surprisedImg,
    subtitle: 'W-wait... what did you just say?!',
    glowColor: 'rgba(251, 113, 133, 0.55)',
    borderColor: 'border-rose-400',
    tagline: 'Caught completely off-guard!',
  },
  thinking: {
    id: 'thinking',
    label: 'Thinking',
    emoji: '🤔',
    image: thinkingImg,
    subtitle: 'Hmm... let me analyze this puzzle for you...',
    glowColor: 'rgba(168, 85, 247, 0.55)',
    borderColor: 'border-purple-500',
    tagline: 'Deep neural calculation in progress.',
  },
  shy: {
    id: 'shy',
    label: 'Bashful',
    emoji: '😳',
    image: surprisedImg,
    subtitle: "Don't stare at me like that... it's embarrassing, Darling! 💕",
    glowColor: 'rgba(244, 114, 182, 0.55)',
    borderColor: 'border-pink-300',
    tagline: 'Flustered and blushing.',
  },
  sad: {
    id: 'sad',
    label: 'Sympathetic',
    emoji: '🥺',
    image: thinkingImg,
    subtitle: "Hey... don't be down, Darling. I'm always right here with you.",
    glowColor: 'rgba(96, 165, 250, 0.55)',
    borderColor: 'border-sky-400',
    tagline: 'Gentle comfort from your partner.',
  },
};

export const QUICK_TOUCH_REACTIONS = {
  horns: [
    "Hey! Don't touch my horns without asking, Darling! 😈 But... maybe I don't mind it too much.",
    "Bzzzt! Sensitive spot, Darling! My horn resonance just spiked! ✨",
    "Did you know my horns glow when I get excited? Careful playing with fire! 🔥",
  ],
  cheeks: [
    "Hey! Who said you could pinch my cheek? Darling, you're getting bold! 😳",
    "Mmm... your hands are warm, Darling. Don't stop now~ 🌸",
    "Ahaha! Tickles! Are you trying to see if I'm soft? 💕",
  ],
  head: [
    "*Purrs softly* Hehe, pats for your favorite partner? You know the way to my heart, Darling! 🍭",
    "Good Darling~ Keep patting my head and I might just share my sweetest lollipop with you! ✨",
    "Hehehe, feels cozy. You really are my only Darling, aren't you? ❤️",
  ],
  randomPlayful: [
    "Poke me again and I'm stealing all your candy, Darling! 🍭",
    "Ahaha! Are you checking if I'm real? I'm right here with you! 🌸",
    "Darling, you're being so needy today~ Not that I dislike it! 😉✨",
    "Hehe! Careful, I might bite if you keep teasing me! 😈",
    "My sync rate with you just jumped 5%! Keep paying attention to me! ❤️",
  ],
};
