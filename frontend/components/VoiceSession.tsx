'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useConnectionState,
  useParticipants,
  useRoomContext,
} from '@livekit/components-react'
import { ConnectionState, RoomEvent } from 'livekit-client'
import { Mic, MicOff, PhoneOff, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AgentConfig, TranscriptMessage } from '@/lib/types'
import { generateRoomName, formatDuration, cn } from '@/lib/utils'

type SessionPhase = 'idle' | 'requesting-mic' | 'connecting' | 'connected' | 'error'

interface VoiceSessionProps {
  config: AgentConfig
  onTranscript: (msg: TranscriptMessage) => void
  onActiveChange?: (active: boolean) => void
}

export function VoiceSession({ config, onTranscript, onActiveChange }: VoiceSessionProps) {
  const [phase, setPhase] = useState<SessionPhase>('idle')
  const [token, setToken] = useState('')
  const [serverUrl, setServerUrl] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [roomName, setRoomName] = useState('')

  const handleConnect = useCallback(async () => {
    setError(null)

    setPhase('requesting-mic')
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      setError('Microphone access denied. Please allow mic access and try again.')
      setPhase('error')
      return
    }

    setPhase('connecting')
    const name = generateRoomName()
    setRoomName(name)

    try {
      const res = await fetch('/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomName: name,
          participantName: 'user',
          agentConfig: config,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to get token')

      setToken(data.token)
      setServerUrl(data.url)
      onActiveChange?.(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed')
      setPhase('error')
    }
  }, [config, onActiveChange])

  const handleDisconnect = useCallback(() => {
    setToken('')
    setServerUrl('')
    setRoomName('')
    setPhase('idle')
    setError(null)
    onActiveChange?.(false)
  }, [onActiveChange])

  return (
    <div className="flex flex-col items-center justify-center w-full h-full gap-6 px-8">
      {token && serverUrl ? (
        <LiveKitRoom
          serverUrl={serverUrl}
          token={token}
          audio={true}
          video={false}
          connect={true}
          onConnected={() => setPhase('connected')}
          onDisconnected={handleDisconnect}
          onError={(err) => {
            setError(err.message)
            setPhase('error')
          }}
          style={{ width: '100%', display: 'contents' }}
        >
          <RoomAudioRenderer />
          <ActiveCallUI
            phase={phase}
            roomName={roomName}
            onEnd={handleDisconnect}
            onTranscript={onTranscript}
          />
        </LiveKitRoom>
      ) : (
        <IdleUI phase={phase} error={error} onConnect={handleConnect} config={config} />
      )}
    </div>
  )
}

function IdleUI({
  phase,
  error,
  onConnect,
  config,
}: {
  phase: SessionPhase
  error: string | null
  onConnect: () => void
  config: AgentConfig
}) {
  const isConnecting = phase === 'connecting' || phase === 'requesting-mic'

  return (
    <>
      <div className="relative flex items-center justify-center">
        {isConnecting && (
          <>
            <span className="ripple-ring absolute inset-0 text-violet-400 border-violet-400/50" />
            <span className="ripple-ring absolute inset-0 text-violet-400 border-violet-400/50" style={{ animationDelay: '0.8s' }} />
          </>
        )}
        <button
          onClick={onConnect}
          disabled={isConnecting}
          className={cn(
            'relative z-10 w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950',
            isConnecting
              ? 'bg-violet-700 animate-pulse cursor-wait'
              : 'bg-violet-600 hover:bg-violet-500 hover:scale-105 active:scale-95 shadow-lg shadow-violet-900/40'
          )}
        >
          <Mic className="h-9 w-9 text-white" />
        </button>
      </div>

      <div className="text-center space-y-1">
        <p className="text-base font-semibold text-zinc-100">
          {phase === 'requesting-mic'
            ? 'Requesting microphone...'
            : phase === 'connecting'
            ? 'Connecting...'
            : 'Talk to Agent'}
        </p>
        <p className="text-sm text-zinc-500">
          {isConnecting
            ? 'Please wait'
            : `Start a conversation with ${config.agentName}`}
        </p>
      </div>

      {error && (
        <div className="max-w-sm w-full rounded-lg border border-red-800/50 bg-red-950/30 px-4 py-3">
          <p className="text-sm text-red-400 font-medium">Connection failed</p>
          <p className="text-xs text-red-500 mt-1">{error}</p>
          {error.includes('Missing environment') && (
            <p className="text-xs text-zinc-500 mt-2">
              Copy <code className="font-mono">.env.local.example</code> to{' '}
              <code className="font-mono">.env.local</code> and fill in your credentials.
            </p>
          )}
        </div>
      )}
    </>
  )
}

function ActiveCallUI({
  phase,
  roomName,
  onEnd,
  onTranscript,
}: {
  phase: SessionPhase
  roomName: string
  onEnd: () => void
  onTranscript: (msg: TranscriptMessage) => void
}) {
  const connectionState = useConnectionState()
  const participants = useParticipants()
  const room = useRoomContext()

  const [agentSpeaking, setAgentSpeaking] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const connectedAt = useRef<number | null>(null)

  const isConnected = connectionState === ConnectionState.Connected
  const agentParticipant = participants.find((p) => !p.isLocal)

  useEffect(() => {
    if (isConnected) {
      connectedAt.current = Date.now()
      timerRef.current = setInterval(() => {
        if (connectedAt.current) {
          setElapsed(Math.floor((Date.now() - connectedAt.current) / 1000))
        }
      }, 1000)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isConnected])

  useEffect(() => {
    setAgentSpeaking(agentParticipant?.isSpeaking ?? false)
  }, [agentParticipant?.isSpeaking])

  // Listen for transcript data messages from the agent
  useEffect(() => {
    const handler = (
      payload: Uint8Array,
      _participant: unknown,
    ) => {
      try {
        const text = new TextDecoder().decode(payload)
        const msg = JSON.parse(text) as {
          type: string
          role: 'user' | 'agent'
          text: string
        }
        if (msg.type === 'transcript') {
          onTranscript({
            id: `${Date.now()}-${Math.random()}`,
            role: msg.role,
            text: msg.text,
            timestamp: new Date(),
          })
        }
      } catch {}
    }

    room.on(RoomEvent.DataReceived, handler)
    return () => {
      room.off(RoomEvent.DataReceived, handler)
    }
  }, [room, onTranscript])

  const agentJoined = !!agentParticipant

  const visualState: 'connecting' | 'waiting-for-agent' | 'listening' | 'agent-speaking' =
    !isConnected
      ? 'connecting'
      : !agentJoined
      ? 'waiting-for-agent'
      : agentSpeaking
      ? 'agent-speaking'
      : 'listening'

  return (
    <>
      <div className="relative flex items-center justify-center">
        {(visualState === 'listening' || visualState === 'agent-speaking') && (
          <>
            <span
              className={cn(
                'absolute rounded-full border',
                visualState === 'agent-speaking'
                  ? 'ripple-ring border-emerald-400/40 inset-[-20px]'
                  : 'ripple-ring border-violet-400/40 inset-[-20px]'
              )}
            />
            <span
              className={cn(
                'absolute rounded-full border',
                visualState === 'agent-speaking'
                  ? 'ripple-ring border-emerald-400/30 inset-[-20px]'
                  : 'ripple-ring border-violet-400/30 inset-[-20px]'
              )}
              style={{ animationDelay: '0.8s' }}
            />
          </>
        )}

        <div
          className={cn(
            'relative z-10 w-24 h-24 rounded-full flex flex-col items-center justify-center transition-all duration-500',
            visualState === 'connecting' || visualState === 'waiting-for-agent'
              ? 'bg-zinc-800 animate-pulse'
              : visualState === 'agent-speaking'
              ? 'bg-emerald-700 animate-glow'
              : 'bg-violet-600'
          )}
        >
          {visualState === 'agent-speaking' ? (
            <div className="sound-wave text-white">
              {Array.from({ length: 7 }).map((_, i) => (
                <span key={i} className="bar" />
              ))}
            </div>
          ) : visualState === 'listening' ? (
            <Mic className="h-9 w-9 text-white" />
          ) : (
            <MicOff className="h-9 w-9 text-zinc-400" />
          )}
        </div>
      </div>

      <div className="text-center space-y-1">
        <p className="text-base font-semibold text-zinc-100">
          {visualState === 'connecting'
            ? 'Connecting to room...'
            : visualState === 'waiting-for-agent'
            ? 'Waiting for agent...'
            : visualState === 'agent-speaking'
            ? 'Agent speaking'
            : 'Listening'}
        </p>
        <p className="text-sm text-zinc-500">
          {visualState === 'waiting-for-agent'
            ? 'Make sure the Python agent is running'
            : formatDuration(elapsed)}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              'inline-block w-2 h-2 rounded-full',
              isConnected ? 'bg-emerald-400' : 'bg-yellow-400 animate-pulse'
            )}
          />
          <span className="text-xs text-zinc-500">{isConnected ? 'Connected' : 'Connecting'}</span>
        </div>

        <span className="text-zinc-700">·</span>

        <div className="flex items-center gap-1.5 text-xs text-zinc-500">
          <Users className="h-3 w-3" />
          <span>{participants.length}</span>
        </div>

        <span className="text-zinc-700">·</span>

        <Badge variant="secondary" className="text-xs font-mono">
          {roomName}
        </Badge>
      </div>

      <Button
        variant="destructive"
        className="gap-2 rounded-full px-6"
        onClick={onEnd}
      >
        <PhoneOff className="h-4 w-4" />
        End Call
      </Button>

      {isConnected && !agentJoined && elapsed > 8 && (
        <div className="max-w-xs text-center rounded-lg border border-yellow-800/50 bg-yellow-950/30 px-4 py-3">
          <p className="text-sm text-yellow-400 font-medium">Agent hasn't joined yet</p>
          <p className="text-xs text-yellow-600 mt-1">
            Run <code className="font-mono">python agent.py dev</code> in the{' '}
            <code className="font-mono">agent/</code> directory.
          </p>
        </div>
      )}
    </>
  )
}
