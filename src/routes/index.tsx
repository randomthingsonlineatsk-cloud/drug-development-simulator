import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { PlayTab } from '@/data/dd-play-tab'
import { PortfolioTab } from '@/data/dd-portfolio-tab'
import { LeaderboardTab, GlossaryTab } from '@/data/dd-leaderboard-glossary-tabs'
import { HistoryTab } from '@/data/dd-history-tab'
import { TabButton } from '@/data/dd-shared-ui'
import { TutorialOverlay } from '@/data/dd-tutorial'
import { Microscope, Briefcase, BookOpen, Trophy, History as HistoryIcon, Dna } from 'lucide-react'

export const Route = createFileRoute('/')({ component: App })

type Tab = 'play' | 'portfolio' | 'glossary' | 'leaderboard' | 'history'

function App() {
  const [tab, setTab] = useState<Tab>('play')
  const [pendingProgramId, setPendingProgramId] = useState<string | null>(null)

  function handlePlayFromPortfolio(programId: string) {
    setPendingProgramId(programId)
    setTab('play')
  }

  return (
    <div className="min-h-screen bg-lab-bg text-lab-text">
      <TutorialOverlay />
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <header className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg border-2 border-lab-amber bg-lab-amber-soft text-lab-amber glow-amber animate-pulse-glow"><Dna className="size-5" /></span>
            <div>
              <p className="text-xs uppercase tracking-widest font-mono text-lab-amber">Drug Development Simulator</p>
              <h1 className="text-xl font-mono font-bold text-lab-text">Discovery to approval.</h1>
            </div>
          </div>
          <p className="text-sm text-lab-text-muted">Take a fictional compound from target discovery through preclinical development, CMC, and NDA/BLA/MAA regulatory review across 21 authorities — the stages around clinical trial design, covered here rather than repeated.</p>
        </header>

        <div className="flex flex-wrap gap-2">
          <TabButton active={tab === 'play'} onClick={() => setTab('play')} icon={Microscope}>Play</TabButton>
          <TabButton active={tab === 'portfolio'} onClick={() => setTab('portfolio')} icon={Briefcase}>Portfolio</TabButton>
          <TabButton active={tab === 'glossary'} onClick={() => setTab('glossary')} icon={BookOpen}>Glossary</TabButton>
          <TabButton active={tab === 'leaderboard'} onClick={() => setTab('leaderboard')} icon={Trophy}>Leaderboard</TabButton>
          <TabButton active={tab === 'history'} onClick={() => setTab('history')} icon={HistoryIcon}>History</TabButton>
        </div>

        {tab === 'play' && <PlayTab pendingProgramId={pendingProgramId} onConsumePending={() => setPendingProgramId(null)} />}
        {tab === 'portfolio' && <PortfolioTab onPlayProgram={handlePlayFromPortfolio} />}
        {tab === 'glossary' && <GlossaryTab />}
        {tab === 'leaderboard' && <LeaderboardTab />}
        {tab === 'history' && <HistoryTab />}

        <p className="text-center text-xs text-lab-text-muted font-mono">All compounds, targets, and outcomes are entirely fictional — an educational simulation, not regulatory guidance.</p>
        <p className="text-center text-xs text-lab-text-muted font-mono">built by Khan Gulrez Shagufa Fazal Ahmed</p>
      </div>
    </div>
  )
}
