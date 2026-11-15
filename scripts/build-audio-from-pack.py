"""Turn picked recordings from the CLR Music city-ambience pack into the tour's outside-sound loops.

Usage: python scripts/build-audio-from-pack.py <the audios folder: the unzipped pack, files renamed as in its OPTIONS.md>
Needs: pip install numpy scipy soundfile. Writes app/public/audio/<name>.ogg: about 30 s, mono, looped by repeating the
short source with equal-power crossfades, and with its end blended into its start so it repeats without a click.
Every pick is CC0 per the pack's LICENSES.txt (rows are in app/public/audio/CREDITS.md). `train` stays stereo (a one-shot).
"""
import os
import sys
import numpy as np
import soundfile as sf

PICKS = {
    # output name: (source file in the pack, mono?)
    'residential_ambience': ('residential__quiet-north-street__CC0.wav', True),
    'city_ambience': ('city__city-street__CC0.wav', True),
    'commercial_ambience': ('commercial__market-environment__CC0.wav', True),
    'industrial_ambience': ('industrial__loop-construction-site__CC0.ogg', True),
    'nature_ambience': ('nature__tokyo-park-at-dusk__CC0.wav', True),
    'road': ('road__loop-highway__CC0.ogg', True),
    'train': ('train__long-train-ride__CC0.wav', False),
}
TARGET_S = 30.0
FADE_S = 0.5
OUT = os.path.join(os.path.dirname(__file__), '..', 'app', 'public', 'audio')


def crossfade_join(a, b, n):
    t = np.linspace(0, np.pi / 2, n)[:, None]
    mid = a[-n:] * np.cos(t) + b[:n] * np.sin(t)  # equal power
    return np.concatenate([a[:-n], mid, b[n:]])


def build(x, sr):
    n = int(FADE_S * sr)
    out = x
    while len(out) < int(TARGET_S * sr) + n:
        out = crossfade_join(out, x, min(n, len(x) // 2))
    out = out[: int(TARGET_S * sr) + n]
    # Blend the end into the start so the loop point is seamless, and drop the blended tail.
    head, tail = out[:n], out[-n:]
    t = np.linspace(0, np.pi / 2, n)[:, None]
    body = out[:-n].copy()
    body[:n] = head * np.sin(t) + tail * np.cos(t)
    return body


def main(src):
    for name, (file, mono) in PICKS.items():
        x, sr = sf.read(os.path.join(src, file), always_2d=True)
        if mono:
            x = x.mean(axis=1, keepdims=True)
        y = build(x, sr)
        peak = float(np.abs(y).max())
        if peak > 0:
            y = y / peak * 0.8
        # Written in small blocks: the Vorbis encoder overflows the stack on Windows when given 30 s in one call.
        with sf.SoundFile(os.path.join(OUT, name + '.ogg'), 'w', sr, y.shape[1], format='OGG', subtype='VORBIS') as f:
            for i in range(0, len(y), 8192):
                f.write(y[i:i + 8192].astype(np.float32))
        print(f'{name}: {len(y) / sr:.1f} s, {y.shape[1]} ch, {sr} Hz')


if __name__ == '__main__':
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
