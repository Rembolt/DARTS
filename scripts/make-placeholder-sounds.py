"""Generate PLACEHOLDER outside sounds (synthesized, not recordings) so the tour has surroundings to play.

These stand in until real CC0 / public-domain recordings are dropped into app/public/audio/ under the same names.
They are listed in app/public/audio/CREDITS.md as placeholders. Run: pip install numpy scipy soundfile, then
python scripts/make-placeholder-sounds.py  (writes mono 22.05 kHz Ogg Vorbis, deterministic).
"""
import os
import numpy as np
import soundfile as sf
from scipy import signal

SR = 22050
rng = np.random.default_rng(7)
OUT = os.path.join(os.path.dirname(__file__), '..', 'app', 'public', 'audio')


def noise(n):
    return rng.standard_normal(n)


def band(x, lo, hi, order=2):
    sos = signal.butter(order, [lo, hi], btype='band', fs=SR, output='sos')
    return signal.sosfilt(sos, x)


def low(x, hz, order=2):
    return signal.sosfilt(signal.butter(order, hz, btype='low', fs=SR, output='sos'), x)


def brown(n):
    x = np.cumsum(noise(n))
    x -= np.linspace(x[0], x[-1], n)  # no drift, so the loop point is quiet
    return x / (np.abs(x).max() + 1e-9)


def swell(n, centre, width):
    t = np.arange(n) / SR
    return np.exp(-0.5 * ((t - centre) / width) ** 2)


def chirp(dur, f0, f1):
    t = np.arange(int(dur * SR)) / SR
    f = f0 + (f1 - f0) * (t / dur)
    env = np.sin(np.pi * t / dur) ** 2
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env


def birds(n, count, lo=2500, hi=5500, level=0.25):
    out = np.zeros(n)
    for _ in range(count):
        start = int(rng.uniform(0, n - SR))
        for k in range(int(rng.integers(2, 5))):  # a short phrase of 2-4 notes
            f0 = rng.uniform(lo, hi)
            c = chirp(rng.uniform(0.06, 0.14), f0, f0 * rng.uniform(0.8, 1.35)) * level * rng.uniform(0.5, 1)
            s = start + int(k * 0.16 * SR)
            if s + len(c) < n:
                out[s:s + len(c)] += c
    return out


def car_passes(n, count, level=1.0, hz=(200, 3000)):
    out = np.zeros(n)
    base = band(noise(n), *hz)
    for _ in range(count):
        out += base * swell(n, rng.uniform(0, n / SR), rng.uniform(0.5, 1.6)) * rng.uniform(0.3, 1) * level
    return out


def loopable(x, fade=1.0):
    """Crossfade the tail into the head so the clip repeats with no click."""
    f = int(fade * SR)
    head, tail = x[:f].copy(), x[-f:].copy()
    ramp = np.linspace(0, 1, f)
    body = x[:-f].copy()
    body[:f] = head * ramp + tail * (1 - ramp)
    return body


def norm(x, peak=0.8):
    return x / (np.abs(x).max() + 1e-9) * peak


def save(name, x):
    sf.write(os.path.join(OUT, name + '.ogg'), norm(x).astype(np.float32), SR, format='OGG', subtype='VORBIS')
    print(name, round(len(x) / SR, 1), 's')


def make():
    n = 24 * SR
    # Quiet suburb: low air, faint distant traffic hum, a few birds.
    save('residential_ambience', loopable(0.5 * low(brown(n), 400) + 0.12 * band(noise(n), 300, 900) * (0.6 + 0.4 * np.sin(np.linspace(0, 6 * np.pi, n)) ) + birds(n, 6, level=0.12)))
    # A road: broadband wash and cars passing.
    save('road', loopable(0.4 * band(noise(n), 150, 2500) + 0.5 * low(brown(n), 300) + car_passes(n, 9, 0.9)))
    # Busy city: rumble, steady traffic roar, many passes and a horn-like tone now and then.
    horn = np.zeros(n)
    for _ in range(3):
        s = int(rng.uniform(0, n - SR)); t = np.arange(int(0.35 * SR)) / SR
        horn[s:s + len(t)] += 0.08 * np.sin(2 * np.pi * rng.choice([370, 440, 494]) * t) * np.sin(np.pi * t / t[-1])
    save('city_ambience', loopable(0.7 * low(brown(n), 500) + 0.5 * band(noise(n), 200, 3500) + car_passes(n, 22, 0.9) + horn))
    # Commercial: murmur of voices (speech band, syllable-rate modulation) over an air-handler hum.
    t = np.arange(n) / SR
    syl = 0.55 + 0.45 * np.abs(np.sin(2 * np.pi * 3.7 * t) * np.sin(2 * np.pi * 0.31 * t + 1))
    hum = 0.15 * np.sin(2 * np.pi * 120 * t) + 0.08 * np.sin(2 * np.pi * 240 * t)
    save('commercial_ambience', loopable(0.6 * band(noise(n), 300, 3000) * syl + hum + 0.3 * low(brown(n), 300)))
    # Industrial: machinery drone with harmonics, rumble and a slow throb.
    drone = sum(a * np.sin(2 * np.pi * f * t) for f, a in [(60, .35), (120, .25), (180, .12), (300, .06)])
    save('industrial_ambience', loopable(drone * (0.85 + 0.15 * np.sin(2 * np.pi * 0.5 * t)) + 0.5 * low(brown(n), 250) + 0.2 * band(noise(n), 800, 4000)))
    # Nature: wind that rises and falls and many birds.
    wind = band(noise(n), 200, 1200) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.11 * t) ** 2)
    save('nature_ambience', loopable(0.7 * wind + 0.3 * low(brown(n), 300) + birds(n, 22, level=0.3)))

    # Stereo one-shots, played once every few minutes, so no loop and a swell in and out.
    m = 22 * SR
    t = np.arange(m) / SR
    env = swell(m, 11, 4.5)
    clack = (np.sin(2 * np.pi * 7 * t) > 0.97).astype(float)  # rail joints
    clack = signal.sosfilt(signal.butter(2, [800, 3500], btype='band', fs=SR, output='sos'), np.convolve(clack, noise(300) * np.exp(-np.arange(300) / 40), 'same'))
    save('train', env * (0.6 * low(brown(m), 250) + 0.3 * band(noise(m), 100, 900) + 1.5 * clack) * 1.0)
    # Plane: jet whine and roar that builds, passes and fades, with the pitch falling past the middle.
    pitch = 900 - 350 * np.clip((t - 8) / 6, 0, 1)
    whine = np.sin(2 * np.pi * np.cumsum(pitch) / SR) * 0.08
    save('plane', swell(m, 10, 4) * (0.7 * band(noise(m), 150, 1800) + 0.4 * low(brown(m), 200) + whine))


if __name__ == '__main__':
    make()
