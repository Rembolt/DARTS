export type SpeechRecognitionResultItem = {
  0: { transcript: string };
  isFinal: boolean;
  length: number;
};

export type SpeechRecognitionLike = {
  interimResults: boolean;
  continuous: boolean;
  lang: string;
  onresult: ((event: { results: ArrayLike<SpeechRecognitionResultItem> }) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
};

export function browserRecognition(): SpeechRecognitionLike | null {
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  return Ctor ? new Ctor() : null;
}

export function pushToTalk(deps: {
  recognition: () => SpeechRecognitionLike | null;
  onText(text: string, final: boolean): void;
}): { start(): void; stop(): void; available: boolean } {
  const probe = deps.recognition();
  if (!probe) {
    return { available: false, start() {}, stop() {} };
  }

  let active: SpeechRecognitionLike | null = null;
  let lastTranscript = '';
  let sentFinal = false;

  function emitFinal() {
    if (sentFinal) return;
    sentFinal = true;
    const text = lastTranscript.trim();
    if (text) deps.onText(text, true);
  }

  return {
    available: true,
    start() {
      if (active) return;
      const rec = deps.recognition();
      if (!rec) return;
      active = rec;
      lastTranscript = '';
      sentFinal = false;
      rec.interimResults = true;
      rec.continuous = true;
      rec.lang = 'en-US';
      rec.onresult = event => {
        const parts: string[] = [];
        for (let i = 0; i < event.results.length; i++) {
          const item = event.results[i];
          if (item?.[0]?.transcript) parts.push(item[0].transcript);
        }
        lastTranscript = parts.join(' ').trim();
        deps.onText(lastTranscript, false);
      };
      rec.onerror = () => {
        active = null;
      };
      rec.onend = () => {
        active = null;
        emitFinal();
      };
      rec.start();
    },
    stop() {
      if (!active) return;
      const rec = active;
      active = null;
      rec.stop();
      emitFinal();
    },
  };
}
