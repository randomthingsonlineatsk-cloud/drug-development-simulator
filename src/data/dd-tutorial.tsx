import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FlaskConical, Microscope, Factory, Users, FileText, ShieldCheck } from 'lucide-react'

const TUTORIAL_SEEN_KEY = 'dd_tutorial_seen_v1'

function hasSeenTutorial(): boolean {
  try { return localStorage.getItem(TUTORIAL_SEEN_KEY) === '1' } catch { return false }
}
function markTutorialSeen() {
  try { localStorage.setItem(TUTORIAL_SEEN_KEY, '1') } catch { /* ignore */ }
}

const STEPS = [
  { Icon: FlaskConical, title: 'Discovery', body: 'Respond to how strong the target validation evidence actually is, and set your lead optimization priorities.' },
  { Icon: Microscope, title: 'Preclinical', body: 'Select the toxicology species, study duration, and safety battery that actually fit this program’s risk profile.' },
  { Icon: Factory, title: 'CMC', body: 'Decide when to validate the manufacturing process, how to scale up, and how to handle process changes.' },
  { Icon: Users, title: 'Clinical checkpoint', body: 'An abbreviated milestone: decide whether to seek regulatory alignment before and after early clinical data.' },
  { Icon: FileText, title: 'Submission', body: 'Assemble your dossier, decide on a designation strategy, and optionally request a real meeting on your draft before filing.' },
  { Icon: ShieldCheck, title: 'Review & beyond', body: 'Get an authority-specific verdict, then handle Phase IV commitments if approved — every decision is locked in like a real program.' },
]

export function TutorialOverlay() {
  // Start hidden on the server and first client render so the prerendered HTML
  // matches; reveal after mount if the visitor hasn't seen the tutorial yet.
  const [dismissed, setDismissed] = useState(true)
  useEffect(() => { setDismissed(hasSeenTutorial()) }, [])
  if (dismissed) return null

  function close() {
    markTutorialSeen()
    setDismissed(true)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" style={{ animation: 'fadeInUp 0.2s ease-out' }}>
      <Card className="bg-lab-panel border-2 border-lab-amber glow-amber max-w-md w-full max-h-[85vh] overflow-y-auto">
        <CardHeader className="pb-2">
          <CardTitle className="font-mono text-base text-lab-amber">Welcome — how this works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-lab-text">Every program moves through 5 locked-in stages, plus a post-approval stage:</p>
          {STEPS.map((s) => (
            <div key={s.title} className="flex gap-3 items-start">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border-2 border-lab-line bg-lab-panel-strong text-lab-amber"><s.Icon className="size-4" /></span>
              <div>
                <p className="font-mono font-bold text-sm text-lab-text">{s.title}</p>
                <p className="text-xs text-lab-text-muted">{s.body}</p>
              </div>
            </div>
          ))}
          <p className="text-xs text-lab-text-muted font-mono">Once a stage is locked in, it can't be undone — only built on, just like a real program.</p>
          <Button onClick={close} className="w-full bg-lab-amber text-lab-bg hover:bg-lab-amber/90 font-mono">Got it — let's start</Button>
        </CardContent>
      </Card>
    </div>
  )
}
