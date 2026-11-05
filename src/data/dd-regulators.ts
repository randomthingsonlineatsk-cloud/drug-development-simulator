import type { Modality } from './dd-types'

// ---------------------------------------------------------------------------
// The 21 reviewing authorities used across this teaching-app portfolio,
// adapted here for Discovery-through-submission terminology (application
// naming, designation program naming, and pivotal-evidence expectations)
// rather than clinical-trial-review conventions. Simplified, defensible
// teaching approximations — not a claim about any specific real decision.
// ---------------------------------------------------------------------------

export type Strictness = 'strict' | 'moderate' | 'lenient'

export interface Regulator {
  key: string
  name: string
  region: string
  color: string
  requiresTwoPivotal: boolean
  acceleratedPathway: boolean
  designationProgramName: string
  note: string
}

export const REGULATORS: Regulator[] = [
  { key: 'FDA', name: 'FDA', region: 'North America', color: 'hsl(36 92% 58%)', requiresTwoPivotal: false, acceleratedPathway: true, designationProgramName: 'Breakthrough Therapy / Priority Review / Orphan Drug Designation', note: 'Operates Breakthrough Therapy, Priority Review, Fast Track and Orphan Drug Designation, plus an Accelerated Approval pathway based on a surrogate with a mandatory confirmatory trial.' },
  { key: 'HC', name: 'Health Canada', region: 'North America', color: 'hsl(0 70% 62%)', requiresTwoPivotal: false, acceleratedPathway: true, designationProgramName: 'Priority Review / Notice of Compliance with Conditions', note: 'Similar flexibility to FDA, with a Notice of Compliance with Conditions pathway analogous to accelerated approval.' },
  { key: 'EMA', name: 'EMA', region: 'Europe', color: 'hsl(258 70% 65%)', requiresTwoPivotal: true, acceleratedPathway: true, designationProgramName: 'PRIME (PRIority MEdicines) / Conditional Marketing Authorisation', note: 'Generally expects two independent pivotal trials unless a single trial is exceptionally robust and the condition is rare. PRIME offers enhanced early dialogue for priority medicines; Conditional Marketing Authorisation is reserved for unmet need with a strict post-authorization confirmatory commitment.' },
  { key: 'MHRA', name: 'MHRA', region: 'Europe', color: 'hsl(220 70% 60%)', requiresTwoPivotal: false, acceleratedPathway: true, designationProgramName: 'Innovative Licensing and Access Pathway (ILAP)', note: 'Post-Brexit UK review has moved toward accepting robust single-trial packages more readily than EMA, with its own innovative-access pathway.' },
  { key: 'SWISSMEDIC', name: 'Swissmedic', region: 'Europe', color: 'hsl(0 65% 55%)', requiresTwoPivotal: true, acceleratedPathway: false, designationProgramName: 'Fast-track authorisation procedure', note: 'Conservative, EMA-aligned scientific standards; a fast-track procedure exists but no accelerated-approval-style surrogate pathway is modeled here.' },
  { key: 'TGA', name: 'TGA', region: 'Asia-Pacific', color: 'hsl(152 55% 48%)', requiresTwoPivotal: false, acceleratedPathway: true, designationProgramName: 'Provisional registration pathway', note: 'A provisional registration pathway exists for promising but incomplete data, similar in spirit to accelerated approval.' },
  { key: 'PMDA', name: 'PMDA', region: 'Asia-Pacific', color: 'hsl(340 65% 60%)', requiresTwoPivotal: false, acceleratedPathway: true, designationProgramName: 'Sakigake-style priority review / conditional early approval', note: 'A conditional early approval system exists for serious conditions with priority-review designation for innovative products.' },
  { key: 'NMPA', name: 'NMPA', region: 'Asia-Pacific', color: 'hsl(38 92% 55%)', requiresTwoPivotal: false, acceleratedPathway: true, designationProgramName: 'Conditional approval / priority review', note: 'Conditional approval pathway available for unmet medical need based on surrogate endpoints, with mandated confirmatory studies.' },
  { key: 'CDSCO', name: 'CDSCO', region: 'Asia-Pacific', color: 'hsl(30 80% 55%)', requiresTwoPivotal: false, acceleratedPathway: true, designationProgramName: 'Accelerated approval provisions', note: 'Accelerated approval provisions exist for unmet medical need; local clinical data requirements can also apply depending on the product.' },
  { key: 'HSA', name: 'HSA', region: 'Asia-Pacific', color: 'hsl(190 70% 50%)', requiresTwoPivotal: false, acceleratedPathway: false, designationProgramName: 'Reference-agency-aligned review', note: 'Often relies on reference-agency review reports alongside its own assessment; no distinct accelerated route modeled here.' },
  { key: 'MFDS', name: 'MFDS', region: 'Asia-Pacific', color: 'hsl(265 60% 60%)', requiresTwoPivotal: false, acceleratedPathway: true, designationProgramName: 'Conditional approval for serious/rare disease', note: 'Conditional approval available for serious/rare disease products based on surrogate data with confirmatory commitments.' },
  { key: 'BPOM', name: 'BPOM', region: 'Asia-Pacific', color: 'hsl(15 75% 55%)', requiresTwoPivotal: false, acceleratedPathway: false, designationProgramName: 'Standard pragmatic review', note: 'Generally pragmatic review standards; a distinct accelerated pathway is not modeled here.' },
  { key: 'ANVISA', name: 'ANVISA', region: 'Latin America', color: 'hsl(142 55% 45%)', requiresTwoPivotal: false, acceleratedPathway: true, designationProgramName: 'Priority review / conditional registration', note: 'Priority review and conditional registration provisions exist for unmet medical need.' },
  { key: 'COFEPRIS', name: 'Cofepris', region: 'Latin America', color: 'hsl(150 45% 42%)', requiresTwoPivotal: false, acceleratedPathway: false, designationProgramName: 'Reference-agency-aligned review', note: 'Frequently leverages reference-agency approvals; no distinct accelerated pathway modeled here.' },
  { key: 'ANMAT', name: 'ANMAT', region: 'Latin America', color: 'hsl(200 55% 48%)', requiresTwoPivotal: false, acceleratedPathway: false, designationProgramName: 'Standard pragmatic review', note: 'Pragmatic review standards; no distinct accelerated pathway modeled here.' },
  { key: 'SFDA', name: 'SFDA', region: 'Middle East', color: 'hsl(158 50% 45%)', requiresTwoPivotal: false, acceleratedPathway: false, designationProgramName: 'Reference-agency-aligned review', note: 'Often reviews alongside reference-agency decisions; no distinct accelerated pathway modeled here.' },
  { key: 'UAE_MOHAP', name: 'UAE MOHAP', region: 'Middle East', color: 'hsl(175 55% 45%)', requiresTwoPivotal: false, acceleratedPathway: false, designationProgramName: 'Reference-agency-aligned review', note: 'Often reviews alongside reference-agency decisions; no distinct accelerated pathway modeled here.' },
  { key: 'SAHPRA', name: 'SAHPRA', region: 'Africa', color: 'hsl(90 45% 45%)', requiresTwoPivotal: false, acceleratedPathway: false, designationProgramName: 'Standard full review', note: 'Standard full review; no distinct accelerated pathway modeled here.' },
  { key: 'NAFDAC', name: 'NAFDAC', region: 'Africa', color: 'hsl(120 45% 42%)', requiresTwoPivotal: false, acceleratedPathway: false, designationProgramName: 'Standard full review', note: 'Standard full review; no distinct accelerated pathway modeled here.' },
  { key: 'AMA', name: 'AMA', region: 'Africa', color: 'hsl(45 70% 50%)', requiresTwoPivotal: true, acceleratedPathway: false, designationProgramName: 'Harmonized continental review', note: 'As a continental harmonizing body coordinating across African Union member states, its model review standard here leans conservative, favoring more complete evidence packages.' },
  { key: 'WHO_PQ', name: 'WHO Prequalification', region: 'Global', color: 'hsl(210 15% 55%)', requiresTwoPivotal: true, acceleratedPathway: false, designationProgramName: 'None (standard prequalification review)', note: 'A distinct global public-health mechanism (not a national regulator) focused on quality, safety and efficacy for products intended for procurement by UN agencies — it expects a complete, well-documented evidence package and does not offer an accelerated route in this model.' },
]

export function getRegulator(key: string): Regulator {
  return REGULATORS.find((r) => r.key === key) ?? REGULATORS[0]
}

/** The submission is named per authority convention and modality — NDA/BLA-style in the US, MAA-style in EU-pattern authorities, generic Marketing Authorization elsewhere. */
export function applicationName(authorityKey: string, modalityKey: Modality): string {
  const euStyle = ['EMA', 'MHRA', 'SWISSMEDIC'].includes(authorityKey)
  if (euStyle) return 'Marketing Authorisation Application (MAA)'
  if (authorityKey === 'FDA' || authorityKey === 'HC') {
    const biologicLike = modalityKey === 'biologic' || modalityKey === 'vaccine' || modalityKey === 'gene_therapy' || modalityKey === 'adc'
    return biologicLike ? 'Biologics License Application (BLA)-style submission' : 'New Drug Application (NDA)-style submission'
  }
  return 'Marketing Authorization submission'
}
