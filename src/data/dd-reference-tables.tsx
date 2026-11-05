import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { REGULATORS } from './dd-regulators'
import { PROGRAMS } from './dd-programs'
import { Globe2, Library } from 'lucide-react'

// ---------------------------------------------------------------------------
// Designation-program comparison — all 21 authorities' expedited/special
// designation programs and pivotal-evidence conventions side by side.
// ---------------------------------------------------------------------------

export function DesignationComparisonTable() {
  return (
    <Card className="bg-lab-panel/80 border-lab-line">
      <CardHeader className="pb-2">
        <CardTitle className="font-mono text-sm text-lab-amber flex items-center gap-2"><Globe2 className="size-4" />Designation Programs — All 21 Authorities</CardTitle>
        <CardDescription className="text-xs text-lab-text-muted">Program names and conventions genuinely differ by authority — pursuing the wrong one wastes real time.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {REGULATORS.map((r) => (
          <div key={r.key} className="rounded border border-lab-line p-2.5">
            <div className="flex items-center justify-between flex-wrap gap-1">
              <p className="font-mono font-bold text-sm" style={{ color: r.color }}>{r.name}</p>
              <div className="flex gap-1">
                {r.requiresTwoPivotal && <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-lab-panel-strong text-lab-gold">2 pivotal</span>}
                {r.acceleratedPathway && <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-lab-panel-strong text-lab-emerald">accelerated</span>}
              </div>
            </div>
            <p className="text-xs text-lab-text mt-1">{r.designationProgramName}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Program library — all curated programs' baseline cost/timeline/risk
// profile side by side, for comparing modalities before playing.
// ---------------------------------------------------------------------------

export function ProgramLibraryTable() {
  return (
    <Card className="bg-lab-panel/80 border-lab-line">
      <CardHeader className="pb-2">
        <CardTitle className="font-mono text-sm text-lab-amber flex items-center gap-2"><Library className="size-4" />Program Library — Benchmark Comparison</CardTitle>
        <CardDescription className="text-xs text-lab-text-muted">Baseline cost, timeline, and risk profile for every curated program, before any decisions are made.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {PROGRAMS.map((p) => (
          <div key={p.id} className="rounded border border-lab-line p-2.5">
            <div className="flex items-center justify-between flex-wrap gap-1">
              <p className="font-mono font-bold text-sm text-lab-text">{p.drug} <span className="text-lab-text-muted text-xs">{p.code}</span></p>
              <span className="text-[10px] font-mono text-lab-amber">~${p.baseCostM}M · ~{p.baseMonths}mo</span>
            </div>
            <p className="text-xs text-lab-text-muted mt-1">{p.area} — {p.modality}</p>
            <div className="flex gap-1.5 mt-1.5">
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-lab-panel-strong text-lab-text-muted">{p.validationStrength === 'genetic_human' ? 'Strong validation' : p.validationStrength === 'model_only' ? 'Model-only validation' : 'In vitro only'}</span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-lab-panel-strong text-lab-text-muted">{p.designationFit === 'eligible' ? 'Designation eligible' : 'Not designation-eligible'}</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
