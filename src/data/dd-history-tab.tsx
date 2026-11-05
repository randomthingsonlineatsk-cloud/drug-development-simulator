import { useEffect, useState } from 'react'
import { useMutation, useQuery, api } from '@/lib/backend'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PROGRAMS } from './dd-programs'
import { Trophy, History as HistoryIcon } from 'lucide-react'

const HISTORY_KEY = 'dd_history_v2'
const SYNC_CODE_KEY = 'dd_sync_code_v1'

export interface RunEntry { ts: number; programId: string; programName: string; verdict: string; score: number; maxScore: number }

export function loadHistory(): RunEntry[] { try { const raw = localStorage.getItem(HISTORY_KEY); return raw ? JSON.parse(raw) : [] } catch { return [] } }
function saveHistory(h: RunEntry[]) { try { localStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(-300))) } catch { /* ignore */ } }
export function appendHistory(e: RunEntry) { const h = loadHistory(); h.push(e); saveHistory(h) }
function loadSyncCode(): string | null { try { return localStorage.getItem(SYNC_CODE_KEY) } catch { return null } }
function saveSyncCode(code: string) { try { localStorage.setItem(SYNC_CODE_KEY, code) } catch { /* ignore */ } }

interface Badge { key: string; label: string; icon: string; earned: boolean; hint: string }
function computeBadges(history: RunEntry[]): Badge[] {
  const runs = history.length
  const approvals = history.filter((h) => h.verdict === 'approvable' || h.verdict === 'advisory_committee_then_approvable').length
  const programsTried = new Set(history.map((h) => h.programId)).size
  return [
    { key: 'first_run', label: 'First Program', icon: '🔬', earned: runs >= 1, hint: 'Complete 1 full run' },
    { key: 'first_approval', label: 'First Approval', icon: '✅', earned: approvals >= 1, hint: 'Get an approvable verdict' },
    { key: 'all_programs', label: 'Full Pipeline', icon: '🧬', earned: programsTried >= PROGRAMS.length, hint: `Try every program (${programsTried}/${PROGRAMS.length})` },
    { key: 'five_runs', label: 'Five Programs', icon: '📁', earned: runs >= 5, hint: `Complete 5 runs (${runs}/5)` },
  ]
}

export function HistoryTab() {
  const [history, setHistory] = useState<RunEntry[]>(() => (typeof window !== 'undefined' ? loadHistory() : []))
  const [syncCode, setSyncCode] = useState<string | null>(() => (typeof window !== 'undefined' ? loadSyncCode() : null))
  const [syncInput, setSyncInput] = useState('')
  const [syncBusy, setSyncBusy] = useState(false)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)
  const [pullTarget, setPullTarget] = useState<string | null>(null)

  const generateCode = useMutation(api.sync.generate)
  const pushSync = useMutation(api.sync.push)
  const pullResult = useQuery(api.sync.pull, pullTarget ? { code: pullTarget } : 'skip')

  useEffect(() => {
    if (pullResult === undefined || pullResult === null) return
    try {
      const pulled = JSON.parse(pullResult.historyJson) as RunEntry[]
      saveHistory(pulled); setHistory(pulled)
      if (pullTarget) { saveSyncCode(pullTarget); setSyncCode(pullTarget) }
      setSyncMessage(`Loaded ${pulled.length} runs from code ${pullTarget}.`)
    } catch { setSyncMessage('Could not read data from that code.') }
    setSyncBusy(false); setPullTarget(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pullResult])

  async function handleGenerate() {
    setSyncBusy(true); setSyncMessage(null)
    try {
      const code = await generateCode({})
      saveSyncCode(code); setSyncCode(code)
      await pushSync({ code, historyJson: JSON.stringify(loadHistory()) })
      setSyncMessage('Sync code created and current history pushed.')
    } catch { setSyncMessage('Could not generate a sync code — try again.') }
    setSyncBusy(false)
  }
  function handlePull() {
    const code = syncInput.trim().toUpperCase()
    if (code.length < 4) return
    setSyncBusy(true); setSyncMessage(null); setPullTarget(code)
  }

  const badges = computeBadges(history)
  const approvals = history.filter((h) => h.verdict === 'approvable' || h.verdict === 'advisory_committee_then_approvable').length

  return (
    <div className="space-y-4">
      <Card className="bg-lab-panel/80 border-lab-line glow-amber">
        <CardContent className="pt-4 grid grid-cols-2 gap-3">
          <div><p className="text-xs font-mono text-lab-text-muted">Programs completed</p><p className="text-2xl font-mono text-lab-amber">{history.length}</p></div>
          <div><p className="text-xs font-mono text-lab-text-muted">Approvals achieved</p><p className="text-2xl font-mono text-lab-amber">{approvals}</p></div>
        </CardContent>
      </Card>
      <Card className="bg-lab-panel/80 border-lab-line">
        <CardHeader className="pb-2"><CardTitle className="font-mono text-sm text-lab-text-muted flex items-center gap-2"><Trophy className="size-4 text-lab-gold" />Achievements</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {badges.map((b) => (
              <div key={b.key} className={`rounded-md border p-2 text-center ${b.earned ? 'border-lab-gold bg-lab-gold-soft glow-gold' : 'border-lab-line opacity-40'}`} title={b.hint}>
                <div className="text-xl">{b.icon}</div>
                <p className="text-[10px] font-mono text-lab-text mt-1">{b.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card className="bg-lab-panel/80 border-lab-line">
        <CardHeader className="pb-2"><CardTitle className="font-mono text-sm text-lab-text-muted">Sync across devices</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-lab-text-muted">No account needed — a short code links this device's history to any other device.</p>
          {syncCode ? (
            <div className="rounded-md border border-lab-gold bg-lab-gold-soft p-2 flex items-center justify-between flex-wrap gap-2">
              <p className="text-sm font-mono text-lab-gold">Your sync code: <span className="font-bold">{syncCode}</span></p>
              <Button onClick={() => navigator.clipboard?.writeText(syncCode)} size="sm" variant="outline" className="border-2 border-lab-gold text-lab-gold font-mono">Copy</Button>
            </div>
          ) : (
            <Button onClick={handleGenerate} disabled={syncBusy} size="sm" className="bg-lab-amber text-lab-bg hover:bg-lab-amber/90 font-mono">{syncBusy ? 'Generating…' : 'Generate my sync code'}</Button>
          )}
          <div className="flex gap-2">
            <Input value={syncInput} onChange={(e) => setSyncInput(e.target.value.toUpperCase())} placeholder="Enter a code from another device" maxLength={8} className="bg-lab-panel-strong border-lab-line text-lab-text font-mono" />
            <Button onClick={handlePull} disabled={syncBusy || syncInput.trim().length < 4} variant="outline" className="border-2 border-lab-line font-mono">Load</Button>
          </div>
          {syncMessage && <p className="text-xs font-mono text-lab-text-muted">{syncMessage}</p>}
        </CardContent>
      </Card>
    </div>
  )
}

export { HistoryIcon }
