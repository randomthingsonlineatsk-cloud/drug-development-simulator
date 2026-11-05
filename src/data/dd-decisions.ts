import type { Decision, Program, StageKey } from './dd-types'

export function buildDecisions(program: Program, stage: StageKey): Decision[] {
  if (stage === 'discovery') return discoveryDecisions()
  if (stage === 'preclinical') return preclinicalDecisions()
  if (stage === 'cmc') return cmcDecisions()
  if (stage === 'clinical') return clinicalDecisions()
  return submissionDecisions(program)
}

function discoveryDecisions(): Decision[] {
  return [
    {
      id: 'target_response', stage: 'discovery', title: 'Response to target validation evidence',
      prompt: 'Given the validation evidence described in the program brief, how do you proceed?',
      options: [
        { id: 'proceed_full', label: 'Proceed directly to full lead optimization and IND-enabling investment', detail: 'Commits significant resources now, betting the existing evidence is sufficient.' },
        { id: 'validate_more', label: 'Invest in additional validation (e.g., a genetic association study or human tissue confirmation) before committing full resources', detail: 'Slower, but reduces the risk of investing heavily behind a target that later fails to translate.' },
        { id: 'proceed_minimal', label: 'Proceed with minimal further diligence, prioritizing speed to the clinic', detail: 'Fastest option, but skips diligence appropriate to the actual strength of the evidence.' },
      ],
    },
    {
      id: 'optimization_priority', stage: 'discovery', title: 'Lead optimization priority',
      prompt: 'What do you optimize for when selecting a development candidate from the chemical/biological series?',
      options: [
        { id: 'balanced', label: 'Balance potency, selectivity, and developability (ADME/physicochemical properties) together', detail: 'The standard, defensible approach — a compound that is potent but undevelopable or non-selective still fails later.' },
        { id: 'potency_only', label: 'Optimize purely for potency, deferring selectivity and developability work', detail: 'Risks discovering late that the most potent compound has poor exposure or off-target liabilities.' },
        { id: 'cost_speed_only', label: 'Optimize for fastest synthesis and lowest cost, accepting suboptimal potency', detail: 'Risks an underpowered candidate that cannot achieve adequate exposure at a tolerable dose.' },
      ],
    },
    {
      id: 'selectivity_profiling', stage: 'discovery', title: 'Selectivity profiling',
      prompt: 'How thoroughly do you profile the candidate against related targets before advancing?',
      options: [
        { id: 'broad_panel', label: 'Run a broad off-target/selectivity panel before advancing', detail: 'Surfaces off-target liabilities early, before they surface as unexplained toxicology findings.' },
        { id: 'minimal', label: 'Minimal selectivity testing, relying mainly on the efficacy model', detail: 'An efficacy model alone says nothing about off-target risk.' },
        { id: 'none', label: 'No selectivity testing', detail: 'Off-target liabilities, if present, will only be discovered later — more expensively.' },
      ],
    },
  ]
}

function preclinicalDecisions(): Decision[] {
  return [
    {
      id: 'species_selection', stage: 'preclinical', title: 'Toxicology species selection',
      prompt: 'How do you select the species for IND-enabling toxicology studies?',
      options: [
        { id: 'pharmacologically_relevant', label: 'Select species based on confirmed pharmacological relevance (target expression/binding/functional activity)', detail: 'Per ICH S6(R1) principles: a species where the drug does not engage the target the way it will in humans tells you little about real risk.' },
        { id: 'default_two_species', label: 'Default to the standard two-species toxicology package regardless of relevance', detail: 'A reasonable default for many small molecules, but can be the wrong call when pharmacological relevance genuinely varies by species.' },
        { id: 'single_species', label: 'Use a single species to save cost and time', detail: 'Reduces the safety database’s ability to detect species-specific findings.' },
      ],
    },
    {
      id: 'tox_duration', stage: 'preclinical', title: 'Repeat-dose toxicology duration',
      prompt: 'How do you scope the duration of the repeat-dose toxicology studies?',
      options: [
        { id: 'matched_to_clinical', label: 'Match (or exceed) the intended clinical dosing duration at each stage', detail: 'The ICH M3(R2) principle: nonclinical duration should support, not lag behind, the clinical protocol it is meant to enable.' },
        { id: 'shorter_than_clinical', label: 'Run studies shorter than the planned clinical dosing duration', detail: 'Leaves the clinical protocol unsupported by adequate nonclinical duration, risking a clinical hold or forced protocol amendment.' },
        { id: 'longer_than_needed', label: 'Run studies longer than clinically necessary', detail: 'Sometimes appropriate for durable or irreversible interventions, but otherwise adds time and cost without matching regulatory expectation.' },
      ],
    },
    {
      id: 'safety_battery', stage: 'preclinical', title: 'Genotoxicity & safety pharmacology battery',
      prompt: 'How complete is the nonclinical safety battery before first-in-human dosing?',
      options: [
        { id: 'full_battery', label: 'Full genotoxicity battery plus a complete safety pharmacology core battery (cardiovascular, respiratory, CNS)', detail: 'The standard expectation before first-in-human dosing for a novel investigational product.' },
        { id: 'partial_battery', label: 'A partial battery, scoped to what seems most relevant', detail: 'Can be appropriate when a component is already characterized elsewhere (e.g., a known active ingredient), but is a gap for a genuinely novel candidate.' },
        { id: 'skipped', label: 'Skip formal battery testing to save time', detail: 'Leaves basic safety questions unanswered before human dosing.' },
      ],
    },
  ]
}

