import { useMemo, useState } from 'react'
import { useQuery, api } from '@/lib/backend'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PROGRAMS } from './dd-programs'
import { REGULATORS } from './dd-regulators'
import { GLOSSARY, RMP_NOTE } from './dd-reference'
import { DesignationComparisonTable, ProgramLibraryTable } from './dd-reference-tables'
import { Trophy } from 'lucide-react'

export function LeaderboardTab() {
  const [filterProgram, setFilterProgram] = useState<string | 'all'>('all')
  const [filterAuthority, setFilterAuthority] = useState<string | 'all'>('all')
  const entries = useQuery(api.leaderboard.top, { programId: filterProgram !== 'all' ? filterProgram : undefined, authorityKey: filterAuthority !== 'all' ? filterAuthority : undefined })
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5">
        <Button onClick={() => setFilterProgram('all')} variant="outline" size="sm" className={`border-2 font-mono text-[11px] ${filterProgram === 'all' ? 'border-lab-amber text-lab-amber' : 'border-lab-line text-lab-text-muted'}`}>All programs</Button>
        {PROGRAMS.map((p) => (
          <Button key={p.id} onClick={() => setFilterProgram(p.id)} variant="outline" size="sm" className={`border-2 font-mono text-[11px] ${filterProgram === p.id ? 'border-lab-amber text-lab-amber' : 'border-lab-line text-lab-text-muted'}`}>{p.drug}</Button>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5">
        <Button onClick={() => setFilterAuthority('all')} variant="outline" size="sm" className={`border-2 font-mono text-[11px] ${filterAuthority === 'all' ? 'border-lab-violet text-lab-violet' : 'border-lab-line text-lab-text-muted'}`}>All authorities</Button>
        {REGULATORS.map((r) => (
          <Button key={r.key} onClick={() => setFilterAuthority(r.key)} variant="outline" size="sm" className={`border-2 font-mono text-[11px] ${filterAuthority === r.key ? 'border-lab-violet text-lab-violet' : 'border-lab-line text-lab-text-muted'}`}>{r.name}</Button>
        ))}
      </div>
      <Card className="bg-lab-panel/80 border-lab-line">
        <CardContent className="pt-4">
          {entries === undefined ? <p className="text-sm text-lab-text-muted">Loading…</p> : entries.length === 0 ? <p className="text-sm text-lab-text-muted">No runs submitted yet for this filter.</p> : (
            <ol className="space-y-1.5">
              {entries.map((e: any, i: number) => (
                <li key={e._id} className="flex justify-between text-sm font-mono">
                  <span className="text-lab-text-muted flex items-center gap-1.5">{i === 0 && <Trophy className="size-3.5 text-lab-gold" />}{i + 1}. {e.name} — {e.programName} @ {e.authorityName ?? 'FDA'}</span>
                  <span className={e.approved ? 'text-lab-emerald' : 'text-lab-text'}>{e.verdict.replace(/_/g, ' ')} · {e.pct.toFixed(0)}%</span>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export function GlossaryTab() {
  const [q, setQ] = useState('')
  const groups = useMemo(() => {
    const filtered = GLOSSARY.filter((g) => g.term.toLowerCase().includes(q.toLowerCase()) || g.body.toLowerCase().includes(q.toLowerCase()))
    const map = new Map<string, typeof GLOSSARY>()
    for (const e of filtered) map.set(e.group, [...(map.get(e.group) ?? []), e])
    return [...map.entries()]
  }, [q])
  return (
    <div className="space-y-4">
      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter terms…" className="bg-lab-panel-strong border-lab-line text-lab-text font-mono" />
      {groups.map(([group, entries]) => (
        <Card key={group} className="bg-lab-panel/80 border-lab-line">
          <CardHeader className="pb-2"><CardTitle className="font-mono text-sm text-lab-amber">{group}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {entries.map((e) => (
              <div key={e.term}><p className="font-mono font-bold text-lab-text text-sm">{e.term}</p><p className="text-sm text-lab-text-muted mt-1">{e.body}</p></div>
            ))}
          </CardContent>
        </Card>
      ))}
      <Card className="bg-lab-panel/80 border-lab-line">
        <CardHeader className="pb-2"><CardTitle className="font-mono text-sm text-lab-blue">Risk Management Plan (RMP)</CardTitle></CardHeader>
        <CardContent><p className="text-sm text-lab-text">{RMP_NOTE}</p></CardContent>
      </Card>
      <DesignationComparisonTable />
      <ProgramLibraryTable />
    </div>
  )
}
