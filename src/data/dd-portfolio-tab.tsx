import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PROGRAMS, getProgram } from './dd-programs'
import type { Program } from './dd-types'
import { Briefcase } from 'lucide-react'

export const PORTFOLIO_BUDGET_M = 500
const FUNDING_TIERS = [
  { id: 'low', label: 'Low', amountM: 60 },
  { id: 'medium', label: 'Medium', amountM: 150 },
  { id: 'high', label: 'High', amountM: 280 },
] as const
type FundingTierId = typeof FUNDING_TIERS[number]['id']

const PORTFOLIO_RESULTS_KEY = 'dd_portfolio_results_v1'
export interface PortfolioResult { totalCostM: number; totalMonths: number; verdict: string }
function loadPortfolioResults(): Record<string, PortfolioResult> { try { const raw = localStorage.getItem(PORTFOLIO_RESULTS_KEY); return raw ? JSON.parse(raw) : {} } catch { return {} } }
export function savePortfolioResult(programId: string, result: PortfolioResult) {
  try {
    const all = loadPortfolioResults()
    all[programId] = result
    localStorage.setItem(PORTFOLIO_RESULTS_KEY, JSON.stringify(all))
  } catch { /* ignore */ }
}

function outlookFor(program: Program, allocatedM: number): { label: string; tone: 'good' | 'mixed' | 'poor'; note: string } {
  const adequacy = allocatedM / program.baseCostM
  const riskBase = program.validationStrength === 'genetic_human' ? 0 : program.validationStrength === 'model_only' ? 1 : 2
  if (adequacy < 0.5) return { label: 'Underfunded — likely to stall', tone: 'poor', note: `Allocated funding covers only ~${Math.round(adequacy * 100)}% of this program's typical cost to reach filing — a program this underfunded is likely to stall or require corner-cutting that increases risk elsewhere.` }
  if (adequacy < 0.85) {
    return riskBase >= 1
      ? { label: 'Tight funding on an already risky program', tone: 'mixed', note: `Funding covers ~${Math.round(adequacy * 100)}% of typical cost, and this program's target validation is not yet at the strongest level — a combination worth watching closely.` }
      : { label: 'Adequately funded, modest risk', tone: 'good', note: `Funding covers ~${Math.round(adequacy * 100)}% of typical cost against a program with a solid validation base — a reasonable position.` }
  }
  return { label: riskBase >= 1 ? 'Well-funded, inherently risky program' : 'Well-funded, lower-risk program', tone: riskBase >= 1 ? 'mixed' : 'good', note: `Funding covers ~${Math.round(adequacy * 100)}% of typical cost. ${riskBase >= 1 ? 'Adequate funding helps, but the underlying scientific risk (validation strength) is not something money alone resolves.' : 'Combined with a solid validation base, this program is well-positioned.'}` }
}

