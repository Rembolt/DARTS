import { describe, expect, it } from 'vitest';
import { pushToTalk, type SpeechRecognitionLike } from './voice';

describe('pushToTalk', () => {
  it('fills the box while speaking and sends on release', () => {
    let instance: (SpeechRecognitionLike & { emit(transcript: string, isFinal: boolean): void }) | null = null;
    const seen: { text: string; final: boolean }[] = [];

    const ptt = pushToTalk({
      recognition: () => {
        instance = {
          interimResults: false,
          continuous: false,
          lang: '',
          onresult: null,
          onerror: null,
          onend: null,
          start() {},
          stop() {
            this.onend?.();
          },
          emit(transcript, isFinal) {
            this.onresult?.({
              results: [{ 0: { transcript }, isFinal, length: 1 }],
            });
          },
        };
        return instance;
      },
      onText(text, final) {
        seen.push({ text, final });
      },
    });

    expect(ptt.available).toBe(true);
    ptt.start();
    instance!.emit('close the', false);
    expect(seen[0]).toEqual({ text: 'close the', final: false });
    instance!.emit('close the window', false);
    ptt.stop();
    expect(seen[seen.length - 1]).toEqual({ text: 'close the window', final: true });
  });

  it('is unavailable without SpeechRecognition', () => {
    const ptt = pushToTalk({
      recognition: () => null,
      onText: () => {},
    });
    expect(ptt.available).toBe(false);
    expect(() => {
      ptt.start();
      ptt.stop();
    }).not.toThrow();
  });
});
