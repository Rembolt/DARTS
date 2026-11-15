# ElevenLabs voice for the agents and the tutorial (approved in chat, Nov 15)

**Why:** the agents should feel human: you talk, they answer aloud, and the first-visit tutorial is narrated.

**Approach (picked):** server proxy `POST /api/tts` (key never reaches the browser), model `eleven_flash_v2_5`
(lowest latency; `ELEVENLABS_MODEL` overrides it), disk cache by hash of voice+model+text. Rejected: calling
ElevenLabs from the browser (leaks key), `eleven_v3` default (too slow for conversation).

**Env:** `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_JEV`, `ELEVENLABS_VOICE_FRONT`, optional `ELEVENLABS_MODEL`.
No key → 503 `tts_off` → client stays text only, silently.

**Client:** `app/src/voice/speak.ts` (queue, cancel, mute). Jev `say()` and the front-door `text` event speak.
`ui.speaking` follows real playback. Starting the mic or stop cancels speech. Dock mute toggle.
Tutorial: each step has a spoken line, played on step change, cancelled on Next/Back/Skip.

**Non-goals:** ElevenLabs speech-to-text (Whisper stays), voice cloning, realtime websocket streaming.
