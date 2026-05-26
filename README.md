# Voice Agent

A POC I built to explore real-time AI voice agents using LiveKit. The idea was simple: how quickly can you wire up a full voice pipeline — mic input, speech recognition, an LLM, and text-to-speech — and have it feel like an actual conversation.

The answer is surprisingly fast once you have the right pieces. This demo lets you tweak the agent's personality, model, and voice in the browser without restarting anything.

---

## How it works

```
Browser (Next.js)
  └─ POST /api/token → creates LiveKit room with agent config in metadata
  └─ WebSocket → LiveKit Cloud

LiveKit Cloud
  └─ dispatches job to Python worker when room is created

Python Agent (agent.py)
  └─ VAD (Silero) → STT (Deepgram nova-2) → LLM (OpenAI) → TTS (OpenAI)
  └─ publishes transcript turns back to browser via data channel
```

The interesting part is that the agent config (system prompt, voice, model, temperature) lives in the room metadata. So every call can have a different persona without restarting the worker — the Python agent just reads `ctx.room.metadata` on job start.

---

## Stack

| Layer | Service |
|-------|---------|
| Room infrastructure | LiveKit Cloud |
| Speech-to-text | Deepgram nova-2 |
| LLM | OpenAI (gpt-4o / gpt-4o-mini) |
| Text-to-speech | OpenAI TTS |
| VAD | Silero |
| Frontend | Next.js 14 + Tailwind |

---

## TODO
- Interruption detection and barge-in handling
- Streaming transcript (word-by-word) instead of per-turn
- A way to save and reload named agent presets
- Blablabla
