import asyncio
import json
import logging
import os
from typing import Optional

from dotenv import load_dotenv
from livekit import rtc
from livekit.agents import (
    Agent,
    AgentSession,
    AutoSubscribe,
    ChatMessage,
    ConversationItemAddedEvent,
    JobContext,
    UserInputTranscribedEvent,
    WorkerOptions,
    cli,
)
from livekit.plugins import deepgram, openai, silero

load_dotenv()
logger = logging.getLogger("voice-agent")

DEFAULT_SYSTEM_PROMPT = (
    "You are a senior software engineer helping with quick technical questions. "
    "Keep answers short and practical — this is a voice conversation, so no code blocks, "
    "no bullet lists. Speak like you're pair programming: direct, concrete, no fluff."
)
DEFAULT_FIRST_MESSAGE = "Hey, what are you working on?"
DEFAULT_MODEL = "gpt-4o-mini"
DEFAULT_VOICE = "echo"
DEFAULT_TEMPERATURE = 0.5


def parse_room_config(metadata: Optional[str]) -> dict:
    if not metadata:
        return {}
    try:
        return json.loads(metadata)
    except (json.JSONDecodeError, TypeError):
        logger.warning("Could not parse room metadata: %r", metadata)
        return {}


async def publish_transcript(
    local_participant: rtc.LocalParticipant,
    role: str,
    text: str,
) -> None:
    payload = json.dumps({"type": "transcript", "role": role, "text": text}).encode()
    try:
        await local_participant.publish_data(payload, reliable=True)
    except Exception as exc:
        logger.debug("Failed to publish transcript: %s", exc)


async def entrypoint(ctx: JobContext) -> None:
    logger.info("Job received for room: %s", ctx.room.name)

    config = parse_room_config(ctx.room.metadata)

    system_prompt = config.get("systemPrompt",  DEFAULT_SYSTEM_PROMPT)
    first_message = config.get("firstMessage",  DEFAULT_FIRST_MESSAGE)
    model_name    = config.get("model",          DEFAULT_MODEL)
    voice         = config.get("voice",          DEFAULT_VOICE)
    temperature   = float(config.get("temperature", DEFAULT_TEMPERATURE))
    agent_name    = config.get("agentName",      "Agent")

    logger.info(
        "Config — name=%s model=%s voice=%s temp=%.1f",
        agent_name, model_name, voice, temperature,
    )

    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)

    session = AgentSession(
        vad=silero.VAD.load(),
        stt=deepgram.STT(model="nova-2"),
        llm=openai.LLM(model=model_name, temperature=temperature),
        tts=openai.TTS(voice=voice),
    )

    @session.on("user_input_transcribed")
    def on_user_transcribed(ev: UserInputTranscribedEvent) -> None:
        if ev.is_final and ev.transcript:
            asyncio.ensure_future(
                publish_transcript(ctx.room.local_participant, "user", ev.transcript)
            )

    @session.on("conversation_item_added")
    def on_conversation_item(ev: ConversationItemAddedEvent) -> None:
        if isinstance(ev.item, ChatMessage) and ev.item.role == "assistant":
            text = ev.item.text_content
            if text:
                asyncio.ensure_future(
                    publish_transcript(ctx.room.local_participant, "agent", text)
                )

    await session.start(
        agent=Agent(instructions=system_prompt),
        room=ctx.room,
    )

    await session.say(first_message, allow_interruptions=True)

    logger.info("Agent ready in room %s", ctx.room.name)


if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))
