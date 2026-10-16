// Speech Synthesis and Speech Recognition utility

export interface SpeechVoiceOption {
  name: string;
  lang: string;
  voiceURI: string;
}

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
}

export function getAvailableVoices(): Promise<SpeechVoiceOption[]> {
  return new Promise((resolve) => {
    if (!isSpeechSynthesisSupported()) {
      return resolve([]);
    }

    const synth = window.speechSynthesis;
    let voices = synth.getVoices();

    if (voices.length > 0) {
      return resolve(
        voices.map((v) => ({
          name: v.name,
          lang: v.lang,
          voiceURI: v.voiceURI,
        }))
      );
    }

    const onVoicesChanged = () => {
      synth.removeEventListener('voiceschanged', onVoicesChanged);
      voices = synth.getVoices();
      resolve(
        voices.map((v) => ({
          name: v.name,
          lang: v.lang,
          voiceURI: v.voiceURI,
        }))
      );
    };

    synth.addEventListener('voiceschanged', onVoicesChanged);

    setTimeout(() => {
      synth.removeEventListener('voiceschanged', onVoicesChanged);
      resolve(
        synth.getVoices().map((v) => ({
          name: v.name,
          lang: v.lang,
          voiceURI: v.voiceURI,
        }))
      );
    }, 1500);
  });
}

/**
 * Clean text for natural speech synthesis:
 * - Strips emotion tags: [happy], [teasing], etc.
 * - Strips roleplay stage directions: *smiling warmly*, (giggles), etc.
 * - Strips markdown symbols: #, *, _, ~, `, >
 * - Strips unicode emojis that synthesizers vocalize awkwardly
 */
export function cleanTextForSpeech(text: string): string {
  return text
    .replace(/\[(neutral|happy|teasing|surprised|thinking|shy|sad)\]/gi, '')
    .replace(/\[SUGGEST_MEMORY:[^\]]+\]/gi, '')
    .replace(/\*[^*]+\*/g, '') // remove *actions* like *giggles* or *smiles*
    .replace(/\([^)]+\)/g, '') // remove (actions)
    .replace(/[*_#`~>]/g, '')
    .replace(
      /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu,
      ''
    )
    .replace(/\s+/g, ' ')
    .trim();
}

let activeUtterance: SpeechSynthesisUtterance | null = null;
let speechSessionId = 0;

export function stopSpeaking(): void {
  speechSessionId++;
  if (isSpeechSynthesisSupported()) {
    try {
      window.speechSynthesis.cancel();
    } catch {}
    activeUtterance = null;
  }
}

export function speakText(
  text: string,
  options: {
    pitch?: number;
    rate?: number;
    volume?: number;
    voiceURI?: string;
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (err: any) => void;
  } = {}
): boolean {
  if (!isSpeechSynthesisSupported()) {
    options.onError?.('Speech synthesis is not supported on this browser.');
    return false;
  }

  // Prevent overlapping audio by cancelling any ongoing speech
  stopSpeaking();
  const currentSession = ++speechSessionId;

  const clean = cleanTextForSpeech(text);
  if (!clean) {
    options.onEnd?.();
    return true;
  }

  const synth = window.speechSynthesis;
  if (synth.paused) {
    synth.resume();
  }

  const utterance = new SpeechSynthesisUtterance(clean);
  utterance.pitch = options.pitch ?? 1.2;
  utterance.rate = options.rate ?? 1.05;
  utterance.volume = options.volume ?? 1.0;

  const voices = synth.getVoices();
  if (options.voiceURI) {
    const matched = voices.find((v) => v.voiceURI === options.voiceURI);
    if (matched) utterance.voice = matched;
  }

  // If no specific voice is selected, choose the most natural/female voice
  if (!utterance.voice && voices.length > 0) {
    const preferred = voices.find(
      (v) =>
        (v.name.toLowerCase().includes('female') ||
          v.name.toLowerCase().includes('natural') ||
          v.name.toLowerCase().includes('google') ||
          v.name.toLowerCase().includes('samantha') ||
          v.name.toLowerCase().includes('zira') ||
          v.name.toLowerCase().includes('victoria')) &&
        (v.lang.startsWith('en') || v.lang.startsWith('ja'))
    );
    if (preferred) {
      utterance.voice = preferred;
    }
  }

  utterance.onstart = () => {
    if (currentSession !== speechSessionId) return;
    options.onStart?.();
  };

  utterance.onend = () => {
    if (currentSession !== speechSessionId) return;
    activeUtterance = null;
    options.onEnd?.();
  };

  utterance.onerror = (e) => {
    if (currentSession !== speechSessionId) return;
    activeUtterance = null;
    options.onError?.(e);
  };

  activeUtterance = utterance;
  synth.speak(utterance);
  return true;
}

export class VoiceRecognitionManager {
  private recognition: any = null;
  public isListening = false;

  constructor(
    private onResult: (text: string, isFinal: boolean) => void,
    private onError: (errorMsg: string) => void,
    private onEnd: () => void
  ) {
    if (isSpeechRecognitionSupported()) {
      const SpeechRecognitionClass =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      this.recognition = new SpeechRecognitionClass();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onstart = () => {
        this.isListening = true;
      };

      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        if (finalTranscript) {
          this.onResult(finalTranscript, true);
        } else if (interimTranscript) {
          this.onResult(interimTranscript, false);
        }
      };

      this.recognition.onerror = (event: any) => {
        this.isListening = false;
        let message = 'Speech recognition error';
        if (event.error === 'not-allowed') {
          message =
            'Microphone access was denied. Please allow microphone permissions in your Android or browser settings.';
        } else if (event.error === 'no-speech') {
          message = 'No speech was detected. Tap the mic and try again, Darling!';
        } else if (event.error === 'network') {
          message = 'Network error during voice recognition.';
        } else {
          message = `Voice error: ${event.error}`;
        }
        this.onError(message);
      };

      this.recognition.onend = () => {
        this.isListening = false;
        this.onEnd();
      };
    }
  }

  public start(): boolean {
    if (!this.recognition) {
      this.onError(
        'Speech recognition is not supported in this browser. Please use Chrome on Android.'
      );
      return false;
    }

    try {
      if (this.isListening) {
        this.recognition.abort();
      }
      this.recognition.start();
      return true;
    } catch (e: any) {
      console.warn('Recognition start error:', e);
      return false;
    }
  }

  public stop(): void {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {
        console.warn('Recognition stop error:', e);
      }
    }
    this.isListening = false;
  }
}
