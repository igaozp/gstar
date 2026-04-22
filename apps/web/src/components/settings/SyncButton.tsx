import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RefreshCw, CheckCircle, XCircle } from 'lucide-react'
import { api } from '@/lib/api'

type Status = { ok: true; synced: number } | { ok: false; error: string } | null

export function SyncButton() {
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
      setStatus({ ok: false, error: e instanceof Error ? e.message : 'Unknown error' })
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-3 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          disabled={loading !== null}
          onClick={() => handleSync('incremental')}
        >
          <RefreshCw className={loading === 'incremental' ? 'animate-spin' : ''} />
          Incremental Sync
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={loading !== null}
          onClick={() => handleSync('full')}
        >
          <RefreshCw className={loading === 'full' ? 'animate-spin' : ''} />
          Full Sync
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
                ? `Synced ${status.synced} repositories.`
                : 'Already up to date.'
              : status.error
            }
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
