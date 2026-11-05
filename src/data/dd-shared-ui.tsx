import { useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { REGULATORS, getRegulator } from './dd-regulators'
import { reviewVerdict, findEarliestFailurePoint } from './dd-engine'
import type { Grade, Program, StageKey, StageOutcome } from './dd-types'
import { Activity, CheckCircle2, CircleAlert, CircleSlash, Factory, Download, Globe2, Search } from 'lucide-react'

export function downloadTextFile(filename: string, text: string) {
  const blob = new Blob([text], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function downloadBlobFile(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function TabButton({ active, onClick, icon: Icon, children }: { active: boolean; onClick: () => void; icon?: typeof Activity; children: React.ReactNode }) {
  return (
    <Button onClick={onClick} variant="outline" size="sm" className={`border-2 font-mono text-xs gap-1.5 ${active ? 'border-lab-amber text-lab-amber glow-amber' : 'border-lab-line text-lab-text-muted'}`}>
      {Icon && <Icon className="size-3.5" />}
      {children}
    </Button>
  )
}

export function GradeRow({ grade }: { grade: Grade }) {
  const tone = grade.verdict === 'best' ? { border: 'border-lab-emerald', bg: 'bg-lab-emerald-soft', text: 'text-lab-emerald', label: 'Best practice', Icon: CheckCircle2 }
    : grade.verdict === 'acceptable' ? { border: 'border-lab-gold', bg: 'bg-lab-gold-soft', text: 'text-lab-gold', label: 'Defensible', Icon: CircleAlert }
    : { border: 'border-lab-red', bg: 'bg-lab-red-soft', text: 'text-lab-red', label: 'Design error', Icon: CircleSlash }
  return (
    <div className={`rounded-lg border ${tone.border} ${tone.bg} p-3`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-sm font-medium text-lab-text">{grade.title}</span>
        <span className={`flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider ${tone.text}`}><tone.Icon className="size-3" />{tone.label} · {grade.points}/{grade.maxPoints}</span>
      </div>
      <p className="mt-1 font-mono text-xs text-lab-text-muted">You chose: {grade.chosenLabel}</p>
      <p className="mt-2 text-sm leading-relaxed text-lab-text">{grade.explanation}</p>
      <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-lab-text-muted/70">{grade.reference}</p>
    </div>
  )
}

export type Step = 'select' | 'brief' | 'discovery' | 'discoveryR' | 'preclinical' | 'preclinicalR' | 'cmc' | 'cmcR' | 'clinical' | 'clinicalR' | 'submission' | 'submissionMeeting' | 'submissionR' | 'phaseIV' | 'phaseIVClassify' | 'report'

export function stageNumberOf(step: Step): number {
  if (step === 'brief' || step === 'discovery' || step === 'discoveryR') return 1
  if (step === 'preclinical' || step === 'preclinicalR') return 2
  if (step === 'cmc' || step === 'cmcR') return 3
  if (step === 'clinical' || step === 'clinicalR') return 4
  if (step === 'submission' || step === 'submissionMeeting' || step === 'submissionR') return 5
  if (step === 'phaseIV' || step === 'phaseIVClassify') return 6
  if (step === 'report') return 7
  return 0
}

export function ProgressTracker({ step }: { step: Step }) {
  const current = stageNumberOf(step)
  if (current === 0) return null
  const nodes = [
    { n: 1, label: 'Discovery' }, { n: 2, label: 'Preclinical' }, { n: 3, label: 'CMC' }, { n: 4, label: 'Clinical' }, { n: 5, label: 'Submit' }, { n: 6, label: 'Phase IV' }, { n: 7, label: 'Review' },
  ]
  return (
    <div className="flex items-center overflow-x-auto">
      {nodes.map((node, i) => {
        const done = current > node.n
        const isCurrent = current === node.n
        return (
          <div key={node.n} className="flex items-center flex-1 last:flex-none min-w-[44px]">
            <div className="flex flex-col items-center gap-1">
              <div className={`flex items-center justify-center size-6 rounded-full border-2 font-mono text-[10px] shrink-0 transition-all ${done ? 'border-lab-emerald bg-lab-emerald-soft text-lab-emerald' : isCurrent ? 'border-lab-amber bg-lab-amber-soft text-lab-amber glow-amber' : 'border-lab-line text-lab-text-muted'}`}>
                {done ? <CheckCircle2 className="size-3.5" /> : node.n}
              </div>
              <span className={`text-[8px] font-mono uppercase whitespace-nowrap ${isCurrent ? 'text-lab-amber' : done ? 'text-lab-emerald' : 'text-lab-text-muted'}`}>{node.label}</span>
            </div>
            {i < nodes.length - 1 && <div className={`h-0.5 flex-1 mx-1 mb-4 ${current > node.n ? 'bg-lab-emerald' : 'bg-lab-line'}`} />}
          </div>
        )
      })}
    </div>
  )
}

export const STAGE_COLORS: Record<StageKey, string> = { discovery: '#f0a838', preclinical: '#38c0e0', cmc: '#8a6fe8', clinical: '#e85f5f', submission: '#4ade95' }
export const STAGE_LABELS: Record<StageKey, string> = { discovery: 'Discovery', preclinical: 'Preclinical', cmc: 'CMC', clinical: 'Clinical', submission: 'Submission' }

export function TimelineDiagram({ outcomes, baseMonths, baseCostM }: { outcomes: StageOutcome[]; baseMonths: number; baseCostM: number }) {
  const svgRef = useRef<SVGSVGElement>(null)
  if (outcomes.length === 0) return null
  const totalMonths = outcomes.reduce((a, o) => a + o.monthsAdded, 0)
  const totalCostM = outcomes.reduce((a, o) => a + o.costAddedM, 0)
  const W = 560
  const barY = 40
  const barH = 28
  let x = 10
  const barMaxW = W - 20

  function downloadImage() {
    if (!svgRef.current) return
    const clone = svgRef.current.cloneNode(true) as SVGSVGElement
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    const source = new XMLSerializer().serializeToString(clone)
    const blob = new Blob([source], { type: 'image/svg+xml' })
    downloadBlobFile('development-timeline.svg', blob)
  }

  return (
    <Card className="bg-lab-panel/80 border-lab-line glow-amber">
      <CardHeader className="pb-2"><CardTitle className="font-mono text-sm text-lab-amber flex items-center gap-2"><Factory className="size-4" />Timeline &amp; Cost</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="overflow-x-auto rounded border border-lab-line">
          <svg ref={svgRef} viewBox={`0 0 ${W} 100`} className="w-full" style={{ minWidth: 300 }}>
            <rect x={0} y={0} width={W} height={100} fill="#0f1524" />
            {outcomes.map((o) => {
              const w = Math.max(14, (o.monthsAdded / totalMonths) * barMaxW)
              const seg = <rect key={o.stage} x={x} y={barY} width={w} height={barH} fill={STAGE_COLORS[o.stage]} />
              x += w
              return seg
            })}
            {(() => { x = 10; return outcomes.map((o) => {
              const w = Math.max(14, (o.monthsAdded / totalMonths) * barMaxW)
              const label = <text key={`${o.stage}-label`} x={x + w / 2} y={barY - 6} fontSize={8} fontFamily="monospace" fill="#9aa5b8" textAnchor="middle">{STAGE_LABELS[o.stage]}</text>
              x += w
              return label
            }) })()}
            <text x={10} y={90} fontSize={10} fontFamily="monospace" fill="#eef2f7">Total: ~{totalMonths} months · ~${totalCostM}M</text>
          </svg>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {outcomes.map((o) => (
            <div key={o.stage} className="flex items-center justify-between text-[11px] font-mono rounded border border-lab-line px-2 py-1">
              <span style={{ color: STAGE_COLORS[o.stage] }}>{STAGE_LABELS[o.stage]}</span>
              <span className="text-lab-text-muted">{o.monthsAdded}mo · ${o.costAddedM}M</span>
            </div>
          ))}
        </div>
        <p className="text-xs font-mono text-lab-text-muted">Baseline for this program (no design errors): ~{baseMonths} months · ~${baseCostM}M. Skipped meetings and design errors add real time and cost, shown above as they accumulate.</p>
        <Button onClick={downloadImage} variant="outline" size="sm" className="w-full border-2 border-lab-line font-mono gap-1.5"><Download className="size-3.5" />Save timeline as image (SVG)</Button>
      </CardContent>
    </Card>
  )
}

export function AuthorityComparisonCard({ program, discovery, preclinical, cmc, clinical, submission, grades, primaryAuthorityKey }: {
  program: Program; discovery: StageOutcome; preclinical: StageOutcome; cmc: StageOutcome; clinical: StageOutcome; submission: StageOutcome; grades: Grade[]; primaryAuthorityKey: string
}) {
  const [compareKey, setCompareKey] = useState<string | null>(null)
  const compareReport = useMemo(() => (compareKey ? reviewVerdict(program, discovery, preclinical, cmc, clinical, submission, grades, compareKey) : null), [compareKey, program, discovery, preclinical, cmc, clinical, submission, grades])
  const options = REGULATORS.filter((r) => r.key !== primaryAuthorityKey)

  return (
    <Card className="bg-lab-panel/80 border-lab-line">
      <CardHeader className="pb-2">
        <CardTitle className="font-mono text-sm text-lab-violet flex items-center gap-2"><Globe2 className="size-4" />Compare with another authority</CardTitle>
        <CardDescription className="text-xs text-lab-text-muted">Same locked-in program data, reviewed under a different authority's conventions.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {options.map((r) => (
            <Button key={r.key} onClick={() => setCompareKey(r.key)} variant="outline" size="sm" className={`border-2 font-mono text-[11px] ${compareKey === r.key ? 'border-lab-violet text-lab-violet glow-violet' : 'border-lab-line text-lab-text-muted'}`}>{r.name}</Button>
          ))}
        </div>
        {compareReport && compareKey && (
          <div className="rounded border-2 border-lab-violet bg-lab-violet-soft p-3 space-y-2" style={{ animation: 'fadeInUp 0.3s ease-out' }}>
            <p className="font-mono font-bold text-lab-violet">{getRegulator(compareKey).name}: {compareReport.verdictLabel}</p>
            <p className="text-sm text-lab-text">{compareReport.verdictSummary}</p>
            {compareReport.deficiencies.length > 0 && <ul className="text-xs text-lab-text-muted list-disc list-inside space-y-0.5">{compareReport.deficiencies.map((d, i) => <li key={i}>{d}</li>)}</ul>}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function PostMortemCard({ grades }: { grades: Grade[] }) {
  const earliest = findEarliestFailurePoint(grades)
  if (!earliest) return null
  return (
    <Card className="bg-lab-panel/80 border-2 border-lab-red glow-red">
      <CardHeader className="pb-2"><CardTitle className="font-mono text-sm text-lab-red flex items-center gap-2"><Search className="size-4" />Where it went wrong</CardTitle>
        <CardDescription className="text-xs text-lab-text-muted">The earliest design error in the program, chronologically — often the root cause everything downstream traces back to.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="font-mono font-bold text-sm text-lab-red">[{earliest.stage.toUpperCase()}] {earliest.title}</p>
        <p className="font-mono text-xs text-lab-text-muted">You chose: {earliest.chosenLabel}</p>
        <p className="text-sm text-lab-text">{earliest.explanation}</p>
      </CardContent>
    </Card>
  )
}
