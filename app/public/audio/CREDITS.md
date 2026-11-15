# Audio credits

Both files are public domain and safe for the public demo video. Downloaded from Wikimedia Commons on 2026-11-14.

| File | What | Recording | Licence | Source |
|---|---|---|---|---|
| `indoor.ogg` | Ludwig van Beethoven, Minuet in G major, WoO 10 No. 2 (piano, 2 min, mono) | Peter Johnston, via Musopen | Composition: public domain (PD-old-100). Recording: released into the public domain by the performer, "copyrighted free use" (Wikimedia permission ticket 2008012110017088) | https://commons.wikimedia.org/wiki/File:Minuet_in_G_(Beethoven),_piano.ogg |
| `outdoor.ogg` | "Highway from Bridge, Center": a motorway at night recorded from a bridge, cars and trucks (3 min 15 s) | stephan, via PDSounds.org (record 203) | Public domain (PD-author) | https://commons.wikimedia.org/wiki/File:Highway_from_bridge_center.ogg |

To swap in another track, keep the same file names, or change `SOURCES.*.file` in `app/src/config.ts`.
The engine falls back to a synthesized stand-in when a file is missing or can't be decoded.
`*.mp3` and `*.wav` are git-ignored so a commercial recording (such as the original song) never gets committed.
