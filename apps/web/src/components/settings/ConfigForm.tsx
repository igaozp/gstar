import { useState } from 'react'
import { Save } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { api } from '@/lib/api'
import type { ConfigData } from '@/lib/types'
import type { Locale } from '@/lib/i18n'

interface ConfigFormProps {
  initialConfig: ConfigData['data']
  locale: Locale
}

const text = {
  en: {
    save: 'Save',
    saving: 'Saving',
    saved: 'Saved',
    failed: 'Save failed',
    configured: 'configured',
    notSet: 'not set',
    tokenPlaceholder: 'Leave blank to keep current token',
    keyPlaceholder: 'Leave blank to keep current key',
    embeddingKey: 'Embedding API key',
    embeddingBaseUrl: 'Embedding Base URL',
    temperature: 'Temperature',
    maxTokens: 'Max tokens',
  },
  zh: {
    save: '保存',
    saving: '保存中',
    saved: '已保存',
    failed: '保存失败',
    configured: '已配置',
    notSet: '未设置',
    tokenPlaceholder: '留空则保留当前令牌',
    keyPlaceholder: '留空则保留当前密钥',
    embeddingKey: '向量 API 密钥',
    embeddingBaseUrl: '向量基础地址',
    temperature: '温度',
    maxTokens: '最大 Token',
  },
}

