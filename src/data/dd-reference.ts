import type { PhaseIvEvent } from './dd-types'

export interface GlossaryEntry { term: string; group: string; body: string }

export const GLOSSARY: GlossaryEntry[] = [
  { term: 'Target validation', group: 'Discovery', body: 'Evidence that modulating a proposed biological target will actually affect disease. Strength varies widely: human genetic association or natural-history evidence is the strongest basis; animal disease-model data alone is materially weaker and a well-documented driver of late clinical attrition when treated as sufficient; in vitro/biochemical rationale alone is weaker still.' },
  { term: 'Lead optimization', group: 'Discovery', body: 'The medicinal chemistry/protein engineering process of refining a hit compound into a development candidate, balancing potency against selectivity and developability (solubility, stability, metabolic clearance) rather than optimizing any single property in isolation.' },
  { term: 'ICH S6(R1) — species relevance', group: 'Preclinical', body: 'For biotechnology-derived pharmaceuticals, toxicology species should be selected based on demonstrated pharmacological relevance (the drug engages the target the way it will in humans), not a default species pair — an irrelevant species tells you little about real human risk.' },
  { term: 'ICH M3(R2) — nonclinical study duration', group: 'Preclinical', body: 'Repeat-dose toxicology study duration should be designed to support (equal or exceed) the intended duration of clinical dosing at each stage of development — nonclinical data that is too short to cover the planned clinical protocol can stall or block that protocol.' },
  { term: 'ICH S2(R1) / S7A — genotoxicity & safety pharmacology', group: 'Preclinical', body: 'The standard genotoxicity battery and safety pharmacology core battery (cardiovascular, respiratory, central nervous system) expected before first-in-human dosing of a novel investigational product.' },
  { term: 'Juvenile animal toxicology', group: 'Preclinical', body: 'A pediatric-specific nonclinical study design assessing developmental risks (growth, organ maturation, behavior) that adult toxicology studies cannot address — required when extrapolating an adult-approved drug to pediatric use, or developing a pediatric-specific program.' },
  { term: 'Process validation', group: 'CMC', body: 'Documented evidence that a manufacturing process, run at commercial scale, consistently produces a product meeting its predetermined quality specifications — normally expected to be completed before or alongside the pivotal evidence package, not deferred until after filing.' },
  { term: 'Scale-up bridging', group: 'CMC', body: 'A staged manufacturing strategy moving from lab or pilot scale toward commercial scale, characterizing how critical quality attributes behave at each scale before committing to full commercial-scale production.' },
  { term: 'Batch comparability', group: 'CMC', body: 'Analytical (and where relevant, functional or biological) testing demonstrating that product made before and after a manufacturing process change is equivalent — the standard expectation whenever a meaningful process change occurs.' },
  { term: 'IND / CTA', group: 'Clinical', body: 'The application that must be cleared (or not placed on clinical hold) before clinical testing can begin — an Investigational New Drug application in the US, a Clinical Trial Application in many other jurisdictions.' },
  { term: 'Pre-IND / pre-CTA meeting', group: 'Clinical', body: 'An optional but standard meeting with the regulator before filing to open clinical testing, used to align on the adequacy of the nonclinical package and the proposed clinical protocol before committing to it.' },
  { term: 'End-of-Phase-2 meeting', group: 'Clinical', body: 'A checkpoint meeting after early efficacy data, used to align on the design of the pivotal (confirmatory) trial before finalizing it — reduces the risk of running an expensive pivotal trial with a design the regulator later disputes.' },
  { term: 'Clinical hold', group: 'Clinical', body: 'A regulatory order pausing or preventing clinical testing, often triggered by an inadequately characterized nonclinical safety package relative to the proposed clinical protocol.' },
  { term: 'CTD (Common Technical Document)', group: 'Submission', body: 'The internationally harmonized dossier structure for a marketing application, organized into five modules covering administrative information, summaries, quality (CMC), nonclinical, and clinical data.' },
  { term: 'NDA / BLA / MAA', group: 'Submission', body: 'The application name varies by authority and modality: an NDA (New Drug Application) for most small molecules and a BLA (Biologics License Application) for biologics/vaccines/gene therapies in the US and Canada; an MAA (Marketing Authorisation Application) in EU-pattern authorities (EMA, MHRA, Swissmedic); most other authorities use a generic Marketing Authorization submission.' },
  { term: 'Refuse to File', group: 'Submission', body: 'A regulator’s decision that a submission is administratively or substantively incomplete and will not be accepted for review at all — distinct from a Complete Response, which follows a completed review.' },
  { term: 'Complete Response', group: 'Submission', body: 'A regulator’s decision, after review, that an application cannot be approved in its current form, citing specific deficiencies that must be resolved before a further review cycle.' },
  { term: 'Advisory committee', group: 'Submission', body: 'A panel of external experts convened for novel, high-risk, or otherwise complex applications to publicly discuss the evidence before a final regulatory decision — common for genuinely novel modalities like gene therapies.' },
  { term: 'Expedited / special designations', group: 'Submission', body: 'Programs (such as Breakthrough Therapy at FDA, PRIME at EMA, or equivalent programs elsewhere) intended for serious conditions with unmet need and a meaningfully differentiated profile — pursuing one without genuinely meeting the criteria wastes time on a request likely to be denied. Program names and exact criteria genuinely differ by authority.' },
  { term: 'Regulatory divergence', group: 'Submission', body: 'Different authorities apply genuinely different conventions on the same evidence: how many pivotal studies are expected, what a designation program is called and what it requires, and whether an accelerated/conditional pathway exists at all.' },
  { term: 'Complex generic / 505(b)(2)-style pathway', group: 'Submission', body: 'A development pathway for a product relying in part on already-established evidence for an active ingredient (e.g., a new formulation of an approved drug) — appropriately scoped nonclinical and clinical work addresses only the new elements, not the already-characterized active ingredient itself.' },
  { term: 'Risk Management Plan (RMP)', group: 'Post-Approval', body: 'A living document, required by many regulators in some form, documenting a product’s safety specification, planned pharmacovigilance activities, and risk minimization measures — updated across the product’s lifecycle as new safety information emerges.' },
  { term: 'Post-marketing commitment', group: 'Post-Approval', body: 'A study or activity a sponsor agrees to complete after approval, often as a condition of an accelerated/conditional approval (a confirmatory trial) or to further characterize a safety question identified during review.' },
]

export const RMP_NOTE = 'A Risk Management Plan (RMP), required by many regulators in some form, documents a product’s safety specification, the planned pharmacovigilance activities to characterize risk further, and the risk minimization measures in place — a living document updated across the product’s lifecycle.'

export const PHASE_IV_EVENTS: PhaseIvEvent[] = [
  {
    headline: 'A post-marketing safety signal emerges',
    description: 'Several months after launch, spontaneous adverse event reports suggest a possible rare, serious reaction not seen in the pre-approval database. Regulators request an urgent safety review.',
    goodNote: 'A prompt, thorough safety review with a transparent risk-communication update maintains regulatory confidence and keeps the product on the market with updated labeling.',
    badNote: 'A delayed or dismissive response damages regulatory trust and can trigger a more severe compliance action than the signal alone would have warranted.',
  },
  {
    headline: 'A confirmatory post-marketing trial commitment is due',
    description: 'The confirmatory trial committed to as a condition of accelerated/conditional approval has reached its deadline.',
    goodNote: 'A completed, positive confirmatory trial converts the conditional approval into a full approval.',
    badNote: 'A missed deadline or a confirmatory trial that fails to verify the surrogate’s predicted benefit converts the conditional approval into a withdrawal.',
  },
]
