import { AccessToken } from 'livekit-server-sdk'

export interface TokenOptions {
  roomName: string
  participantName: string
  metadata?: string
}

export async function generateToken(opts: TokenOptions): Promise<string> {
  const apiKey = process.env.LIVEKIT_API_KEY
  const apiSecret = process.env.LIVEKIT_API_SECRET

  if (!apiKey || !apiSecret) {
    throw new Error('LIVEKIT_API_KEY and LIVEKIT_API_SECRET must be set')
  }

  const at = new AccessToken(apiKey, apiSecret, {
    identity: opts.participantName,
    name: opts.participantName,
    metadata: opts.metadata,
  })

  at.addGrant({
    room: opts.roomName,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  })

  return at.toJwt()
}