export function ConfigForm({ initialConfig, locale }: ConfigFormProps) {
  const labels = locale.startsWith('zh') ? text.zh : text.en
  const [config, setConfig] = useState(initialConfig)
  const [githubUsername, setGithubUsername] = useState(config.github.username ?? '')
  const [githubToken, setGithubToken] = useState('')
  const [llmProvider, setLlmProvider] = useState(config.llm.provider)
  const [llmApiKey, setLlmApiKey] = useState('')
  const [llmBaseUrl, setLlmBaseUrl] = useState(config.llm.baseUrl ?? '')
  const [llmChatModel, setLlmChatModel] = useState(config.llm.chatModel ?? '')
  const [llmTemperature, setLlmTemperature] = useState(String(config.llm.temperature ?? 0.3))
  const [llmMaxTokens, setLlmMaxTokens] = useState(String(config.llm.maxTokens ?? 1024))
  const [llmEmbeddingModel, setLlmEmbeddingModel] = useState(config.llm.embeddingModel ?? '')
  const [llmEmbeddingDimensions, setLlmEmbeddingDimensions] = useState(String(config.llm.embeddingDimensions ?? 1536))
  const [llmEmbeddingApiKey, setLlmEmbeddingApiKey] = useState('')
  const [llmEmbeddingBaseUrl, setLlmEmbeddingBaseUrl] = useState(config.llm.embeddingBaseUrl ?? '')
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'failed'>('idle')
  const [error, setError] = useState('')

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus('saving')
    setError('')

    const payload: Record<string, unknown> = {
      githubUsername,
      llmProvider,
      llmBaseUrl,
      llmChatModel,
      llmTemperature: Number(llmTemperature),
      llmMaxTokens: Number(llmMaxTokens),
      llmEmbeddingModel,
      llmEmbeddingDimensions: Number(llmEmbeddingDimensions),
      llmEmbeddingBaseUrl,
    }

    if (githubToken.trim()) payload.githubToken = githubToken
    if (llmApiKey.trim()) payload.llmApiKey = llmApiKey
    if (llmEmbeddingApiKey.trim()) payload.llmEmbeddingApiKey = llmEmbeddingApiKey

    try {
      const next = await api.updateConfig(payload)
      setConfig(next.data)
      setGithubToken('')
      setLlmApiKey('')
      setLlmEmbeddingApiKey('')
      setStatus('saved')
    } catch (err) {
      setStatus('failed')
      setError(err instanceof Error ? err.message : labels.failed)
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-2">
      <Card className="border border-border shadow-sm">
        <CardHeader>
          <CardTitle>GitHub</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 text-sm">
          <Field label={locale.startsWith('zh') ? '用户名' : 'Username'}>
            <Input value={githubUsername} onChange={(event) => setGithubUsername(event.target.value)} autoComplete="username" />
          </Field>
          <Field label={locale.startsWith('zh') ? '令牌' : 'Token'}>
            <Input
              type="password"
              value={githubToken}
              onChange={(event) => setGithubToken(event.target.value)}
              placeholder={labels.tokenPlaceholder}
              autoComplete="off"
            />
          </Field>
          <StatusBadge configured={config.github.configured} labels={labels} />
        </CardContent>
      </Card>

      <Card className="border border-border shadow-sm">
        <CardHeader>
          <CardTitle>{locale.startsWith('zh') ? '大模型' : 'LLM'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 text-sm">
          <Field label={locale.startsWith('zh') ? '服务商' : 'Provider'}>
            <Select value={llmProvider} onValueChange={setLlmProvider}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="openai">OpenAI</SelectItem>
                <SelectItem value="openai_compatible">OpenAI Compatible</SelectItem>
                <SelectItem value="anthropic">Anthropic</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label={locale.startsWith('zh') ? 'API 密钥' : 'API key'}>
            <Input
              type="password"
              value={llmApiKey}
              onChange={(event) => setLlmApiKey(event.target.value)}
              placeholder={labels.keyPlaceholder}
              autoComplete="off"
            />
          </Field>
          <Field label={locale.startsWith('zh') ? '基础地址' : 'Base URL'}>
            <Input value={llmBaseUrl} onChange={(event) => setLlmBaseUrl(event.target.value)} placeholder="https://api.openai.com/v1" />
          </Field>
          <Field label={locale.startsWith('zh') ? '对话模型' : 'Chat model'}>
            <Input value={llmChatModel} onChange={(event) => setLlmChatModel(event.target.value)} placeholder="gpt-4o-mini" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={labels.temperature}>
              <Input type="number" min="0" max="2" step="0.1" value={llmTemperature} onChange={(event) => setLlmTemperature(event.target.value)} />
            </Field>
            <Field label={labels.maxTokens}>
              <Input type="number" min="1" step="1" value={llmMaxTokens} onChange={(event) => setLlmMaxTokens(event.target.value)} />
            </Field>
          </div>
          <Field label={locale.startsWith('zh') ? '向量模型' : 'Embedding model'}>
            <Input value={llmEmbeddingModel} onChange={(event) => setLlmEmbeddingModel(event.target.value)} placeholder="text-embedding-3-small" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={locale.startsWith('zh') ? '维度' : 'Dimensions'}>
              <Input type="number" min="1" step="1" value={llmEmbeddingDimensions} onChange={(event) => setLlmEmbeddingDimensions(event.target.value)} />
            </Field>
            <Field label={labels.embeddingKey}>
              <Input
                type="password"
                value={llmEmbeddingApiKey}
                onChange={(event) => setLlmEmbeddingApiKey(event.target.value)}
                placeholder={labels.keyPlaceholder}
                autoComplete="off"
              />
            </Field>
          </div>
          <Field label={labels.embeddingBaseUrl}>
            <Input value={llmEmbeddingBaseUrl} onChange={(event) => setLlmEmbeddingBaseUrl(event.target.value)} placeholder="https://api.openai.com/v1" />
          </Field>
          <StatusBadge configured={config.llm.configured} labels={labels} />
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-3 lg:col-span-2">
        <Button type="submit" disabled={status === 'saving'}>
          <Save data-icon="inline-start" />
          {status === 'saving' ? labels.saving : labels.save}
        </Button>
        {status === 'saved' && <span className="text-sm text-muted-foreground">{labels.saved}</span>}
        {status === 'failed' && <span className="text-sm text-destructive">{error}</span>}
      </div>
    </form>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">{label}</span>
      {children}
    </label>
  )
}

function StatusBadge({
  configured,
  labels,
}: {
  configured: boolean
  labels: typeof text.en
}) {
  return (
    <div className="flex items-center justify-between border-t border-border pt-4">
      <span className="text-muted-foreground">Status</span>
      <Badge variant={configured ? 'default' : 'destructive'}>
        {configured ? labels.configured : labels.notSet}
      </Badge>
    </div>
  )
}
