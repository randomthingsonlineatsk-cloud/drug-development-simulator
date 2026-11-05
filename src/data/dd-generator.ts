import { PROGRAMS } from './dd-programs'
import type { Program } from './dd-types'

// ---------------------------------------------------------------------------
// Endless Practice generator. As with the companion Clinical Trial
// Simulator, correctness here depends on tightly interacting rules (risk
// profile → species/dose/duration/safety logic) where an auto-derived
// "correct answer" could easily be internally inconsistent and teach
// something wrong. Rather than risk that, this generator reskins each of
// the validated program archetypes with a fresh procedurally-generated
// compound name and randomly selected flavor-text variants, keeping the
// underlying grading logic always the validated one.
// ---------------------------------------------------------------------------

const NAME_PREFIXES = ['Kina', 'Cyto', 'Vira', 'Geno', 'Bio', 'Pedi', 'Combi', 'Onco', 'Rev', 'Diagno', 'Silen', 'Radio', 'Duo', 'Sim', 'Zenith', 'Corvin', 'Haldor', 'Nexara', 'Valtor']
const NAME_SUFFIXES = ['rex', 'blok', 'seal', 'fix', 'quin', 'vant', 'ject', 'link', 'iva', 'targ', 'cix', 'trace', 'cor', 'bio', 'imab', 'olan', 'exin']

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function generateName(): { drug: string; code: string } {
  const drug = randomFrom(NAME_PREFIXES) + randomFrom(NAME_SUFFIXES)
  const letters = drug.slice(0, 3).toUpperCase()
  const num = 1 + Math.floor(Math.random() * 90)
  return { drug: drug.charAt(0).toUpperCase() + drug.slice(1), code: `${letters}-${num}` }
}

const PRECLINICAL_VARIANTS: Record<string, string[]> = {
  small_molecule: [
    'Strong efficacy signal in the primary animal model, with a dose-toxicity relationship characterized across two species.',
    'Consistent efficacy across two independent animal models, with a wide margin between the efficacious and toxic dose.',
  ],
  biologic: [
    'Robust target engagement and downstream biological effect in the relevant animal model, though the model’s pharmacological relevance to humans is imperfect.',
    'Clear mechanism-of-action confirmation preclinically, with a toxicology package limited by partial cross-reactivity to the human target.',
  ],
  vaccine: [
    'Strong immunogenicity and protection against challenge in the relevant animal model, with a preclinical safety profile consistent with this platform.',
    'Reproducible immune response and protection in two independent animal challenge studies.',
  ],
  gene_therapy: [
    'Durable transgene expression and correction of the biochemical defect in the relevant animal model, with no evidence of integration-related findings at the doses tested.',
    'Efficient tissue transduction and sustained biological effect in the pharmacologically relevant species.',
  ],
  complex_generic: [
    'In vitro dissolution and release-profile characterization consistent with the intended formulation design.',
    'Pilot pharmacokinetic modeling trending toward the intended release profile.',
  ],
  combination_product: [
    'Device performance testing across representative handling conditions consistent with the intended delivery specification.',
    'Human-factors usability sessions identifying manageable, addressable design refinements.',
  ],
  adc: [
    'Confirmed antibody-mediated internalization and payload release in tumor xenograft models, with linker stability characterized across a range of plasma conditions.',
    'Bystander cytotoxicity and antigen-dependent efficacy demonstrated in independent tumor models.',
  ],
  diagnostic_codev: [
    'Concordant analytical performance of the companion diagnostic assay across multiple laboratory sites.',
    'Early biomarker-stratified efficacy data supporting the co-development strategy.',
  ],
  rna_therapeutic: [
    'Robust target transcript silencing confirmed in the pharmacologically relevant species, with an early off-target screen showing no major unintended silencing.',
    'Durable knockdown of the target protein in the relevant animal model, with conjugate stability confirmed across simulated physiological conditions.',
  ],
  radiopharmaceutical: [
    'Confirmed receptor-mediated tumor uptake in the pharmacologically relevant species, with preliminary dosimetry modeling within expected ranges.',
    'Strong tumor-to-background uptake ratio in imaging studies using the same targeting peptide backbone.',
  ],
  fixed_dose_combination: [
    'No clinically meaningful pharmacokinetic interaction detected between the two established active ingredients in preclinical interaction studies.',
    'Additive pharmacodynamic effect confirmed in animal models without evidence of an unexpected interaction.',
  ],
  biosimilar: [
    'Strong analytical and functional similarity to the reference product confirmed across multiple manufacturing lots.',
    'Comparative preclinical pharmacokinetics trending toward overlap with the reference product’s established profile.',
  ],
}

export function generateProgram(): Program {
  const template = randomFrom(PROGRAMS)
  const { drug, code } = generateName()
  const shuffledEvents = [...template.events].sort(() => Math.random() - 0.5)
  const variants = PRECLINICAL_VARIANTS[template.modalityKey] ?? PRECLINICAL_VARIANTS.small_molecule
  return {
    ...template,
    id: `gen-${template.id}-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
    drug,
    code,
    discoveryContext: randomFrom(variants),
    events: shuffledEvents,
  }
}

export const GENERATOR_ARCHETYPE_COUNT = PROGRAMS.length
