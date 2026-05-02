'use client'

import { useEffect, useState } from 'react'
import { Save, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AgentConfig as AgentConfigType, DEFAULT_CONFIG } from '@/lib/types'
import { TTS_VOICES, LLM_MODELS } from '@/lib/constants'
import { cn } from '@/lib/utils'

const STORAGE_KEY = 'voice-agent-lab-config'

interface AgentConfigProps {
  config: AgentConfigType
  onConfigChange: (config: AgentConfigType) => void
  disabled?: boolean
}

export function AgentConfig({ config, onConfigChange, disabled }: AgentConfigProps) {
  const [saved, setSaved] = useState(false)
  const [draft, setDraft] = useState<AgentConfigType>(config)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as AgentConfigType
        setDraft(parsed)
        onConfigChange(parsed)
      }
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const update = (key: keyof AgentConfigType, value: string | number) => {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
    } catch {}
    onConfigChange(draft)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleReset = () => {
    setDraft(DEFAULT_CONFIG)
    onConfigChange(DEFAULT_CONFIG)
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {}
  }

  return (
    <div className={cn('flex flex-col h-full', disabled && 'opacity-60 pointer-events-none')}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-800">
        <h2 className="text-sm font-semibold text-zinc-100">Agent Configuration</h2>
        <p className="text-xs text-zinc-500 mt-0.5">Settings applied on next connection</p>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {/* Agent Name */}
        <div className="space-y-1.5">
          <Label htmlFor="agent-name">Agent Name</Label>
          <Input
            id="agent-name"
            value={draft.agentName}
            onChange={(e) => update('agentName', e.target.value)}
            placeholder="Dev"
          />
        </div>

        {/* First Message */}
        <div className="space-y-1.5">
          <Label htmlFor="first-message">First Message</Label>
          <Textarea
            id="first-message"
            value={draft.firstMessage}
            onChange={(e) => update('firstMessage', e.target.value)}
            placeholder="Hi! How can I help you?"
            className="min-h-[72px]"
          />
          <p className="text-xs text-zinc-600">
            Spoken by the agent immediately when you connect.
          </p>
        </div>

        {/* System Prompt */}
        <div className="space-y-1.5">
          <Label htmlFor="system-prompt">System Prompt</Label>
          <Textarea
            id="system-prompt"
            value={draft.systemPrompt}
            onChange={(e) => update('systemPrompt', e.target.value)}
            placeholder="You are a helpful assistant..."
            className="min-h-[120px]"
          />
        </div>

        {/* LLM Model */}
        <div className="space-y-1.5">
          <Label>LLM Model</Label>
          <Select value={draft.model} onValueChange={(v) => update('model', v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LLM_MODELS.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Voice */}
        <div className="space-y-1.5">
          <Label>Voice (OpenAI TTS)</Label>
          <Select value={draft.voice} onValueChange={(v) => update('voice', v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TTS_VOICES.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {v.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Temperature */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Temperature</Label>
            <span className="text-xs font-mono text-violet-400">
              {draft.temperature.toFixed(1)}
            </span>
          </div>
          <Slider
            min={0}
            max={1}
            step={0.1}
            value={[draft.temperature]}
            onValueChange={([v]) => update('temperature', v)}
          />
          <div className="flex justify-between text-xs text-zinc-600">
            <span>Focused</span>
            <span>Creative</span>
          </div>
        </div>
      </div>

      {/* Footer actions */}
      <div className="px-4 py-3 border-t border-zinc-800 flex gap-2">
        <Button
          className="flex-1 gap-2"
          onClick={handleSave}
          variant={saved ? 'secondary' : 'default'}
        >
          <Save className="h-3.5 w-3.5" />
          {saved ? 'Saved!' : 'Save Config'}
        </Button>
        <Button variant="outline" size="icon" onClick={handleReset} title="Reset to defaults">
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}
