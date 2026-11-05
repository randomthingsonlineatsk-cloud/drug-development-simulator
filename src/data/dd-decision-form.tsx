import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { buildDecisions } from './dd-decisions'
import { GradeRow } from './dd-shared-ui'
import type { Choices, Grade, Program, StageKey, StageOutcome } from './dd-types'
import { ArrowLeft, ArrowRight, CheckCircle2, CircleAlert, CircleSlash } from 'lucide-react'

export type Difficulty = 'guided' | 'expert'

export interface DecisionFormProps { program: Program; stage: StageKey; choices: Choices; setChoices: (c: Choices) => void; difficulty: Difficulty; onSubmit: () => void; submitLabel: string; onBack?: () => void; backLabel?: string; extra?: React.ReactNode }

export function DecisionForm({ program, stage, choices, setChoices, difficulty, onSubmit, submitLabel, onBack, backLabel, extra }: DecisionFormProps) {
  const decisions = useMemo(() => buildDecisions(program, stage), [program, stage])
  const [revealed, setRevealed] = useState<Record<string, boolean>>({})
  const complete = decisions.every((d) => choices[d.id])

  function select(decisionId: string, optionId: string) {
    setChoices({ ...choices, [decisionId]: optionId })
    if (difficulty === 'expert') setRevealed((r) => ({ ...r, [decisionId]: true }))
  }

  return (
    <div className="space-y-4">
      {onBack && <Button onClick={onBack} variant="ghost" size="sm" className="text-lab-text-muted font-mono gap-1.5 -mb-1"><ArrowLeft className="size-3.5" />{backLabel ?? 'Back'}</Button>}
      {decisions.map((d, i) => (
        <Card key={d.id} className="bg-lab-panel/80 border-lab-line" style={{ animation: `fadeInUp 0.3s ease-out ${i * 0.03}s both` }}>
          <CardHeader className="pb-2">
            <span className="text-[10px] font-mono text-lab-text-muted uppercase">Decision {i + 1}</span>
            <CardTitle className="font-mono text-sm text-lab-text">{d.title}</CardTitle>
            <CardDescription className="text-xs text-lab-text-muted">{d.prompt}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {d.options.map((o) => {
              const active = choices[d.id] === o.id
              const showDetail = difficulty === 'guided' || revealed[d.id]
              return (
                <Button key={o.id} onClick={() => select(d.id, o.id)} variant="outline" className={`w-full h-auto justify-start text-left border-2 font-mono ${active ? 'border-lab-amber text-lab-amber bg-lab-amber-soft glow-amber' : 'border-lab-line text-lab-text-muted'}`}>
                  <span className="flex flex-col items-start gap-1 py-1">
                    <span className="text-sm text-lab-text whitespace-normal">{o.label}</span>
                    {showDetail && <span className="text-xs text-lab-text-muted whitespace-normal font-sans">{o.detail}</span>}
                  </span>
                </Button>
              )
            })}
          </CardContent>
        </Card>
      ))}
      {complete && extra}
      <Button onClick={onSubmit} disabled={!complete} className="w-full bg-lab-amber text-lab-bg hover:bg-lab-amber/90 font-mono gap-1.5">
        {complete ? submitLabel : 'Answer every decision to continue'}
        {complete && <ArrowRight className="size-4" />}
      </Button>
    </div>
  )
}

export function StageResultView({ outcome, grades, onNext, nextLabel }: { outcome: StageOutcome; grades: Grade[]; onNext: () => void; nextLabel: string }) {
  const tone = outcome.status === 'success' ? { border: 'border-lab-emerald', glow: 'glow-emerald', Icon: CheckCircle2, color: 'text-lab-emerald' }
    : outcome.status === 'mixed' ? { border: 'border-lab-gold', glow: 'glow-gold', Icon: CircleAlert, color: 'text-lab-gold' }
    : { border: 'border-lab-red', glow: 'glow-red', Icon: CircleSlash, color: 'text-lab-red' }
  return (
    <div className="space-y-4" style={{ animation: 'fadeInUp 0.3s ease-out' }}>
      <Card className={`bg-lab-panel/80 border-2 ${tone.border} ${tone.glow}`}>
        <CardHeader className="pb-2"><CardTitle className="font-mono text-base text-lab-text flex items-center gap-2"><tone.Icon className={`size-5 ${tone.color}`} />{outcome.headline}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-3">
            {outcome.metrics.map((m) => (
              <div key={m.label} className="rounded border border-lab-line bg-lab-panel-strong px-3 py-1.5">
                <p className="text-[10px] font-mono text-lab-text-muted uppercase">{m.label}</p>
                <p className="text-sm font-mono text-lab-amber">{m.value}</p>
              </div>
            ))}
            <div className="rounded border border-lab-line bg-lab-panel-strong px-3 py-1.5">
              <p className="text-[10px] font-mono text-lab-text-muted uppercase">Stage cost/time</p>
              <p className="text-sm font-mono text-lab-amber">{outcome.monthsAdded}mo · ${outcome.costAddedM}M</p>
            </div>
          </div>
          {outcome.narrative.map((n, i) => <p key={i} className="text-sm text-lab-text leading-relaxed">{n}</p>)}
        </CardContent>
      </Card>
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-widest font-mono text-lab-violet">Decision review — this stage</p>
        {grades.map((g) => <GradeRow key={g.decisionId} grade={g} />)}
      </div>
      <p className="text-center text-[10px] font-mono text-lab-text-muted">This stage is locked in — like a real program, results can't be undone, only built on.</p>
      <Button onClick={onNext} className="w-full bg-lab-gold text-lab-bg hover:bg-lab-gold/90 font-mono gap-1.5">{nextLabel} <ArrowRight className="size-4" /></Button>
    </div>
  )
}
