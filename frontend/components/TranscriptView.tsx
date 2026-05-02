'use client'

import { useEffect, useRef, useState } from 'react'
import { Copy, Trash2, Check, MessageSquare, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TranscriptMessage } from '@/lib/types'
import { cn } from '@/lib/utils'

interface TranscriptViewProps {
  messages: TranscriptMessage[]
  onClear: () => void
}

export function TranscriptView({ messages, onClear }: TranscriptViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    const el = scrollRef.current
    if (el) {
      el.scrollTop = el.scrollHeight
    }
  }, [messages])

  const formatLines = () =>
    messages
      .map((m) => {
        const time = m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        const speaker = m.role === 'user' ? 'You' : 'Agent'
        return `[${time}] ${speaker}: ${m.text}`
      })
      .join('\n')

  const handleCopy = () => {
    navigator.clipboard.writeText(formatLines()).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleDownload = () => {
    const blob = new Blob([formatLines()], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transcript-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800 shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-3.5 w-3.5 text-zinc-500" />
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Transcript
          </h3>
          {messages.length > 0 && (
            <span className="text-xs text-zinc-600">({messages.length} messages)</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs gap-1.5 text-zinc-500 hover:text-zinc-300"
            onClick={handleCopy}
            disabled={messages.length === 0}
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? 'Copied' : 'Copy'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs gap-1.5 text-zinc-500 hover:text-zinc-300"
            onClick={handleDownload}
            disabled={messages.length === 0}
            title="Download as .txt"
          >
            <Download className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs gap-1.5 text-zinc-500 hover:text-red-400"
            onClick={onClear}
            disabled={messages.length === 0}
          >
            <Trash2 className="h-3 w-3" />
            Clear
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto transcript-scroll px-4 py-3 space-y-2"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-zinc-600">
            <MessageSquare className="h-6 w-6 opacity-30" />
            <p className="text-xs">Conversation will appear here</p>
          </div>
        ) : (
          messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
        )}
      </div>
    </div>
  )
}

function MessageBubble({ message }: { message: TranscriptMessage }) {
  const isUser = message.role === 'user'
  const time = message.timestamp.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  return (
    <div className={cn('flex flex-col gap-0.5', isUser ? 'items-end' : 'items-start')}>
      <div
        className={cn(
          'max-w-[75%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed',
          isUser
            ? 'bg-violet-600/30 text-violet-100 rounded-br-sm'
            : 'bg-zinc-800 text-zinc-200 rounded-bl-sm'
        )}
      >
        {message.text}
      </div>
      <span className="text-[10px] text-zinc-600 px-1">
        {isUser ? 'You' : 'Agent'} · {time}
      </span>
    </div>
  )
}