function cmcDecisions(): Decision[] {
  return [
    {
      id: 'process_validation_timing', stage: 'cmc', title: 'Manufacturing process validation timing',
      prompt: 'When do you formally validate the commercial manufacturing process?',
      options: [
        { id: 'validate_before_pivotal', label: 'Validate the process before pivotal trial material is manufactured', detail: 'Ensures the clinical material used for the confirmatory evidence package is representative of what will actually be commercialized.' },
        { id: 'validate_after_filing', label: 'Defer formal validation until after filing, addressing it during review', detail: 'Risks discovering a comparability gap between clinical-trial material and the to-be-commercialized process only after submission.' },
        { id: 'never_formally_validate', label: 'Rely on informal process consistency without formal validation', detail: 'Leaves the manufacturing process without the documented evidence a marketing application requires.' },
      ],
    },
    {
      id: 'scale_up_strategy', stage: 'cmc', title: 'Scale-up strategy',
      prompt: 'How do you move from lab-scale to commercial-scale manufacturing?',
      options: [
        { id: 'bridged_scale_up', label: 'Use representative pilot-scale material with a defined, staged scale-up bridging plan', detail: 'Characterizes how critical quality attributes behave at each scale before committing to full commercial scale.' },
        { id: 'jump_to_commercial_scale', label: 'Jump directly to full commercial scale without intermediate bridging', detail: 'Risks discovering scale-dependent quality issues only after a large, expensive commercial-scale batch is already made.' },
        { id: 'stay_lab_scale', label: 'Remain at lab scale indefinitely', detail: 'Cannot support the clinical or commercial supply the program will eventually need.' },
      ],
    },
    {
      id: 'batch_comparability', stage: 'cmc', title: 'Batch-to-batch comparability',
      prompt: 'When a manufacturing process change occurs, how do you handle comparability?',
      options: [
        { id: 'comprehensive_comparability', label: 'Comprehensive comparability testing (analytical, and where relevant, functional/biological) before and after the change', detail: 'Directly demonstrates the changed process produces an equivalent product, the standard expectation for any meaningful process change.' },
        { id: 'minimal_testing', label: 'Minimal release testing only, without a dedicated comparability study', detail: 'Confirms the new batch meets specification, but does not directly demonstrate equivalence to the pre-change product.' },
        { id: 'assume_comparable', label: 'Assume comparability without additional testing', detail: 'Leaves a real question — whether the change affected the product — entirely unaddressed.' },
      ],
    },
  ]
}

function clinicalDecisions(): Decision[] {
  return [
    {
      id: 'pre_ind_meeting', stage: 'clinical', title: 'Pre-IND / pre-CTA meeting',
      prompt: 'Do you request a meeting with the regulator before filing to open clinical testing?',
      options: [
        { id: 'request', label: 'Request a meeting to align on the nonclinical package and proposed clinical protocol', detail: 'Surfaces disagreements before filing, reducing the risk of a clinical hold or refuse-to-proceed decision.' },
        { id: 'skip', label: 'File without requesting a meeting', detail: 'Faster on paper, but any misalignment is discovered only after filing, when it is more disruptive to fix.' },
      ],
    },
    {
      id: 'eop2_meeting', stage: 'clinical', title: 'End-of-Phase-2 style meeting',
      prompt: 'After an early efficacy signal, do you request a meeting to align on the pivotal (confirmatory) trial design before finalizing it?',
      options: [
        { id: 'request', label: 'Request a meeting to align on the pivotal trial design', detail: 'The standard checkpoint to reduce the risk of a costly pivotal trial with a design the regulator later disputes.' },
        { id: 'skip', label: 'Finalize the pivotal design internally without a meeting', detail: 'Saves time only if the internal design happens to already match regulatory expectations — a real risk to gamble on.' },
      ],
    },
  ]
}

function submissionDecisions(program: Program): Decision[] {
  return [
    {
      id: 'ctd_completeness', stage: 'submission', title: 'Dossier completeness at filing',
      prompt: 'How complete is the submission when you file?',
      options: [
        { id: 'complete', label: 'Submit a complete dossier across all required nonclinical, clinical, and CMC modules', detail: 'The expectation for a filing to be accepted for substantive review rather than administratively rejected.' },
        { id: 'known_gaps', label: 'Submit with known gaps, planning to address them during review', detail: 'Risks a refuse-to-file or an early, avoidable deficiency finding.' },
      ],
    },
    {
      id: 'designation_pursuit', stage: 'submission', title: `Pursue ${program.designationName}?`,
      prompt: 'Based on the program profile, do you pursue this expedited/special designation?',
      options: [
        { id: 'pursue', label: 'Pursue the designation', detail: program.designationFit === 'eligible' ? 'If the program genuinely meets the criteria, this can meaningfully speed review and increase regulatory engagement.' : 'Pursuing a designation the program does not meet the criteria for wastes time on a request likely to be denied.' },
        { id: 'skip', label: 'Do not pursue the designation', detail: program.designationFit === 'eligible' ? 'If the program genuinely qualifies, this forgoes a real opportunity to speed the program and increase regulatory engagement.' : 'The right call when the program does not genuinely meet the criteria.' },
      ],
    },
    {
      id: 'pre_submission_meeting', stage: 'submission', title: 'Pre-submission meeting',
      prompt: 'Do you request a meeting to align on submission content before filing?',
      options: [
        { id: 'request', label: 'Request a pre-submission meeting', detail: 'Surfaces format or content concerns before the formal filing clock starts.' },
        { id: 'skip', label: 'File without a pre-submission meeting', detail: 'Any format or content concerns are discovered only after the review clock has already started.' },
      ],
    },
  ]
}

export function totalDecisionCount(program: Program): number {
  return discoveryDecisions().length + preclinicalDecisions().length + cmcDecisions().length + clinicalDecisions().length + submissionDecisions(program).length
}
