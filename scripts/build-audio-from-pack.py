"""Turn picked recordings from the CLR Music city-ambience pack into the tour's outside-sound loops.

Usage: python scripts/build-audio-from-pack.py <folder with the unzipped pack>
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
    'residential_ambience': ('cm2-150777bb391e4d107b30__178022.wav', True),
    'city_ambience': ('cm3-2bf61daba71d72195638__city-street-10-second-excerpt.wav', True),
    'commercial_ambience': ('cm2-7017e3ea7de72018f97c__139981.wav', True),
    'industrial_ambience': ('cm2-2037a4b9825c9e9e9434__sfx100v2-loop-construction-site.ogg', True),
    'nature_ambience': ('cm3-026810155e843a8974ce__tokyo-park-at-dusk-10-second-excerpt.wav', True),
    'road': ('cm2-e20f1110657b69dccc15__sfx100v2-loop-highway.ogg', True),
    'train': ('cm3-57e4d20b9f40e8e3946d__long-train-ride-10-second-excerpt.wav', False),
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
