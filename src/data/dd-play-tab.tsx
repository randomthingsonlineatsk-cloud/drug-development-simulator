import { useEffect, useState } from 'react'
import { useMutation, api } from '@/lib/backend'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PROGRAMS, getProgram } from './dd-programs'
import { generateProgram, GENERATOR_ARCHETYPE_COUNT } from './dd-generator'
import { REGULATORS, getRegulator, applicationName } from './dd-regulators'
import { buildDecisions } from './dd-decisions'
import {
  gradeStage, makeSeed, runDiscovery, runPreclinical, runCmc, runClinical, runSubmission, reviewVerdict,
  runRegulatoryMeeting, type MeetingFeedback,
} from './dd-engine'
import { buildCtdDocumentBlob } from './dd-ctd-export'
import type { Choices, FinalReport, Grade, Program, StageOutcome, PhaseIvEvent } from './dd-types'
import { PHASE_IV_EVENTS } from './dd-reference'
import { DecisionForm, StageResultView, type Difficulty } from './dd-decision-form'
import {
  downloadTextFile, downloadBlobFile, GradeRow, ProgressTracker, STAGE_LABELS, TimelineDiagram,
  AuthorityComparisonCard, PostMortemCard, type Step,
} from './dd-shared-ui'
import { savePortfolioResult } from './dd-portfolio-tab'
import { appendHistory } from './dd-history-tab'
import {
  FlaskConical, ShieldCheck, ShieldAlert, CheckCircle2, CircleAlert, RotateCcw, ArrowRight, ArrowLeft,
  Dna, BookOpen, History as HistoryIcon, Users, X, FileText, Globe2, Trophy, FileType,
} from 'lucide-react'

export type PlayMode = 'curated' | 'endless'

interface SavedRun {
  mode: PlayMode
  difficulty: Difficulty
  authorityKey: string
  program: Program
  step: Step
  choices: Choices
  discovery: StageOutcome | null
  preclinical: StageOutcome | null
  cmc: StageOutcome | null
  clinical: StageOutcome | null
  submission: StageOutcome | null
  grades: Grade[]
  report: FinalReport | null
  meetingTaken: boolean
  meetingFeedback: MeetingFeedback | null
  redesignCount: number
  phaseIvEvent: PhaseIvEvent
  phaseIvOutcomeNote: string | null
}
const ACTIVE_RUN_KEY = 'dd_active_run_v2'
function saveActiveRun(run: SavedRun) { try { localStorage.setItem(ACTIVE_RUN_KEY, JSON.stringify(run)) } catch { /* ignore */ } }
function loadActiveRun(): SavedRun | null { try { const raw = localStorage.getItem(ACTIVE_RUN_KEY); return raw ? JSON.parse(raw) : null } catch { return null } }
function clearActiveRun() { try { localStorage.removeItem(ACTIVE_RUN_KEY) } catch { /* ignore */ } }

