# Audio credits

`music.ogg` and `highway.ogg` are public domain and safe for the public demo video; the sections below list the rest. Downloaded from Wikimedia Commons on 2026-11-14.

| File | What | Recording | Licence | Source |
|---|---|---|---|---|
| `music.ogg` | Ludwig van Beethoven, Minuet in G major, WoO 10 No. 2 (piano, 2 min, mono) | Peter Johnston, via Musopen | Composition: public domain (PD-old-100). Recording: released into the public domain by the performer, "copyrighted free use" (Wikimedia permission ticket 2008012110017088) | https://commons.wikimedia.org/wiki/File:Minuet_in_G_(Beethoven),_piano.ogg |
| `highway.ogg` | "Highway from Bridge, Center": a motorway at night recorded from a bridge, cars and trucks (3 min 15 s) | stephan, via PDSounds.org (record 203) | Public domain (PD-author) | https://commons.wikimedia.org/wiki/File:Highway_from_bridge_center.ogg |

To swap in another track, keep the same file names, or change `SOUNDS.*.file` in `app/src/config.ts`.
A file that is missing or can't be decoded is skipped and named in the tour's status line: nothing is synthesized in its place.
`*.mp3` and `*.wav` are git-ignored so a commercial recording (such as the original song) never gets committed.

## Outside sounds: real recordings, CC0

From the CLR Music "City Ambience" pack (https://clr.fm/music/); each licence is listed in that pack's LICENSES.txt.
`scripts/build-audio-from-pack.py` turns each short source into a 30 s seamless loop (crossfades, mono).

| File | Source clip | Creator | Licence | Source |
|---|---|---|---|---|
| `residential_ambience.ogg` | Quiet North Street (10 s) | LampEight | CC0 | https://www.freesound.org/people/LampEight/sounds/178022/ |
| `city_ambience.ogg` | City Street (10 s) | ecfike | CC0 | https://www.freesound.org/people/ecfike/sounds/128917/ |
| `commercial_ambience.ogg` | Market environment (10 s) | Oscar de Avila | CC0 | https://www.freesound.org/people/Oscar%20de%20%C3%81vila/sounds/139981/ |
| `industrial_ambience.ogg` | Loop construction site | rubberduck | CC0 | https://opengameart.org/content/100-cc0-sfx-2 |
| `nature_ambience.ogg` | Tokyo Park At Dusk (10 s) | markystar | CC0 | https://www.freesound.org/people/markystar/sounds/75273/ |
| `road.ogg` | Loop highway | rubberduck | CC0 | https://opengameart.org/content/100-cc0-sfx-2 |

## Needs credit: CC BY 3.0

Same pack. Show this credit line wherever the demo's credits are listed.

| File | Source clip | Credit line | Source |
|---|---|---|---|
| `train.ogg` | TrainStation (10 s), looped to 30 s | "TrainStation (10-Second Excerpt)" by pcaeldries, CC-BY-3.0, via https://www.freesound.org/people/pcaeldries/sounds/35057/ | https://www.freesound.org/people/pcaeldries/sounds/35057/ |

## Licence not checked: downloaded MP3s

Added 2026-11-15 from local downloads. The file names look like Pixabay downloads, so the Pixabay Content License
probably applies (free to use, no credit needed, not CC0), but nobody has checked the download pages. Check before the
repo or the demo video goes public.

| File | What | Downloaded file |
|---|---|---|
| `speaking.ogg` | One person lecturing (27 s loop, mono) | `freesound_community-science-teacher-lecturing-33676.mp3` |
| `conversation.ogg` | A crowd talking (60 s loop, mono) | `freesound_community-conversation-25675.mp3` |
| `plane.ogg` | Jet plane fly-by (28 s, stereo, played once per pass) | `u_xg7ssi08yr-jet-plane-fly-by-369631.mp3` |
| `opening.ogg` | A window opening (2.6 s): played when a door or window is opened or closed | `freesound_community-window-opening-100430.mp3` |
