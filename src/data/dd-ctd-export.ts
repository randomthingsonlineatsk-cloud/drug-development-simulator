import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx'
import type { FinalReport, Program, StageOutcome, Grade } from './dd-types'

// ---------------------------------------------------------------------------
// Generates a mock CTD-style Word document — modeled on the real Module 2.4
// (Nonclinical Overview) and Module 2.5 (Clinical Overview) structure used
// in an actual regulatory submission — populated with this run's own
// decisions and outcomes. This is a teaching artifact showing what such a
// document's structure looks like, populated with fictional content; it is
// not a template for an actual regulatory filing.
// ---------------------------------------------------------------------------

function gradesSection(title: string, grades: Grade[]): Paragraph[] {
  const out: Paragraph[] = [new Paragraph({ text: title, heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 120 } })]
  for (const g of grades) {
    out.push(new Paragraph({ children: [new TextRun({ text: g.title, bold: true })], spacing: { before: 160 } }))
    out.push(new Paragraph({ children: [new TextRun({ text: `Approach taken: ${g.chosenLabel}`, italics: true })] }))
    out.push(new Paragraph({ children: [new TextRun({ text: g.explanation })], spacing: { after: 80 } }))
  }
  return out
}

function narrativeSection(title: string, outcome: StageOutcome | null): Paragraph[] {
  if (!outcome) return []
  const out: Paragraph[] = [new Paragraph({ text: title, heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 120 } })]
  for (const n of outcome.narrative) out.push(new Paragraph({ children: [new TextRun({ text: n })], spacing: { after: 80 } }))
  return out
}

export async function buildCtdDocumentBlob(
  program: Program,
  report: FinalReport,
  discovery: StageOutcome | null,
  preclinical: StageOutcome | null,
  cmc: StageOutcome | null,
  clinical: StageOutcome | null,
  submission: StageOutcome | null,
  authorityName: string,
  applicationLabel: string,
): Promise<Blob> {
  const discoveryGrades = report.grades.filter((g) => g.stage === 'discovery')
  const preclinicalGrades = report.grades.filter((g) => g.stage === 'preclinical')
  const cmcGrades = report.grades.filter((g) => g.stage === 'cmc')
  const clinicalGrades = report.grades.filter((g) => g.stage === 'clinical')

  const children: Paragraph[] = [
    new Paragraph({ text: `${program.drug} (${program.code})`, heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER }),
    new Paragraph({ text: `Module 2.4 Nonclinical Overview & Module 2.5 Clinical Overview`, heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, spacing: { after: 120 } }),
    new Paragraph({ children: [new TextRun({ text: `Reviewing authority: ${authorityName} — ${applicationLabel}`, italics: true })], alignment: AlignmentType.CENTER, spacing: { after: 60 } }),
    new Paragraph({ children: [new TextRun({ text: 'All content is entirely fictional and generated for educational purposes only. Not a real regulatory document.', italics: true, size: 18 })], alignment: AlignmentType.CENTER, spacing: { after: 360 } }),

    new Paragraph({ text: '2.4.1 Overview of Nonclinical Testing Strategy', heading: HeadingLevel.HEADING_1, spacing: { before: 240, after: 120 } }),
    new Paragraph({ children: [new TextRun({ text: `Indication: ${program.indication}` })] }),
    new Paragraph({ children: [new TextRun({ text: `Modality: ${program.modality}` })] }),
    new Paragraph({ children: [new TextRun({ text: `Mechanism of action: ${program.moa}` })], spacing: { after: 120 } }),
    new Paragraph({ children: [new TextRun({ text: program.discoveryContext })], spacing: { after: 120 } }),

    ...gradesSection('2.4.2 Pharmacology — Discovery-Stage Rationale', discoveryGrades),
    ...narrativeSection('Discovery Outcome Narrative', discovery),
    ...gradesSection('2.4.3 Toxicology — Nonclinical Safety Package', preclinicalGrades),
    ...narrativeSection('Preclinical Outcome Narrative', preclinical),
    ...gradesSection('2.4.4 Quality (CMC) Summary', cmcGrades),
    ...narrativeSection('CMC Outcome Narrative', cmc),

    new Paragraph({ text: '2.5.1 Clinical Overview', heading: HeadingLevel.HEADING_1, spacing: { before: 240, after: 120 } }),
    ...gradesSection('Regulatory Alignment Checkpoints', clinicalGrades),
    ...narrativeSection('Clinical Milestone Narrative', clinical),

    new Paragraph({ text: '2.5.2 Benefit-Risk Assessment and Regulatory Decision', heading: HeadingLevel.HEADING_1, spacing: { before: 240, after: 120 } }),
    new Paragraph({ children: [new TextRun({ text: `Verdict: ${report.verdictLabel}`, bold: true })], spacing: { after: 80 } }),
    new Paragraph({ children: [new TextRun({ text: report.verdictSummary })], spacing: { after: 160 } }),
  ]

  if (report.deficiencies.length > 0) {
    children.push(new Paragraph({ text: 'Deficiencies Cited', heading: HeadingLevel.HEADING_2, spacing: { before: 160, after: 80 } }))
    for (const d of report.deficiencies) children.push(new Paragraph({ children: [new TextRun({ text: `• ${d}` })], spacing: { after: 60 } }))
  }
  if (report.strengths.length > 0) {
    children.push(new Paragraph({ text: 'Strengths Recognized', heading: HeadingLevel.HEADING_2, spacing: { before: 160, after: 80 } }))
    for (const s of report.strengths) children.push(new Paragraph({ children: [new TextRun({ text: `• ${s}` })], spacing: { after: 60 } }))
  }

  children.push(new Paragraph({ text: `Timeline & Cost Summary`, heading: HeadingLevel.HEADING_2, spacing: { before: 160, after: 80 } }))
  children.push(new Paragraph({ children: [new TextRun({ text: `Total estimated timeline to this decision: ~${report.totalMonths} months. Total estimated cost: ~$${report.totalCostM}M.` })], spacing: { after: 160 } }))

  children.push(new Paragraph({ children: [new TextRun({ text: 'built by Khan Gulrez Shagufa Fazal Ahmed — Drug Development Simulator', italics: true, size: 16 })], alignment: AlignmentType.CENTER, spacing: { before: 360 } }))

  const doc = new Document({ sections: [{ children }] })
  return Packer.toBlob(doc)
}