export function PortfolioTab({ onPlayProgram }: { onPlayProgram: (programId: string) => void }) {
  const [selected, setSelected] = useState<string[]>([])
  const [allocations, setAllocations] = useState<Record<string, FundingTierId>>({})
  const [results, setResults] = useState<Record<string, PortfolioResult>>(() => (typeof window !== 'undefined' ? loadPortfolioResults() : {}))

  useEffect(() => {
    const interval = setInterval(() => setResults(loadPortfolioResults()), 1500)
    return () => clearInterval(interval)
  }, [])

  function toggleProgram(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      if (prev.length >= 3) return prev
      return [...prev, id]
    })
  }
  function setTier(id: string, tier: FundingTierId) { setAllocations((prev) => ({ ...prev, [id]: tier })) }

  const totalAllocatedM = selected.reduce((sum, id) => {
    const tier = allocations[id]
    const t = FUNDING_TIERS.find((f) => f.id === tier)
    return sum + (t?.amountM ?? 0)
  }, 0)
  const overBudget = totalAllocatedM > PORTFOLIO_BUDGET_M

  return (
    <div className="space-y-4">
      <Card className="bg-lab-panel/80 border-lab-violet border-2 glow-violet">
        <CardHeader className="pb-2">
          <CardTitle className="font-mono text-sm text-lab-violet flex items-center gap-2"><Briefcase className="size-4" />Portfolio Mode</CardTitle>
          <CardDescription className="text-xs text-lab-text-muted">Pick up to 3 programs to fund simultaneously from a fixed ${PORTFOLIO_BUDGET_M}M R&amp;D budget. Play a program through the full flow (via the "Play" button) to replace the funding-adequacy estimate with your program's actual outcome.</CardDescription>
        </CardHeader>
      </Card>
      <div className="grid gap-2">
        {PROGRAMS.map((p) => {
          const isSelected = selected.includes(p.id)
          const played = results[p.id]
          return (
            <Card key={p.id} className={`bg-lab-panel/80 border-lab-line cursor-pointer transition-all ${isSelected ? 'border-lab-violet glow-violet' : 'hover:border-lab-line'}`} onClick={() => toggleProgram(p.id)}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <p className="font-mono font-bold text-lab-text">{p.drug} <span className="text-lab-text-muted text-xs">{p.code}</span></p>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-lab-panel-strong text-lab-amber">~${p.baseCostM}M typical</span>
                </div>
                <p className="text-xs text-lab-text-muted mt-1">{p.area}</p>
                {played && <p className="text-[10px] font-mono text-lab-emerald mt-1">Actual: {played.verdict.replace(/_/g, ' ')} · ~{played.totalMonths}mo · ~${played.totalCostM}M</p>}
                {isSelected && (
                  <div className="flex gap-2 mt-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
                    {FUNDING_TIERS.map((t) => (
                      <Button key={t.id} onClick={() => setTier(p.id, t.id)} size="sm" variant="outline" className={`flex-1 border-2 font-mono text-xs ${allocations[p.id] === t.id ? 'border-lab-violet text-lab-violet bg-lab-violet-soft' : 'border-lab-line text-lab-text-muted'}`}>{t.label} (${t.amountM}M)</Button>
                    ))}
                    <Button onClick={() => onPlayProgram(p.id)} size="sm" className="w-full bg-lab-amber text-lab-bg hover:bg-lab-amber/90 font-mono">Play this program →</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
      {selected.length > 0 && (
        <Card className={`bg-lab-panel/80 border-2 ${overBudget ? 'border-lab-red glow-red' : 'border-lab-emerald glow-emerald'}`}>
          <CardHeader className="pb-2"><CardTitle className="font-mono text-sm text-lab-text">Portfolio Summary</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm font-mono text-lab-text">Allocated: ${totalAllocatedM}M / ${PORTFOLIO_BUDGET_M}M budget {overBudget && <span className="text-lab-red">— over budget</span>}</p>
            {selected.map((id) => {
              const p = getProgram(id)!
              const played = results[id]
              if (played) {
                return (
                  <div key={id} className="rounded border border-lab-emerald bg-lab-emerald-soft text-lab-emerald p-2.5">
                    <p className="font-mono font-bold text-sm">{p.drug}: {played.verdict.replace(/_/g, ' ')} (actual result)</p>
                    <p className="text-xs text-lab-text mt-1">Actual program cost/time: ~{played.totalMonths} months · ~${played.totalCostM}M.</p>
                  </div>
                )
              }
              const tier = allocations[id]
              const t = FUNDING_TIERS.find((f) => f.id === tier)
              if (!t) return <p key={id} className="text-xs text-lab-text-muted font-mono">{p.drug}: choose a funding tier above.</p>
              const outlook = outlookFor(p, t.amountM)
              const tone = outlook.tone === 'good' ? 'border-lab-emerald bg-lab-emerald-soft text-lab-emerald' : outlook.tone === 'mixed' ? 'border-lab-gold bg-lab-gold-soft text-lab-gold' : 'border-lab-red bg-lab-red-soft text-lab-red'
              return (
                <div key={id} className={`rounded border p-2.5 ${tone}`}>
                  <p className="font-mono font-bold text-sm">{p.drug}: {outlook.label}</p>
                  <p className="text-xs text-lab-text mt-1">{outlook.note}</p>
                </div>
              )
            })}
            <p className="text-xs text-lab-text-muted font-mono">Diversifying across risk profiles (pairing a high-risk, high-reward program like a gene therapy with a lower-risk one like a complex generic) is a standard portfolio-management principle.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
