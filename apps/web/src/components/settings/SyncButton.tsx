import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RefreshCw, CheckCircle, XCircle } from 'lucide-react'
import { api } from '@/lib/api'
import { createTranslator, type Locale } from '@/lib/i18n'

type Status = { ok: true; synced: number } | { ok: false; error: string } | null

interface Props {
  locale: Locale
}

export function SyncButton({ locale }: Props) {
  const t = createTranslator(locale)
  const [loading, setLoading] = useState<'incremental' | 'full' | null>(null)
  const [status, setStatus] = useState<Status>(null)

  async function handleSync(type: 'full' | 'incremental') {
    setLoading(type)
    setStatus(null)
    try {
      const res = await api.sync(type)
      const data = res.data as { result?: { synced?: number; notModified?: boolean } }
      const synced = data?.result?.synced ?? 0
      setStatus({ ok: true, synced })
    } catch (e) {
      setStatus({ ok: false, error: e instanceof Error ? e.message : t('sync.unknownError') })
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Button
          variant="outline"
          className="h-12 justify-between"
          disabled={loading !== null}
          onClick={() => handleSync('incremental')}
        >
          {t('sync.incremental')}
          <RefreshCw className={loading === 'incremental' ? 'animate-spin' : ''} />
        </Button>
        <Button
          variant="default"
          className="h-12 justify-between"
          disabled={loading !== null}
          onClick={() => handleSync('full')}
        >
          {t('sync.full')}
          <RefreshCw className={loading === 'full' ? 'animate-spin' : ''} />
        </Button>
      </div>

      {status && (
        <Alert variant={status.ok ? 'default' : 'destructive'}>
          {status.ok
            ? <CheckCircle className="h-4 w-4 text-green-600" />
            : <XCircle className="h-4 w-4" />
          }
          <AlertDescription>
            {status.ok
              ? status.synced > 0
                ? t('sync.synced', { count: status.synced.toLocaleString(locale) })
                : t('sync.upToDate')
              : status.error
            }
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