export function PlayTab({ pendingProgramId, onConsumePending }: { pendingProgramId: string | null; onConsumePending: () => void }) {
  const [mode, setMode] = useState<PlayMode>('curated')
  const [difficulty, setDifficulty] = useState<Difficulty>('guided')
  const [authorityKey, setAuthorityKey] = useState('FDA')
  const [program, setProgram] = useState<Program | null>(null)
  const [step, setStep] = useState<Step>('select')
  const [choices, setChoices] = useState<Choices>({})
  const [discovery, setDiscovery] = useState<StageOutcome | null>(null)
  const [preclinical, setPreclinical] = useState<StageOutcome | null>(null)
  const [cmc, setCmc] = useState<StageOutcome | null>(null)
  const [clinical, setClinical] = useState<StageOutcome | null>(null)
  const [submission, setSubmission] = useState<StageOutcome | null>(null)
  const [grades, setGrades] = useState<Grade[]>([])
  const [seed] = useState(() => makeSeed())
  const [report, setReport] = useState<FinalReport | null>(null)
  const [meetingTaken, setMeetingTaken] = useState(false)
  const [meetingFeedback, setMeetingFeedback] = useState<MeetingFeedback | null>(null)
  const [redesignCount, setRedesignCount] = useState(0)
  const [phaseIvEvent, setPhaseIvEvent] = useState<PhaseIvEvent>(PHASE_IV_EVENTS[0])
  const [phaseIvOutcomeNote, setPhaseIvOutcomeNote] = useState<string | null>(null)
  const [pvSeriousness, setPvSeriousness] = useState<string | null>(null)
  const [pvExpectedness, setPvExpectedness] = useState<string | null>(null)
  const [playerName, setPlayerName] = useState('')
  const [scoreSubmitted, setScoreSubmitted] = useState(false)
  const [ctdBusy, setCtdBusy] = useState(false)
  const [resumeAvailable, setResumeAvailable] = useState<SavedRun | null>(() => {
    if (typeof window === 'undefined') return null
    const saved = loadActiveRun()
    return saved && saved.step !== 'select' ? saved : null
  })

  const submitScore = useMutation(api.leaderboard.submit)

  useEffect(() => {
    if (pendingProgramId) {
      const p = getProgram(pendingProgramId)
      if (p) pickProgram(p)
      onConsumePending()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingProgramId])

  useEffect(() => {
    if (typeof window === 'undefined' || !program || step === 'select') return
    saveActiveRun({ mode, difficulty, authorityKey, program, step, choices, discovery, preclinical, cmc, clinical, submission, grades, report, meetingTaken, meetingFeedback, redesignCount, phaseIvEvent, phaseIvOutcomeNote })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, difficulty, authorityKey, program, step, choices, discovery, preclinical, cmc, clinical, submission, grades, report, meetingTaken, meetingFeedback, redesignCount, phaseIvEvent, phaseIvOutcomeNote])

  function resumeSavedRun() {
    if (!resumeAvailable) return
    const r = resumeAvailable
    setMode(r.mode); setDifficulty(r.difficulty); setAuthorityKey(r.authorityKey); setProgram(r.program); setStep(r.step); setChoices(r.choices)
    setDiscovery(r.discovery); setPreclinical(r.preclinical); setCmc(r.cmc); setClinical(r.clinical); setSubmission(r.submission)
    setGrades(r.grades); setReport(r.report); setMeetingTaken(r.meetingTaken); setMeetingFeedback(r.meetingFeedback); setRedesignCount(r.redesignCount)
    setPhaseIvEvent(r.phaseIvEvent); setPhaseIvOutcomeNote(r.phaseIvOutcomeNote)
    setResumeAvailable(null)
  }
  function discardSavedRun() { clearActiveRun(); setResumeAvailable(null) }

  function pickProgram(p: Program) {
    setProgram(p); setStep('brief'); setChoices({}); setDiscovery(null); setPreclinical(null); setCmc(null); setClinical(null); setSubmission(null); setGrades([]); setReport(null); setScoreSubmitted(false)
    setMeetingTaken(false); setMeetingFeedback(null); setRedesignCount(0); setPhaseIvOutcomeNote(null); setPvSeriousness(null); setPvExpectedness(null)
  }
  function pickGenerated() { pickProgram(generateProgram()) }
  function startOver() {
    clearActiveRun()
    setProgram(null); setStep('select'); setChoices({}); setDiscovery(null); setPreclinical(null); setCmc(null); setClinical(null); setSubmission(null); setGrades([]); setReport(null); setScoreSubmitted(false)
    setMeetingTaken(false); setMeetingFeedback(null); setRedesignCount(0); setPhaseIvOutcomeNote(null); setPvSeriousness(null); setPvExpectedness(null)
  }

  function submitDiscovery() {
    if (!program) return
    const g = gradeStage(program, 'discovery', choices)
    setGrades((prev) => [...prev.filter((x) => x.stage !== 'discovery'), ...g])
    setDiscovery(runDiscovery(program, choices, seed))
    setStep('discoveryR')
  }
  function submitPreclinical() {
    if (!program || !discovery) return
    const g = gradeStage(program, 'preclinical', choices)
    setGrades((prev) => [...prev.filter((x) => x.stage !== 'preclinical'), ...g])
    setPreclinical(runPreclinical(program, choices, discovery, seed))
    setStep('preclinicalR')
  }
  function submitCmc() {
    if (!program) return
    const g = gradeStage(program, 'cmc', choices)
    setGrades((prev) => [...prev.filter((x) => x.stage !== 'cmc'), ...g])
    setCmc(runCmc(program, choices, seed))
    setStep('cmcR')
  }
  function submitClinical() {
    if (!program || !preclinical) return
    const g = gradeStage(program, 'clinical', choices)
    setGrades((prev) => [...prev.filter((x) => x.stage !== 'clinical'), ...g])
    setClinical(runClinical(program, choices, preclinical, seed))
    setStep('clinicalR')
  }
  function requestSubmissionMeeting() {
    if (!program) return
    setMeetingFeedback(runRegulatoryMeeting(program, choices))
    setMeetingTaken(true)
    setStep('submissionMeeting')
  }
  function finalizeSubmission() {
    if (!program || !discovery || !preclinical || !cmc || !clinical) return
    const g = gradeStage(program, 'submission', choices)
    const allGrades = [...grades.filter((x) => x.stage !== 'submission'), ...g]
    setGrades(allGrades)
    const priorFlags = [...discovery.flags, ...preclinical.flags, ...cmc.flags, ...clinical.flags]
    const sub = runSubmission(program, choices, priorFlags, seed)
    setSubmission(sub)
    const finalReport = reviewVerdict(program, discovery, preclinical, cmc, clinical, sub, allGrades, authorityKey)
    setReport(finalReport)
    savePortfolioResult(program.id, { totalCostM: finalReport.totalCostM, totalMonths: finalReport.totalMonths, verdict: finalReport.verdict })
    if (finalReport.verdict === 'approvable' || finalReport.verdict === 'advisory_committee_then_approvable') {
      setPhaseIvEvent(finalReport.verdict === 'advisory_committee_then_approvable' ? PHASE_IV_EVENTS[1] : PHASE_IV_EVENTS[0])
      setStep('phaseIV')
    } else setStep('report')
    if (typeof window !== 'undefined') appendHistory({ ts: Date.now(), programId: program.id, programName: program.drug, verdict: finalReport.verdict, score: finalReport.score, maxScore: finalReport.maxScore })
  }
  function redesignSubmission() {
    setStep('submission'); setRedesignCount((n) => n + 1); setMeetingTaken(false); setMeetingFeedback(null)
  }

  function goToPvClassifyOrChoice() {
    if (phaseIvEvent === PHASE_IV_EVENTS[0]) setStep('phaseIVClassify')
  }
  function resolvePhaseIV(goodResponse: boolean) {
    if (!report) return
    setPhaseIvOutcomeNote(goodResponse ? phaseIvEvent.goodNote : phaseIvEvent.badNote)
    setStep('report')
  }

  async function handleSubmitScore() {
    if (!program || !report) return
    const name = playerName.trim()
    if (!name || scoreSubmitted) return
    setScoreSubmitted(true)
    const authority = getRegulator(authorityKey)
    try {
      await submitScore({ name, programId: program.id, programName: program.drug, authorityKey, authorityName: authority.name, verdict: report.verdict, approved: report.verdict === 'approvable' || report.verdict === 'advisory_committee_then_approvable', score: report.score, maxScore: report.maxScore })
    } catch { setScoreSubmitted(false) }
  }

  function downloadReport() {
    if (!program || !report) return
    const lines: string[] = []
    lines.push('Drug Development Simulator — Development Program Report')
    lines.push(`${program.drug} (${program.code}) — ${program.indication}`)
    lines.push(`Reviewing authority: ${getRegulator(authorityKey).name}`)
    lines.push(`Verdict: ${report.verdictLabel}`)
    lines.push(`Score: ${report.score}/${report.maxScore}`)
    lines.push(`Total timeline/cost: ~${report.totalMonths} months · ~$${report.totalCostM}M`)
    const stageOutcomes = [discovery, preclinical, cmc, clinical, submission].filter(Boolean) as StageOutcome[]
    lines.push('Stage-by-stage breakdown:')
    stageOutcomes.forEach((o) => lines.push(`  ${STAGE_LABELS[o.stage]}: ${o.monthsAdded} months, $${o.costAddedM}M`))
    lines.push(''); lines.push(report.verdictSummary); lines.push('')
    if (report.deficiencies.length) { lines.push('Deficiencies:'); report.deficiencies.forEach((d) => lines.push(`  - ${d}`)); lines.push('') }
    if (report.strengths.length) { lines.push('Strengths:'); report.strengths.forEach((d) => lines.push(`  - ${d}`)); lines.push('') }
    lines.push('Decisions:')
    report.grades.forEach((g) => { lines.push(`  [${g.stage.toUpperCase()}] ${g.title}: ${g.chosenLabel} — ${g.verdict} (${g.points}/${g.maxPoints})`); lines.push(`    ${g.explanation}`) })
    if (phaseIvOutcomeNote) { lines.push(''); lines.push('Phase IV outcome:'); lines.push(`  ${phaseIvOutcomeNote}`) }
    lines.push(''); lines.push('A downloadable timeline image and CTD-style Word document are also available separately.')
    lines.push(''); lines.push('All compounds, targets, and outcomes are entirely fictional, for educational use only.'); lines.push('built by Khan Gulrez Shagufa Fazal Ahmed')
    downloadTextFile(`drug-development-simulator-${program.id}-report.txt`, lines.join('\n'))
  }

  async function downloadCtdDocument() {
    if (!program || !report) return
    setCtdBusy(true)
    try {
      const blob = await buildCtdDocumentBlob(program, report, discovery, preclinical, cmc, clinical, submission, getRegulator(authorityKey).name, applicationName(authorityKey, program.modalityKey))
      downloadBlobFile(`${program.id}-ctd-overview.docx`, blob)
    } finally { setCtdBusy(false) }
  }

  const midRun = step !== 'select'
  const abandonControl = midRun && step !== 'report' ? (
    <div className="flex justify-end"><Button onClick={startOver} variant="ghost" size="sm" className="text-lab-text-muted font-mono gap-1.5 h-7"><X className="size-3.5" />Abandon &amp; start over</Button></div>
  ) : null
  const progressBar = midRun ? <ProgressTracker step={step} /> : null
  const outcomesSoFar = [discovery, preclinical, cmc, clinical, submission].filter(Boolean) as StageOutcome[]

  if (step === 'select' || !program) {
    return (
      <div className="space-y-4">
        {resumeAvailable && (
          <Card className="bg-lab-panel/80 border-2 border-lab-gold glow-gold">
            <CardContent className="pt-4 space-y-2">
              <p className="text-sm text-lab-text flex items-center gap-2"><HistoryIcon className="size-4 text-lab-gold shrink-0" />You have an in-progress program: <span className="font-mono font-bold">{resumeAvailable.program.drug}</span> ({resumeAvailable.program.code}). Resume where you left off?</p>
              <div className="flex gap-2">
                <Button onClick={resumeSavedRun} className="flex-1 bg-lab-gold text-lab-bg hover:bg-lab-gold/90 font-mono">Resume</Button>
                <Button onClick={discardSavedRun} variant="outline" className="border-2 border-lab-line font-mono">Discard</Button>
              </div>
            </CardContent>
          </Card>
        )}
        <div className="flex gap-2">
          <Button onClick={() => setMode('curated')} variant="outline" className={`flex-1 border-2 font-mono text-xs gap-1.5 ${mode === 'curated' ? 'border-lab-amber text-lab-amber glow-amber' : 'border-lab-line text-lab-text-muted'}`}><BookOpen className="size-3.5" />Curated ({PROGRAMS.length})</Button>
          <Button onClick={() => setMode('endless')} variant="outline" className={`flex-1 border-2 font-mono text-xs gap-1.5 ${mode === 'endless' ? 'border-lab-violet text-lab-violet glow-violet' : 'border-lab-line text-lab-text-muted'}`}><Dna className="size-3.5" />Endless Practice</Button>
        </div>
        <div>
          <p className="text-xs font-mono text-lab-text-muted mb-1.5 flex items-center gap-1.5"><Globe2 className="size-3.5" />Reviewing authority (affects application naming and verdict conventions)</p>
          <div className="flex flex-wrap gap-1.5">
            {REGULATORS.map((r) => (
              <Button key={r.key} onClick={() => setAuthorityKey(r.key)} variant="outline" size="sm" className={`border-2 font-mono text-[11px] ${authorityKey === r.key ? 'border-lab-violet text-lab-violet glow-violet' : 'border-lab-line text-lab-text-muted'}`}>{r.name}</Button>
            ))}
          </div>
          <p className="text-xs text-lab-text-muted mt-1.5">{getRegulator(authorityKey).note}</p>
        </div>
        <div>
          <p className="text-xs font-mono text-lab-text-muted mb-1.5">Difficulty</p>
          <div className="flex gap-2">
            <Button onClick={() => setDifficulty('guided')} variant="outline" size="sm" className={`flex-1 border-2 font-mono ${difficulty === 'guided' ? 'border-lab-amber text-lab-amber glow-amber' : 'border-lab-line text-lab-text-muted'}`}>Guided (hints visible)</Button>
            <Button onClick={() => setDifficulty('expert')} variant="outline" size="sm" className={`flex-1 border-2 font-mono ${difficulty === 'expert' ? 'border-lab-amber text-lab-amber glow-amber' : 'border-lab-line text-lab-text-muted'}`}>Expert (hints hidden until chosen)</Button>
          </div>
        </div>

        {mode === 'curated' ? (
          <div className="grid gap-2">
            {PROGRAMS.map((p) => (
              <Card key={p.id} className="bg-lab-panel/80 border-lab-line cursor-pointer transition-all hover:border-lab-amber hover:glow-amber" onClick={() => pickProgram(p)}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <p className="font-mono font-bold text-lab-text">{p.drug} <span className="text-lab-text-muted text-xs">{p.code}</span></p>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-lab-panel-strong text-lab-amber">{p.area}</span>
                  </div>
                  <p className="text-xs text-lab-text-muted mt-1">{p.modality} — {p.indication}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-lab-panel/80 border-lab-violet border-2 glow-violet">
            <CardHeader className="pb-2"><CardTitle className="font-mono text-sm text-lab-violet flex items-center gap-2"><Dna className="size-4" />Endless Practice</CardTitle>
              <CardDescription className="text-xs text-lab-text-muted">Generated from the {GENERATOR_ARCHETYPE_COUNT} validated archetypes above, with a fresh procedurally-generated compound name and randomized flavor text each time — the grading logic is always the fully validated one, never guessed.</CardDescription>
            </CardHeader>
            <CardContent><Button onClick={pickGenerated} className="w-full bg-lab-violet text-lab-bg hover:bg-lab-violet/90 font-mono gap-1.5">Generate a new program <ArrowRight className="size-4" /></Button></CardContent>
          </Card>
        )}
      </div>
    )
  }

  if (step === 'brief') {
    return (
      <div className="space-y-4">
        {progressBar}{abandonControl}
        <Card className="bg-lab-panel/80 border-lab-line glow-amber">
          <CardHeader className="pb-2">
            <span className="text-[10px] font-mono text-lab-text-muted uppercase">Program brief (fictional) — {applicationName(authorityKey, program.modalityKey)}</span>
            <CardTitle className="font-mono text-lg text-lab-text flex items-center gap-2"><FlaskConical className="size-5 text-lab-amber" />{program.drug} <span className="text-sm text-lab-text-muted">{program.code}</span></CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="font-mono text-lab-text-muted text-xs uppercase">Modality: </span>{program.modality}</p>
            <p><span className="font-mono text-lab-text-muted text-xs uppercase">Indication: </span>{program.indication}</p>
            <p><span className="font-mono text-lab-text-muted text-xs uppercase">Mechanism: </span>{program.moa}</p>
            <p><span className="font-mono text-lab-text-muted text-xs uppercase">Discovery context: </span>{program.discoveryContext}</p>
          </CardContent>
        </Card>
        <div className="flex gap-2">
          <Button onClick={startOver} variant="outline" className="border-2 border-lab-line font-mono gap-1.5"><ArrowLeft className="size-4" />Choose a different program</Button>
          <Button onClick={() => setStep('discovery')} className="flex-1 bg-lab-amber text-lab-bg hover:bg-lab-amber/90 font-mono gap-1.5">Begin Discovery decisions <ArrowRight className="size-4" /></Button>
        </div>
      </div>
    )
  }

  if (step === 'discovery') return <div className="space-y-4">{progressBar}{abandonControl}<DecisionForm program={program} stage="discovery" choices={choices} setChoices={setChoices} difficulty={difficulty} onSubmit={submitDiscovery} submitLabel="Lock in Discovery decisions" onBack={() => setStep('brief')} backLabel="Back to program brief" /></div>
  if (step === 'discoveryR' && discovery) return <div className="space-y-4">{progressBar}<StageResultView outcome={discovery} grades={grades.filter((g) => g.stage === 'discovery')} onNext={() => setStep('preclinical')} nextLabel="Design Preclinical/IND-enabling program" /></div>
  if (step === 'preclinical') return <div className="space-y-4">{progressBar}{abandonControl}<DecisionForm program={program} stage="preclinical" choices={choices} setChoices={setChoices} difficulty={difficulty} onSubmit={submitPreclinical} submitLabel="Lock in Preclinical decisions" onBack={() => setStep('discoveryR')} backLabel="Back to Discovery results" /></div>
  if (step === 'preclinicalR' && preclinical) return <div className="space-y-4">{progressBar}<StageResultView outcome={preclinical} grades={grades.filter((g) => g.stage === 'preclinical')} onNext={() => setStep('cmc')} nextLabel="Plan CMC / manufacturing" /></div>
  if (step === 'cmc') return <div className="space-y-4">{progressBar}{abandonControl}<DecisionForm program={program} stage="cmc" choices={choices} setChoices={setChoices} difficulty={difficulty} onSubmit={submitCmc} submitLabel="Lock in CMC decisions" onBack={() => setStep('preclinicalR')} backLabel="Back to Preclinical results" /></div>
  if (step === 'cmcR' && cmc) return <div className="space-y-4">{progressBar}<StageResultView outcome={cmc} grades={grades.filter((g) => g.stage === 'cmc')} onNext={() => setStep('clinical')} nextLabel="Reach clinical milestone" /></div>
  if (step === 'clinical') return <div className="space-y-4">{progressBar}{abandonControl}<DecisionForm program={program} stage="clinical" choices={choices} setChoices={setChoices} difficulty={difficulty} onSubmit={submitClinical} submitLabel="Lock in clinical checkpoint decisions" onBack={() => setStep('cmcR')} backLabel="Back to CMC results" /></div>
  if (step === 'clinicalR' && clinical) return <div className="space-y-4">{progressBar}<StageResultView outcome={clinical} grades={grades.filter((g) => g.stage === 'clinical')} onNext={() => setStep('submission')} nextLabel={`Assemble the ${applicationName(authorityKey, program.modalityKey)}`} /></div>

  if (step === 'submission') {
    return (
      <div className="space-y-4">
        {progressBar}{abandonControl}
        <DecisionForm program={program} stage="submission" choices={choices} setChoices={setChoices} difficulty={difficulty} onSubmit={finalizeSubmission} submitLabel="File the submission" onBack={() => setStep('clinicalR')} backLabel="Back to clinical milestone"
          extra={!meetingTaken ? (
            <Card className="bg-lab-panel/80 border-2 border-lab-blue">
              <CardContent className="pt-4 space-y-2">
                <p className="text-sm text-lab-text flex items-center gap-2"><Users className="size-4 text-lab-blue shrink-0" />Request an actual regulatory meeting on your current draft before finalizing?</p>
                <Button onClick={requestSubmissionMeeting} variant="outline" className="w-full border-2 border-lab-blue text-lab-blue font-mono">Request meeting on current draft</Button>
              </CardContent>
            </Card>
          ) : undefined} />
      </div>
    )
  }

  if (step === 'submissionMeeting' && meetingFeedback) {
    return (
      <div className="space-y-4">
        {progressBar}
        <Card className="bg-lab-panel/80 border-2 border-lab-blue glow-amber">
          <CardHeader className="pb-2"><CardTitle className="font-mono text-sm text-lab-blue flex items-center gap-2"><Users className="size-4" />Regulatory Meeting Feedback</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {meetingFeedback.concerns.length > 0 ? (
              <div><p className="text-xs font-mono text-lab-red uppercase mb-1">Concerns raised</p>{meetingFeedback.concerns.map((c, i) => <p key={i} className="text-sm text-lab-text mb-1.5">{c}</p>)}</div>
            ) : <p className="text-sm text-lab-emerald flex items-center gap-1.5"><CheckCircle2 className="size-4" />No major concerns raised with your current draft.</p>}
            {meetingFeedback.supportive.length > 0 && (
              <div><p className="text-xs font-mono text-lab-emerald uppercase mb-1">Agreement</p>{meetingFeedback.supportive.map((c, i) => <p key={i} className="text-sm text-lab-text mb-1.5">{c}</p>)}</div>
            )}
          </CardContent>
        </Card>
        <Button onClick={() => setStep('submission')} className="w-full bg-lab-amber text-lab-bg hover:bg-lab-amber/90 font-mono gap-1.5">Revise and finalize the submission <ArrowRight className="size-4" /></Button>
      </div>
    )
  }

  if (step === 'phaseIV' && report) {
    const isConfirmatory = phaseIvEvent === PHASE_IV_EVENTS[1]
    return (
      <div className="space-y-4">
        {progressBar}
        <Card className="bg-lab-panel/80 border-2 border-lab-gold glow-gold">
          <CardHeader className="pb-2"><CardTitle className="font-mono text-sm text-lab-gold flex items-center gap-2"><ShieldCheck className="size-4" />Phase IV — {phaseIvEvent.headline}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-lab-text">{isConfirmatory ? 'Following advisory committee review and approval, a confirmatory commitment deadline arrives. How does the program respond?' : phaseIvEvent.description}</p>
            {!isConfirmatory ? (
              <Button onClick={goToPvClassifyOrChoice} className="w-full bg-lab-amber text-lab-bg hover:bg-lab-amber/90 font-mono">Review the case report →</Button>
            ) : (
              <div className="grid gap-2">
                <Button onClick={() => resolvePhaseIV(true)} variant="outline" className="border-2 border-lab-emerald text-lab-emerald font-mono h-auto py-2 whitespace-normal text-left justify-start">Prioritize resources to complete the confirmatory commitment rigorously and on time</Button>
                <Button onClick={() => resolvePhaseIV(false)} variant="outline" className="border-2 border-lab-red text-lab-red font-mono h-auto py-2 whitespace-normal text-left justify-start">Deprioritize the confirmatory commitment in favor of other programs</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (step === 'phaseIVClassify') {
    const correct = pvSeriousness === 'serious' && pvExpectedness === 'unexpected'
    const answered = pvSeriousness && pvExpectedness
    return (
      <div className="space-y-4">
        {progressBar}
        <Card className="bg-lab-panel/80 border-2 border-lab-gold glow-gold">
          <CardHeader className="pb-2"><CardTitle className="font-mono text-sm text-lab-gold">Classify this post-marketing case</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-lab-text">{phaseIvEvent.description}</p>
            <div>
              <p className="text-xs font-mono text-lab-text-muted mb-1.5">Seriousness</p>
              <div className="flex gap-2">
                {['serious', 'non-serious'].map((v) => (
                  <Button key={v} onClick={() => setPvSeriousness(v)} disabled={!!answered} variant="outline" className={`flex-1 border-2 font-mono capitalize ${pvSeriousness === v ? 'border-lab-amber text-lab-amber bg-lab-amber-soft' : 'border-lab-line text-lab-text-muted'}`}>{v}</Button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-mono text-lab-text-muted mb-1.5">Expectedness (vs. current labeling)</p>
              <div className="flex gap-2">
                {['expected', 'unexpected'].map((v) => (
                  <Button key={v} onClick={() => setPvExpectedness(v)} disabled={!!answered} variant="outline" className={`flex-1 border-2 font-mono capitalize ${pvExpectedness === v ? 'border-lab-amber text-lab-amber bg-lab-amber-soft' : 'border-lab-line text-lab-text-muted'}`}>{v}</Button>
                ))}
              </div>
            </div>
            {pvSeriousness && pvExpectedness && (
              <div className={`rounded border p-3 ${correct ? 'border-lab-emerald bg-lab-emerald-soft text-lab-emerald' : 'border-lab-red bg-lab-red-soft text-lab-red'}`}>
                <p className="font-mono font-bold text-sm">{correct ? 'Correctly classified.' : 'Not quite — this describes a serious, unexpected reaction.'}</p>
                <p className="text-sm text-lab-text mt-1">A serious and unexpected reaction not listed in current labeling triggers expedited reporting obligations and warrants the most urgent regulatory response — how you handle it next matters.</p>
              </div>
            )}
          </CardContent>
        </Card>
        {pvSeriousness && pvExpectedness && (
          <div className="grid gap-2">
            <Button onClick={() => resolvePhaseIV(true)} variant="outline" className="border-2 border-lab-emerald text-lab-emerald font-mono h-auto py-2 whitespace-normal text-left justify-start">Conduct a prompt, thorough review with transparent regulatory communication</Button>
            <Button onClick={() => resolvePhaseIV(false)} variant="outline" className="border-2 border-lab-red text-lab-red font-mono h-auto py-2 whitespace-normal text-left justify-start">Downplay the signal and delay a formal response</Button>
          </div>
        )}
      </div>
    )
  }

  if (step === 'report' && report) {
    const pct = Math.round((report.score / report.maxScore) * 100)
    const tone = report.verdict === 'approvable' || report.verdict === 'advisory_committee_then_approvable' ? { border: 'border-lab-emerald', glow: 'glow-emerald', Icon: ShieldCheck }
      : report.verdict === 'complete_response' ? { border: 'border-lab-gold', glow: 'glow-gold', Icon: CircleAlert }
      : { border: 'border-lab-red', glow: 'glow-red', Icon: ShieldAlert }
    const showPostMortem = report.verdict === 'terminated' || report.verdict === 'refuse_to_file'
    return (
      <div className="space-y-4">
        {progressBar}
        <Card className={`bg-lab-panel/80 border-2 ${tone.border} ${tone.glow}`} style={{ animation: 'stampIn 0.4s ease-out' }}>
          <CardHeader className="pb-2">
            <span className="text-[10px] font-mono text-lab-text-muted uppercase flex items-center gap-1.5"><Globe2 className="size-3" />{getRegulator(authorityKey).name} — regulatory review decision</span>
            <CardTitle className="font-mono text-xl text-lab-text flex items-center gap-2"><tone.Icon className="size-6" />{report.verdictLabel}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-lab-text leading-relaxed">{report.verdictSummary}</p>
            {phaseIvOutcomeNote && <p className="rounded border border-lab-gold bg-lab-gold-soft p-3 text-sm text-lab-text">{phaseIvOutcomeNote}</p>}
            {report.deficiencies.length > 0 && <div><p className="text-xs font-mono text-lab-red uppercase mb-2">Deficiencies cited</p>{report.deficiencies.map((d, i) => <p key={i} className="rounded border border-lab-red bg-lab-red-soft p-2.5 text-sm text-lab-text mb-2">{d}</p>)}</div>}
            {report.strengths.length > 0 && <div><p className="text-xs font-mono text-lab-emerald uppercase mb-2">Strengths recognized</p>{report.strengths.map((d, i) => <p key={i} className="rounded border border-lab-emerald bg-lab-emerald-soft p-2.5 text-sm text-lab-text mb-2">{d}</p>)}</div>}
          </CardContent>
        </Card>
        {showPostMortem && <PostMortemCard grades={report.grades} />}
        <Card className="bg-lab-panel/80 border-lab-line">
          <CardContent className="pt-4">
            <div className="flex items-end justify-between flex-wrap gap-2">
              <div><p className="text-xs font-mono text-lab-text-muted uppercase">Design score</p><p className="text-lg font-mono text-lab-text">{report.score}/{report.maxScore}</p></div>
              <div className="text-3xl font-mono text-lab-amber">{pct}%</div>
            </div>
            <div className="mt-2 h-2 rounded-full bg-lab-panel-strong overflow-hidden"><div className="h-full bg-gradient-to-r from-lab-amber/60 to-lab-amber" style={{ width: `${pct}%` }} /></div>
          </CardContent>
        </Card>
        <TimelineDiagram outcomes={outcomesSoFar} baseMonths={program.baseMonths} baseCostM={program.baseCostM} />
        {discovery && preclinical && cmc && clinical && submission && <AuthorityComparisonCard program={program} discovery={discovery} preclinical={preclinical} cmc={cmc} clinical={clinical} submission={submission} grades={report.grades} primaryAuthorityKey={authorityKey} />}
        {report.verdict === 'complete_response' && redesignCount < 2 && (
          <Card className="bg-lab-panel/80 border-2 border-lab-gold glow-gold">
            <CardContent className="pt-4 space-y-2">
              <p className="text-sm text-lab-text">You can revise your submission and resubmit (up to {2 - redesignCount} more time{2 - redesignCount === 1 ? '' : 's'}).</p>
              <Button onClick={redesignSubmission} className="w-full bg-lab-gold text-lab-bg hover:bg-lab-gold/90 font-mono gap-1.5">Revise submission and resubmit <ArrowRight className="size-4" /></Button>
            </CardContent>
          </Card>
        )}
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-widest font-mono text-lab-violet">Full decision record</p>
          {report.grades.map((g) => <GradeRow key={g.decisionId} grade={g} />)}
        </div>
        <Card className="bg-lab-panel/80 border-lab-line">
          <CardHeader className="pb-2"><CardTitle className="font-mono text-sm text-lab-text-muted flex items-center gap-2"><Trophy className="size-4 text-lab-gold" />Submit to leaderboard</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {scoreSubmitted ? <p className="text-sm text-lab-emerald">Recorded — check the Leaderboard tab.</p> : (
              <div className="flex gap-2">
                <Input value={playerName} onChange={(e) => setPlayerName(e.target.value)} placeholder="Your name" maxLength={32} className="bg-lab-panel-strong border-lab-line text-lab-text" />
                <Button onClick={handleSubmitScore} disabled={!playerName.trim()} className="bg-lab-amber text-lab-bg hover:bg-lab-amber/90 font-mono">Submit</Button>
              </div>
            )}
          </CardContent>
        </Card>
        <div className="flex gap-2">
          <Button onClick={downloadReport} variant="outline" className="flex-1 border-2 border-lab-line font-mono gap-1.5"><FileText className="size-4" />Text report</Button>
          <Button onClick={downloadCtdDocument} disabled={ctdBusy} variant="outline" className="flex-1 border-2 border-lab-line font-mono gap-1.5"><FileType className="size-4" />{ctdBusy ? 'Building…' : 'CTD Word doc'}</Button>
        </div>
        <Button onClick={startOver} className="w-full bg-lab-violet text-lab-bg hover:bg-lab-violet/90 font-mono gap-1.5"><RotateCcw className="size-4" />New program</Button>
      </div>
    )
  }

  return null
}
