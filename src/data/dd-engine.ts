import { buildDecisions } from './dd-decisions'
import { getRegulator, applicationName } from './dd-regulators'
import type { Choices, FinalReport, FinalVerdict, Grade, Program, StageKey, StageOutcome } from './dd-types'

export function makeSeed(): number {
  return Math.floor(Math.random() * 2_147_483_646) + 1
}
function rng(seed: number, salt: number) {
  let s = (seed * 1103515245 + salt * 12345 + 7) % 2147483647
  if (s <= 0) s += 2147483646
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

const REF = {
  attrition: 'Target-validation strength and clinical attrition risk (well-documented industry finding)',
  ich_s6: 'ICH S6(R1) — species relevance for biotechnology-derived pharmaceuticals',
  ich_m3: 'ICH M3(R2) — nonclinical safety study duration to support clinical trials',
  ich_s2: 'ICH S2(R1) / S7A — genotoxicity and safety pharmacology core batteries',
  cmc: 'CMC/manufacturing best practice (process validation, scale-up, comparability)',
  process: 'Standard drug-development process practice (regulatory meetings, dossier completeness)',
  designation: 'Expedited/special designation eligibility criteria',
}

function pts(v: Grade['verdict']) { return v === 'best' ? 2 : v === 'acceptable' ? 1 : 0 }

export function gradeStage(program: Program, stage: StageKey, choices: Choices): Grade[] {
  const decisions = buildDecisions(program, stage)
  const out: Grade[] = []
  for (const d of decisions) {
    const chosen = choices[d.id]
    if (!chosen) continue
    const option = d.options.find((o) => o.id === chosen)
    const { verdict, explanation, reference } = judge(program, d.id, chosen)
    out.push({ decisionId: d.id, stage, title: d.title, chosenLabel: option?.label ?? chosen, verdict, points: pts(verdict), maxPoints: 2, reference, explanation })
  }
  return out
}

function judge(p: Program, id: string, c: string): { verdict: Grade['verdict']; explanation: string; reference: string } {
  switch (id) {
    case 'target_response': {
      if (p.validationStrength === 'genetic_human') {
        if (c === 'proceed_full') return { verdict: 'best', reference: REF.attrition, explanation: p.validationWhy }
        if (c === 'validate_more') return { verdict: 'acceptable', reference: REF.attrition, explanation: `Safe, but the evidence base described is already strong. ${p.validationWhy}` }
        return { verdict: 'poor', reference: REF.attrition, explanation: `Proceeding with even less diligence than the strong evidence already justifies is an unforced error. ${p.validationWhy}` }
      }
      if (c === 'validate_more') return { verdict: 'best', reference: REF.attrition, explanation: p.validationWhy }
      if (c === 'proceed_full') return { verdict: 'poor', reference: REF.attrition, explanation: `Committing full resources on this evidence base is the well-documented driver of late-stage attrition. ${p.validationWhy}` }
      return { verdict: 'poor', reference: REF.attrition, explanation: `Proceeding with minimal diligence compounds an already weak evidence base. ${p.validationWhy}` }
    }
    case 'optimization_priority': {
      if (c === 'balanced') return { verdict: 'best', reference: REF.process, explanation: 'Balancing potency, selectivity and developability together avoids discovering a fatal flaw in one dimension after the others are already locked in.' }
      if (c === 'potency_only') return { verdict: 'poor', reference: REF.process, explanation: 'Deferring selectivity and developability work risks discovering off-target liabilities or poor exposure only after significant investment.' }
      return { verdict: 'poor', reference: REF.process, explanation: 'Optimizing purely for cost and speed risks an underpowered candidate that cannot achieve adequate exposure at a tolerable dose.' }
    }
    case 'selectivity_profiling': {
      if (c === 'broad_panel') return { verdict: 'best', reference: REF.process, explanation: 'A broad selectivity panel surfaces off-target liabilities while they are still cheap to address.' }
      if (c === 'minimal') return { verdict: 'acceptable', reference: REF.process, explanation: 'An efficacy model alone provides only indirect reassurance about off-target risk.' }
      return { verdict: 'poor', reference: REF.process, explanation: 'No selectivity testing means any off-target liability surfaces later, more expensively, as an unexplained toxicology finding.' }
    }
    case 'species_selection': {
      if (c === p.speciesRelevance) return { verdict: 'best', reference: REF.ich_s6, explanation: p.speciesWhy }
      return { verdict: c === 'single_species' ? 'poor' : 'acceptable', reference: REF.ich_s6, explanation: `Not the best fit for this program. ${p.speciesWhy}` }
    }
    case 'tox_duration': {
      if (c === p.toxDuration) return { verdict: 'best', reference: REF.ich_m3, explanation: p.toxDurationWhy }
      return { verdict: 'poor', reference: REF.ich_m3, explanation: `Mismatched to what this program actually needs. ${p.toxDurationWhy}` }
    }
    case 'safety_battery': {
      if (c === p.safetyBattery) return { verdict: 'best', reference: REF.ich_s2, explanation: p.safetyBatteryWhy }
      if (c === 'skipped') return { verdict: 'poor', reference: REF.ich_s2, explanation: `Skipping safety battery testing leaves basic safety questions unanswered before human dosing. ${p.safetyBatteryWhy}` }
      return { verdict: 'acceptable', reference: REF.ich_s2, explanation: p.safetyBatteryWhy }
    }
    case 'process_validation_timing': {
      if (c === 'validate_before_pivotal') return { verdict: 'best', reference: REF.cmc, explanation: 'Validating before pivotal material is manufactured ensures the confirmatory evidence package reflects what will actually be commercialized.' }
      if (c === 'validate_after_filing') return { verdict: 'poor', reference: REF.cmc, explanation: 'Deferring validation risks discovering a comparability gap between clinical-trial material and the commercial process only after submission.' }
      return { verdict: 'poor', reference: REF.cmc, explanation: 'A marketing application requires documented process validation evidence — informal consistency is not a substitute.' }
    }
    case 'scale_up_strategy': {
      if (c === 'bridged_scale_up') return { verdict: 'best', reference: REF.cmc, explanation: 'A staged bridging plan characterizes scale-dependent behavior before a large, expensive commercial-scale batch is committed to.' }
      if (c === 'jump_to_commercial_scale') return { verdict: 'poor', reference: REF.cmc, explanation: 'Jumping straight to commercial scale risks discovering scale-dependent quality issues only after an expensive batch is already made.' }
      return { verdict: 'poor', reference: REF.cmc, explanation: 'Lab scale alone cannot support the clinical or commercial supply the program will eventually need.' }
    }
    case 'batch_comparability': {
      if (c === 'comprehensive_comparability') return { verdict: 'best', reference: REF.cmc, explanation: 'Comprehensive comparability testing directly demonstrates the changed process produces an equivalent product.' }
      if (c === 'minimal_testing') return { verdict: 'acceptable', reference: REF.cmc, explanation: 'Release testing confirms specification is met, but does not directly demonstrate equivalence to the pre-change product.' }
      return { verdict: 'poor', reference: REF.cmc, explanation: 'Assuming comparability without testing leaves a real question about the effect of the change entirely unaddressed.' }
    }
    case 'pre_ind_meeting':
    case 'eop2_meeting':
    case 'pre_submission_meeting': {
      if (c === 'request') return { verdict: 'best', reference: REF.process, explanation: 'Requesting the meeting surfaces disagreements while they are still cheap to resolve.' }
      return { verdict: 'poor', reference: REF.process, explanation: 'Skipping the meeting risks discovering a disagreement only after significant time and resources are already committed.' }
    }
    case 'ctd_completeness': {
      if (c === 'complete') return { verdict: 'best', reference: REF.process, explanation: 'A complete dossier is the baseline expectation for a filing to be accepted for substantive review.' }
      return { verdict: 'poor', reference: REF.process, explanation: 'Filing with known gaps risks a refuse-to-file decision or an early, avoidable deficiency finding.' }
    }
    case 'designation_pursuit': {
      const eligible = p.designationFit === 'eligible'
      if ((eligible && c === 'pursue') || (!eligible && c === 'skip')) return { verdict: 'best', reference: REF.designation, explanation: p.designationWhy }
      return { verdict: 'poor', reference: REF.designation, explanation: eligible ? `The program appears to genuinely qualify, and not pursuing it forgoes a real opportunity. ${p.designationWhy}` : `The program does not appear to meet the criteria, and pursuing it anyway wastes time on a request likely to be denied. ${p.designationWhy}` }
    }
  }
  return { verdict: 'acceptable', explanation: '', reference: REF.process }
}

function pickEvent(p: Program, u: number): string {
  const i = Math.floor(u * p.events.length)
  return p.events[i] ?? p.events[0] ?? ''
}

export function runDiscovery(p: Program, c: Choices, seed: number): StageOutcome {
  const r = rng(seed, 11)
  const flags: string[] = []
  const narrative: string[] = []
  const overcommitted = c['target_response'] === 'proceed_full' && p.validationStrength !== 'genetic_human'
  const minimal = c['target_response'] === 'proceed_minimal'
  const potencyOnly = c['optimization_priority'] === 'potency_only'
  const noSelectivity = c['selectivity_profiling'] === 'none'

  if (overcommitted || minimal) { flags.push('weak_validation_overcommit'); narrative.push('Full resources are committed against a target whose causal role in the disease is not yet firmly established in humans — a pattern strongly associated with late, expensive attrition if the target ultimately fails to translate.') }
  else narrative.push('Resource commitment is appropriately matched to the strength of the validation evidence.')

  if (potencyOnly) { flags.push('potency_only_risk'); narrative.push('The most potent candidate advances without full developability characterization — a liability that, if present, will surface later and more expensively.') }
  if (noSelectivity) { flags.push('no_selectivity_data'); narrative.push('Without selectivity data, any off-target activity will only be discovered once it appears as an unexplained toxicology finding.') }
  if (flags.length === 0) narrative.push('The discovery program advances on a well-characterized, appropriately de-risked candidate.')
  narrative.push(pickEvent(p, r()))

  const monthsAdded = Math.round(p.baseMonths * 0.15 + (overcommitted || minimal ? 6 : 0) + (potencyOnly ? 3 : 0))
  const costAddedM = Math.round(p.baseCostM * 0.15 * (overcommitted || minimal ? 1.3 : 1))

  return {
    stage: 'discovery',
    status: overcommitted || minimal ? 'failure' : flags.length ? 'mixed' : 'success',
    headline: overcommitted || minimal ? 'Candidate advanced on a weak evidence base' : flags.length ? 'Candidate advanced, with noted gaps' : 'Candidate advanced on a well-validated target',
    narrative, flags, monthsAdded, costAddedM,
    metrics: [
      { label: 'Validation basis', value: p.validationStrength === 'genetic_human' ? 'Human genetic/tissue' : p.validationStrength === 'model_only' ? 'Animal model only' : 'In vitro only' },
      { label: 'Candidate profile', value: potencyOnly ? 'Potency-optimized only' : 'Balanced' },
    ],
  }
}

export function runPreclinical(p: Program, c: Choices, discovery: StageOutcome, seed: number): StageOutcome {
  const r = rng(seed, 29)
  const flags: string[] = []
  const narrative: string[] = []
  const wrongSpecies = c['species_selection'] !== p.speciesRelevance
  const wrongDuration = c['tox_duration'] !== p.toxDuration
  const weakBattery = c['safety_battery'] === 'skipped'

  if (wrongSpecies) { flags.push('species_mismatch'); narrative.push('The toxicology species selected does not match what this program actually needed, producing a safety database whose relevance to human risk is harder to defend at review.') }
  if (wrongDuration) { flags.push('duration_mismatch'); narrative.push(p.toxDuration === 'longer_than_needed' ? 'The toxicology duration does not adequately characterize the durability of this intervention, leaving a real long-term safety question open.' : 'The toxicology duration does not adequately support the intended clinical dosing plan, a gap the regulator is likely to flag.') }
  if (weakBattery) { flags.push('battery_gap'); narrative.push('A basic safety question remains unanswered heading into human dosing.') }
  if (discovery.flags.includes('no_selectivity_data') && r() < 0.55) { flags.push('unexplained_tox_finding'); narrative.push('An unexplained toxicology finding appears in this study — the kind of finding a selectivity panel would likely have anticipated and explained in advance.') }
  if (flags.length === 0) narrative.push('The nonclinical package is well-matched to this program’s actual risk profile and ready to support clinical testing.')
  narrative.push(pickEvent(p, r()))

  const monthsAdded = Math.round(p.baseMonths * 0.22 + (wrongSpecies ? 6 : 0) + (wrongDuration ? 6 : 0) + (weakBattery ? 4 : 0))
  const costAddedM = Math.round(p.baseCostM * 0.2 * (wrongSpecies || wrongDuration ? 1.25 : 1))

  return {
    stage: 'preclinical',
    status: flags.filter((f) => f !== 'unexplained_tox_finding').length >= 2 ? 'failure' : flags.length ? 'mixed' : 'success',
    headline: flags.length === 0 ? 'IND-enabling package ready to support clinical testing' : 'IND-enabling package complete, with gaps on record',
    narrative, flags, monthsAdded, costAddedM,
    metrics: [
      { label: 'Species selection', value: wrongSpecies ? 'Mismatched' : 'Appropriate' },
      { label: 'Safety database', value: weakBattery ? 'Incomplete' : 'Adequate' },
    ],
  }
}

export function runCmc(p: Program, c: Choices, seed: number): StageOutcome {
  const r = rng(seed, 37)
  const flags: string[] = []
  const narrative: string[] = []
  const lateValidation = c['process_validation_timing'] === 'validate_after_filing'
  const noValidation = c['process_validation_timing'] === 'never_formally_validate'
  const noBridging = c['scale_up_strategy'] === 'jump_to_commercial_scale'
  const stuckLabScale = c['scale_up_strategy'] === 'stay_lab_scale'
  const noComparability = c['batch_comparability'] === 'assume_comparable'

  if (noValidation) { flags.push('no_process_validation'); narrative.push('The manufacturing process lacks the documented validation evidence a marketing application requires.') }
  else if (lateValidation) { flags.push('late_process_validation'); narrative.push('Formal process validation is deferred until after filing — a comparability gap between clinical-trial material and the commercial process, if one exists, is discovered only during review.') }
  else narrative.push('The manufacturing process is formally validated ahead of the pivotal evidence package, giving confidence the clinical material reflects what will be commercialized.')

  if (stuckLabScale) { flags.push('lab_scale_only'); narrative.push('Manufacturing remains at lab scale, unable to support the clinical or commercial supply the program will need going forward.') }
  else if (noBridging) { flags.push('unbridged_scale_up'); narrative.push('A scale-dependent quality issue appears in the first full commercial-scale batch — the kind of finding a staged bridging plan is designed to catch earlier and more cheaply.') }

  if (noComparability) { flags.push('unverified_comparability'); narrative.push('A manufacturing process change goes forward without comparability testing, leaving its effect on the product genuinely unknown.') }

  if (flags.length === 0) narrative.push('The CMC package is well-managed and ready to support both the confirmatory evidence package and commercial supply.')
  narrative.push(pickEvent(p, r()))

  const monthsAdded = Math.round(p.baseMonths * 0.12 + (lateValidation || noValidation ? 5 : 0) + (noBridging ? 6 : 0) + (stuckLabScale ? 10 : 0))
  const costAddedM = Math.round(p.baseCostM * 0.12 * (noBridging || stuckLabScale ? 1.4 : 1))

  return {
    stage: 'cmc',
    status: stuckLabScale || noValidation ? 'failure' : flags.length ? 'mixed' : 'success',
    headline: flags.length === 0 ? 'Manufacturing ready to support filing and commercial supply' : 'CMC package complete, with gaps on record',
    narrative, flags, monthsAdded, costAddedM,
    metrics: [
      { label: 'Process validation', value: noValidation ? 'Missing' : lateValidation ? 'Deferred' : 'Complete' },
      { label: 'Scale-up readiness', value: stuckLabScale ? 'Lab scale only' : noBridging ? 'Unbridged' : 'Commercial-ready' },
    ],
  }
}

export function runClinical(p: Program, c: Choices, preclinical: StageOutcome, seed: number): StageOutcome {
  const r = rng(seed, 47)
  const flags: string[] = []
  const narrative: string[] = []
  const skippedPreInd = c['pre_ind_meeting'] === 'skip'
  const skippedEop2 = c['eop2_meeting'] === 'skip'

  if (skippedPreInd && preclinical.flags.length > 0 && r() < 0.6) { flags.push('clinical_hold'); narrative.push('Without a pre-filing meeting to align on the nonclinical package, the gaps identified during preclinical development trigger a clinical hold shortly after filing to open clinical testing — the exact disagreement a meeting would likely have surfaced in advance.') }
  else if (skippedPreInd) narrative.push('Filing without a pre-filing meeting works out this time, but the program had no advance warning of any regulator concerns.')
  else narrative.push('The pre-filing meeting confirms the nonclinical package supports the proposed clinical protocol.')

  if (skippedEop2) { flags.push('unaligned_pivotal'); narrative.push('The pivotal trial design is finalized internally without regulatory input — a design later disputed at review is a real risk the program is now carrying forward.') }
  else narrative.push('An early efficacy signal is confirmed, and the pivotal trial design is aligned with the regulator before being finalized.')
  narrative.push(pickEvent(p, r()))

  const monthsAdded = Math.round(p.baseMonths * 0.37 + (flags.includes('clinical_hold') ? 12 : 0) + (skippedEop2 ? 8 : 0))
  const costAddedM = Math.round(p.baseCostM * 0.35 * (flags.includes('clinical_hold') ? 1.3 : 1))

  return {
    stage: 'clinical',
    status: flags.includes('clinical_hold') ? 'failure' : flags.length ? 'mixed' : 'success',
    headline: flags.includes('clinical_hold') ? 'Clinical hold issued shortly after filing' : flags.length ? 'Clinical milestone reached, with an unaddressed design risk' : 'Clinical milestone reached cleanly',
    narrative, flags, monthsAdded, costAddedM,
    metrics: [
      { label: 'Pre-filing alignment', value: skippedPreInd ? 'Not sought' : 'Confirmed' },
      { label: 'Pivotal design alignment', value: skippedEop2 ? 'Not sought' : 'Confirmed' },
    ],
  }
}

export function runSubmission(p: Program, c: Choices, priorFlags: string[], seed: number): StageOutcome {
  const r = rng(seed, 61)
  const flags: string[] = []
  const narrative: string[] = []
  const incomplete = c['ctd_completeness'] === 'known_gaps'
  const eligible = p.designationFit === 'eligible'
  const wrongDesignationCall = (eligible && c['designation_pursuit'] === 'skip') || (!eligible && c['designation_pursuit'] === 'pursue')
  const skippedPreSub = c['pre_submission_meeting'] === 'skip'

  if (incomplete) { flags.push('dossier_incomplete'); narrative.push('The submission is filed with known gaps, and the regulator identifies them during the filing-acceptance check rather than during substantive review.') }
  else narrative.push('The dossier is complete across all required modules at filing.')

  if (wrongDesignationCall) { flags.push('designation_misjudged'); narrative.push(eligible ? 'The program does not pursue a designation it appears to genuinely qualify for, forgoing faster review and closer regulatory engagement.' : 'The program pursues a designation it does not appear to meet the criteria for, and the request is denied without materially advancing the program.') }
  if (skippedPreSub && (priorFlags.includes('unaligned_pivotal') || incomplete) && r() < 0.5) { flags.push('format_dispute'); narrative.push('A content or format concern that a pre-submission meeting would likely have surfaced instead appears as a formal review question.') }
  if (priorFlags.includes('no_process_validation') || priorFlags.includes('unverified_comparability')) { flags.push('cmc_deficiency_at_filing'); narrative.push('CMC gaps identified earlier in the program surface again as review questions on the manufacturing section of the dossier.') }
  if (flags.length === 0) narrative.push('The submission is well-prepared and enters substantive review without early complications.')
  narrative.push(pickEvent(p, r()))

  const monthsAdded = Math.round(p.baseMonths * 0.14 + (incomplete ? 8 : 0) + (flags.includes('format_dispute') ? 4 : 0))
  const costAddedM = Math.round(p.baseCostM * 0.18 * (incomplete ? 1.2 : 1))

  return {
    stage: 'submission',
    status: incomplete ? 'failure' : flags.length ? 'mixed' : 'success',
    headline: incomplete ? 'Filing acceptance at risk — dossier incomplete' : flags.length ? 'Submission accepted for review, with issues on record' : 'Submission accepted for review cleanly',
    narrative, flags, monthsAdded, costAddedM,
    metrics: [
      { label: 'Dossier completeness', value: incomplete ? 'Incomplete' : 'Complete' },
      { label: 'Designation strategy', value: wrongDesignationCall ? 'Misjudged' : 'Sound' },
    ],
  }
}

export function reviewVerdict(p: Program, discovery: StageOutcome, preclinical: StageOutcome, cmc: StageOutcome, clinical: StageOutcome, submission: StageOutcome, grades: Grade[], authorityKey: string): FinalReport {
  const authority = getRegulator(authorityKey)
  const deficiencies: string[] = []
  const strengths: string[] = []
  const fatal: string[] = []

  if (submission.flags.includes('dossier_incomplete')) fatal.push('The submission was incomplete against required modules at filing.')
  if (clinical.flags.includes('clinical_hold')) deficiencies.push('A clinical hold was issued due to an inadequately characterized nonclinical package.')
  if (preclinical.flags.includes('species_mismatch')) deficiencies.push('The toxicology species selected does not adequately support an assessment of human risk.')
  if (preclinical.flags.includes('duration_mismatch')) deficiencies.push('Toxicology study duration does not adequately support the clinical program as conducted.')
  if (preclinical.flags.includes('battery_gap')) deficiencies.push('A basic nonclinical safety question was left unanswered before human dosing.')
  if (discovery.flags.includes('weak_validation_overcommit')) deficiencies.push('Significant resources were committed against a target with an inadequately established causal role in the disease.')
  if (cmc.flags.includes('no_process_validation')) deficiencies.push('The manufacturing process lacks documented validation evidence.')
  if (cmc.flags.includes('late_process_validation')) deficiencies.push('Process validation was deferred rather than completed ahead of the pivotal evidence package.')
  if (cmc.flags.includes('unbridged_scale_up')) deficiencies.push('A scale-dependent manufacturing quality issue was not caught before commercial-scale production.')
  if (cmc.flags.includes('unverified_comparability')) deficiencies.push('A manufacturing process change was made without comparability testing.')
  if (clinical.flags.includes('unaligned_pivotal')) deficiencies.push('The pivotal trial design was finalized without regulatory alignment.')
  if (submission.flags.includes('designation_misjudged')) deficiencies.push('The expedited/special designation strategy was misjudged given the program’s actual profile.')
  if (submission.flags.includes('format_dispute')) deficiencies.push('A content or format concern surfaced during review that a pre-submission meeting would likely have resolved in advance.')
  if (submission.flags.includes('cmc_deficiency_at_filing')) deficiencies.push('Earlier CMC gaps resurfaced as review questions on the manufacturing section of the dossier.')
  if (preclinical.flags.includes('unexplained_tox_finding')) deficiencies.push('An unexplained toxicology finding, traceable to a skipped selectivity assessment, remains only partially resolved.')

  if (authority.requiresTwoPivotal && deficiencies.length === 0 && fatal.length === 0) {
    deficiencies.push(`${authority.name} generally expects two independent pivotal evidence packages for full approval; this program’s evidence base should be reviewed against that expectation.`)
  }

  if (discovery.flags.length === 0) strengths.push('Discovery-stage decisions were well matched to the strength of the actual validation evidence.')
  if (preclinical.flags.length === 0) strengths.push('The nonclinical package was well matched to this program’s actual risk profile.')
  if (cmc.flags.length === 0) strengths.push('The CMC/manufacturing package was well managed, supporting both the evidence package and commercial supply.')
  if (clinical.flags.length === 0) strengths.push('Both regulatory alignment checkpoints during clinical development were used effectively.')
  if (submission.flags.length === 0) strengths.push('The submission was complete and well-prepared at filing.')

  const score = grades.reduce((a, g) => a + g.points, 0)
  const maxScore = grades.reduce((a, g) => a + g.maxPoints, 0)

  let verdict: FinalVerdict
  const noveltyAndRisk = p.modalityKey === 'gene_therapy' || p.modalityKey === 'adc'
  if (fatal.length > 0) verdict = 'refuse_to_file'
  else if (deficiencies.length === 0) verdict = noveltyAndRisk ? 'advisory_committee_then_approvable' : 'approvable'
  else if (deficiencies.length <= 2 && !clinical.flags.includes('clinical_hold') && !cmc.flags.includes('lab_scale_only')) verdict = noveltyAndRisk ? 'advisory_committee_then_approvable' : 'approvable'
  else if (deficiencies.length >= 4 || cmc.flags.includes('lab_scale_only')) verdict = 'terminated'
  else verdict = 'complete_response'

  const appName = applicationName(authorityKey, p.modalityKey)
  const verdictLabel = verdict === 'approvable' ? 'Approvable' : verdict === 'advisory_committee_then_approvable' ? 'Advisory committee review, then approvable' : verdict === 'complete_response' ? 'Complete Response — deficiencies to address' : verdict === 'refuse_to_file' ? 'Refuse to File' : 'Program terminated'

  const verdictSummary = verdict === 'approvable'
    ? `${authority.name}'s review considers the ${appName} for ${p.drug} (${p.code}) approvable for ${p.indication.toLowerCase()}. The development program, from target validation through submission, was well-executed and the evidence package is adequate to support approval.${deficiencies.length ? ' The points below should still be addressed in labeling or as post-marketing commitments.' : ''}`
    : verdict === 'advisory_committee_then_approvable'
      ? `Given the novelty and risk profile of ${p.drug}, ${authority.name} convenes an advisory committee review before a final decision on the ${appName}. The committee's discussion focuses on the points below, and the program proceeds to an approvable decision following that review.`
      : verdict === 'complete_response'
        ? `${authority.name} issues a Complete Response for the ${appName} for ${p.drug}. The deficiencies below, specific to decisions made across this program's development, must be resolved before a further review cycle.`
        : verdict === 'refuse_to_file'
          ? `${authority.name} does not accept the ${appName} for ${p.drug} for filing. ${fatal[0] ?? ''}`
          : `Development of ${p.drug} is terminated. The accumulated deficiencies across the program mean a further review cycle could not be justified on the existing evidence package.`

  const totalMonths = discovery.monthsAdded + preclinical.monthsAdded + cmc.monthsAdded + clinical.monthsAdded + submission.monthsAdded
  const totalCostM = discovery.costAddedM + preclinical.costAddedM + cmc.costAddedM + clinical.costAddedM + submission.costAddedM

  return { verdict, verdictLabel, verdictSummary, deficiencies: fatal.concat(deficiencies), strengths, score, maxScore, grades, authorityKey, totalMonths, totalCostM }
}

// ---------------------------------------------------------------------------
// Regulatory meeting feedback (submission stage) — reuses the grading logic
// to give pre-filing feedback on a draft, mirroring the companion Clinical
// Trial Simulator's regulatory meeting mechanic.
// ---------------------------------------------------------------------------
export interface MeetingFeedback { concerns: string[]; supportive: string[] }

export function runRegulatoryMeeting(program: Program, draftChoices: Choices): MeetingFeedback {
  const grades = gradeStage(program, 'submission', draftChoices)
  const concerns = grades.filter((g) => g.verdict === 'poor').map((g) => `${g.title}: ${g.explanation}`)
  const supportive = grades.filter((g) => g.verdict === 'best').map((g) => `${g.title}: agreed.`)
  return { concerns, supportive }
}

// ---------------------------------------------------------------------------
// Post-mortem — for a Terminated or Refuse to File verdict, trace the
// earliest consequential design error chronologically across the program.
// ---------------------------------------------------------------------------
const STAGE_ORDER: StageKey[] = ['discovery', 'preclinical', 'cmc', 'clinical', 'submission']

export function findEarliestFailurePoint(grades: Grade[]): Grade | null {
  for (const stage of STAGE_ORDER) {
    const poorInStage = grades.find((g) => g.stage === stage && g.verdict === 'poor')
    if (poorInStage) return poorInStage
  }
  return null
}
