import { NextRequest, NextResponse } from 'next/server'
import { RoomServiceClient } from 'livekit-server-sdk'
import { generateToken } from '@/lib/livekit'

export async function POST(request: NextRequest) {
  const apiKey = process.env.LIVEKIT_API_KEY
  const apiSecret = process.env.LIVEKIT_API_SECRET
  const wsUrl = process.env.LIVEKIT_URL

  if (!apiKey || !apiSecret || !wsUrl) {
    const missing = [
      !apiKey && 'LIVEKIT_API_KEY',
      !apiSecret && 'LIVEKIT_API_SECRET',
      !wsUrl && 'LIVEKIT_URL',
    ]
      .filter(Boolean)
      .join(', ')
    return NextResponse.json(
      { error: `Missing environment variables: ${missing}` },
      { status: 500 }
    )
  }

  let body: { roomName?: string; participantName?: string; agentConfig?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { roomName, participantName = 'user', agentConfig } = body

  if (!roomName) {
    return NextResponse.json({ error: 'roomName is required' }, { status: 400 })
  }

  const httpUrl = wsUrl.replace(/^wss?:\/\//, (m) =>
    m === 'wss://' ? 'https://' : 'http://'
  )
  const roomService = new RoomServiceClient(httpUrl, apiKey, apiSecret)

  try {
    await roomService.createRoom({
      name: roomName,
      metadata: JSON.stringify(agentConfig ?? {}),
      emptyTimeout: 300,
      maxParticipants: 2,
    })
  } catch {
  }

  try {
    const token = await generateToken({
      roomName,
      participantName,
      metadata: JSON.stringify({ isUser: true }),
    })
    return NextResponse.json({ token, url: wsUrl })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Token generation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    url: !!process.env.LIVEKIT_URL,
    apiKey: !!process.env.LIVEKIT_API_KEY,
    apiSecret: !!process.env.LIVEKIT_API_SECRET,
  })
}
