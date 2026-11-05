// ---------------------------------------------------------------------------
// Shared types for the Discovery → NDA/BLA development simulation.
// This app is deliberately complementary to a companion Clinical Trial
// Simulator: it focuses on Discovery, Preclinical/IND-enabling development,
// CMC/manufacturing, and NDA/BLA assembly + regulatory review — the stages
// before and after detailed Phase I-III trial design, which the companion
// app already covers in depth. The clinical stage here is intentionally an
// abbreviated milestone checkpoint, not a full trial-design exercise.
// ---------------------------------------------------------------------------

export type ValidationStrength = 'genetic_human' | 'model_only' | 'in_vitro_only'
export type OptimizationPriority = 'balanced' | 'potency_only' | 'cost_speed_only'
export type SpeciesRelevance = 'pharmacologically_relevant' | 'default_two_species' | 'single_species'
export type ToxDuration = 'matched_to_clinical' | 'shorter_than_clinical' | 'longer_than_needed'
export type SafetyBattery = 'full_battery' | 'partial_battery' | 'skipped'
export type DesignationFit = 'eligible' | 'not_eligible'
export type Modality = 'small_molecule' | 'biologic' | 'vaccine' | 'gene_therapy' | 'complex_generic' | 'combination_product' | 'adc' | 'diagnostic_codev' | 'rna_therapeutic' | 'radiopharmaceutical' | 'fixed_dose_combination' | 'biosimilar'

export interface Program {
  id: string
  code: string
  drug: string
  modality: string
  modalityKey: Modality
  indication: string
  area: string
  moa: string
  discoveryContext: string
  validationStrength: ValidationStrength
  validationWhy: string
  speciesRelevance: SpeciesRelevance
  speciesWhy: string
  toxDuration: ToxDuration
  toxDurationWhy: string
  safetyBattery: SafetyBattery
  safetyBatteryWhy: string
  designationFit: DesignationFit
  designationName: string
  designationWhy: string
  events: string[]
  baseCostM: number // baseline estimated cost in $M to reach filing, before decision-driven adjustments
  baseMonths: number // baseline estimated months to reach filing, before decision-driven adjustments
}

export type Choices = Record<string, string>

export interface DecisionOption { id: string; label: string; detail: string }
export interface Decision { id: string; stage: StageKey; title: string; prompt: string; options: DecisionOption[] }

export type StageKey = 'discovery' | 'preclinical' | 'cmc' | 'clinical' | 'submission'

export type GradeVerdict = 'best' | 'acceptable' | 'poor'
export interface Grade {
  decisionId: string
  stage: StageKey
  title: string
  chosenLabel: string
  verdict: GradeVerdict
  points: number
  maxPoints: number
  reference: string
  explanation: string
}

export interface StageOutcome {
  stage: StageKey
  headline: string
  status: 'success' | 'mixed' | 'failure'
  narrative: string[]
  flags: string[]
  metrics: { label: string; value: string }[]
  monthsAdded: number
  costAddedM: number
}

export type FinalVerdict = 'approvable' | 'complete_response' | 'refuse_to_file' | 'advisory_committee_then_approvable' | 'terminated'

export interface FinalReport {
  verdict: FinalVerdict
  verdictLabel: string
  verdictSummary: string
  deficiencies: string[]
  strengths: string[]
  score: number
  maxScore: number
  grades: Grade[]
  authorityKey: string
  totalMonths: number
  totalCostM: number
}

export interface PhaseIvEvent { headline: string; description: string; goodNote: string; badNote: string }
