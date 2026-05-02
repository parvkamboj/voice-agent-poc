export interface AgentConfig {
  agentName: string
  firstMessage: string
  systemPrompt: string
  model: string
  voice: string
  temperature: number
}

export interface TranscriptMessage {
  id: string
  role: 'user' | 'agent'
  text: string
  timestamp: Date
}

export const DEFAULT_CONFIG: AgentConfig = {
  agentName: 'Dev',
  firstMessage: "Hey, what are you working on?",
  systemPrompt:
    'You are a senior software engineer helping with quick technical questions. ' +
    'Keep answers short and practical — this is a voice conversation, so no code blocks, ' +
    'no bullet lists. Speak like you\'re pair programming: direct, concrete, no fluff.',
  model: 'gpt-4o-mini',
  voice: 'echo',
  temperature: 0.5,
}
