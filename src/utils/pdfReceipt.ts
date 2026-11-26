import type { ContractingStructureOption, ContractPayout } from '../types/kora';

function normalizePdfAscii(input: string): string {
  return String(input ?? '')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2022|\u00B7/g, '*')
    .replace(/[^\x20-\x7E\n]/g, ' ');
}

function escapePdfString(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function wrapLine(text: string, maxChars: number): string[] {
  const clean = normalizePdfAscii(text).replace(/\s+/g, ' ').trim();
  if (!clean) return [''];
  const words = clean.split(' ');
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    if (!current) {
      current = word;
    } else if (current.length + 1 + word.length <= maxChars) {
      current = `${current} ${word}`;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

interface PdfLineSpec {
  text: string;
  font: 'F1' | 'F2' | 'F3';
  size: number;
  x?: number;
  gapAfter?: number;
  colorRgb?: [number, number, number];
}

function buildSinglePagePdfFromLines(lines: PdfLineSpec[]): Uint8Array {
  const commands: string[] = [];
  let y = 752;
  const minY = 52;

  for (const spec of lines) {
    if (y < minY) break;
    const x = spec.x ?? 52;
    const safeText = escapePdfString(normalizePdfAscii(spec.text));
    const [r, g, b] = spec.colorRgb ?? [0.09, 0.1, 0.11];
    commands.push(
      'BT',
      `/${spec.font} ${spec.size} Tf`,
      `${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} rg`,
      `1 0 0 1 ${x} ${y} Tm`,
      `(${safeText}) Tj`,
      'ET'
    );
    y -= spec.gapAfter ?? spec.size + 6;
  }

  const streamContent = `${commands.join('\n')}\n`;

  const encoder = new TextEncoder();
  const streamByteLen = encoder.encode(streamContent).length;

  const objects: string[] = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R /F2 5 0 R /F3 6 0 R >> >> /Contents 7 0 R >>\nendobj\n',
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n',
    '6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>\nendobj\n',
    `7 0 obj\n<< /Length ${streamByteLen} >>\nstream\n${streamContent}endstream\nendobj\n`,
  ];

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];

  for (const obj of objects) {
    offsets.push(encoder.encode(pdf).length);
    pdf += obj;
  }

  const xrefOffset = encoder.encode(pdf).length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i <= objects.length; i += 1) {
    const padded = String(offsets[i]).padStart(10, '0');
    pdf += `${padded} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return encoder.encode(pdf);
}

export function formatPayoutReceiptId(
  payout: Pick<ContractPayout, 'id' | 'sprintId'>
): string {
  const cleanId = payout.id.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 8) || 'TX01';
  const cleanSprint = payout.sprintId.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6) || 'SPR';
  return `VNA-RCP-${cleanId}-${cleanSprint}`;
}

function getRailDisplayLabel(rail: string): string {
  if (rail === 'mobile-money') return 'Mobile Money (M-Pesa / MTN MoMo)';
  if (rail === 'local-bank') return 'Local Bank Transfer';
  if (rail === 'global-wallet') return 'Global Digital Wallet (USD / EUR)';
  if (rail === 'fiscal-host') return 'Fiscal-Host / EOR Disbursement';
  return rail;
}

export function buildComplianceReceiptPdfBytes(params: {
  payout: ContractPayout;
  practitionerName: string;
  hostCountry?: string;
  contractingStructure?: ContractingStructureOption;
}): Uint8Array {
  const { payout, practitionerName, hostCountry = 'Global / Kenya Hub', contractingStructure = 'scoped-remote' } = params;
  const receiptId = formatPayoutReceiptId(payout);
  const settledDate = (payout.updatedAtIso || payout.createdAtIso || new Date().toISOString()).slice(0, 10);

  const lines: PdfLineSpec[] = [
    {
      text: 'VUKA NA AMANA - CROSSING OVER',
      font: 'F2',
      size: 11,
      gapAfter: 16,
      colorRgb: [0.078, 0.424, 0.325],
    },
    {
      text: 'COMPLIANT PAYOUT TRANSACTION RECEIPT',
      font: 'F2',
      size: 16,
      gapAfter: 20,
      colorRgb: [0.09, 0.1, 0.11],
    },
    {
      text: `Receipt Reference: ${receiptId}`,
      font: 'F3',
      size: 10,
      gapAfter: 14,
      colorRgb: [0.34, 0.36, 0.38],
    },
    {
      text: `Settlement Date:   ${settledDate}`,
      font: 'F3',
      size: 10,
      gapAfter: 14,
      colorRgb: [0.34, 0.36, 0.38],
    },
    {
      text: 'Status:            RELEASED & VERIFIED',
      font: 'F3',
      size: 10,
      gapAfter: 24,
      colorRgb: [0.078, 0.424, 0.325],
    },
    { text: 'DISBURSEMENT DETAILS', font: 'F2', size: 11, gapAfter: 16, colorRgb: [0.09, 0.1, 0.11] },
    { text: `Practitioner:      ${practitionerName || 'Skilled Practitioner'}`, font: 'F1', size: 10, gapAfter: 15 },
    { text: `Hiring Partner:    ${payout.partnerOrg}`, font: 'F1', size: 10, gapAfter: 15 },
    ...wrapLine(`Solution Sprint:   ${payout.sprintTitle}`, 76).map((line) => ({
      text: line,
      font: 'F1' as const,
      size: 10,
      gapAfter: 14,
    })),
    {
      text: `Disbursement Rail: ${getRailDisplayLabel(payout.payoutRail)}`,
      font: 'F1',
      size: 10,
      gapAfter: 15,
    },
    {
      text: `Contracting Mode:  ${contractingStructure}`,
      font: 'F1',
      size: 10,
      gapAfter: 15,
    },
    {
      text: `Jurisdiction Hub:  ${hostCountry}`,
      font: 'F1',
      size: 10,
      gapAfter: 20,
    },
    {
      text: `NET SETTLED AMOUNT: $${Number(payout.amountUsd || 0).toLocaleString()} USD`,
      font: 'F2',
      size: 13,
      gapAfter: 24,
      colorRgb: [0.078, 0.424, 0.325],
    },
    { text: 'COMPLIANCE & AUDIT ATTESTATION', font: 'F2', size: 11, gapAfter: 15 },
    ...wrapLine(
      'This milestone payout cleared Work-Ready Vault identity/work-authorization verification, FATF risk-based tiered KYC checks, and ILO Guiding Principles fair-pay standards prior to escrow release.',
      82
    ).map((line) => ({
      text: line,
      font: 'F1' as const,
      size: 9.5,
      gapAfter: 13,
      colorRgb: [0.26, 0.28, 0.31] as [number, number, number],
    })),
    {
      text: '--------------------------------------------------------------------------',
      font: 'F3',
      size: 9,
      gapAfter: 14,
      colorRgb: [0.54, 0.52, 0.48],
    },
    {
      text: 'Issued digitally for Hiring Partner finance, audit, and donor record-keeping.',
      font: 'F1',
      size: 9,
      gapAfter: 12,
      colorRgb: [0.4, 0.42, 0.45],
    },
  ];

  return buildSinglePagePdfFromLines(lines);
}

export function buildPlainTextPdfBytes(params: {
  title: string;
  subtitle: string;
  bodyText: string;
}): Uint8Array {
  const lines: PdfLineSpec[] = [
    {
      text: 'VUKA NA AMANA - CROSSING OVER',
      font: 'F2',
      size: 10.5,
      gapAfter: 15,
      colorRgb: [0.078, 0.424, 0.325],
    },
    ...wrapLine(params.title, 58).map((line) => ({
      text: line,
      font: 'F2' as const,
      size: 14,
      gapAfter: 16,
      colorRgb: [0.09, 0.1, 0.11] as [number, number, number],
    })),
    ...wrapLine(params.subtitle, 80).map((line) => ({
      text: line,
      font: 'F1' as const,
      size: 9.5,
      gapAfter: 14,
      colorRgb: [0.34, 0.36, 0.38] as [number, number, number],
    })),
    {
      text: '--------------------------------------------------------------------------',
      font: 'F3',
      size: 9,
      gapAfter: 14,
      colorRgb: [0.54, 0.52, 0.48],
    },
  ];

  const rawParagraphs = params.bodyText.split('\n');
  for (const para of rawParagraphs) {
    const trimmed = para.trim();
    if (!trimmed) {
      lines.push({ text: ' ', font: 'F1', size: 9, gapAfter: 8 });
      continue;
    }
    const isHeading = /^[0-9]+\.\s+[A-Z]|^[A-Z][A-Z0-9\s\-&/]{5,}$/.test(trimmed);
    const wrapped = wrapLine(trimmed, isHeading ? 74 : 84);
    for (const w of wrapped) {
      lines.push({
        text: w,
        font: isHeading ? 'F2' : 'F1',
        size: isHeading ? 10 : 9.2,
        gapAfter: 12,
        colorRgb: isHeading ? [0.078, 0.424, 0.325] : [0.15, 0.17, 0.19],
      });
    }
  }

  return buildSinglePagePdfFromLines(lines);
}

export interface SdgImpactSummaryPdfInput {
  practitionerName: string;
  ageStage?: string;
  verifiablePassportId?: string;
  generatedAtIso?: string;
  totalVerifiedBuilders: number;
  stageBreakdown: Array<{ stage: string; count: number; sdg: string }>;
  activeSprintsTotal: number;
  userActiveSprints: number;
  userCompletedSprints: number;
  stipendsEarnedUsd: number;
  totalDisbursedStipendsUsd: number;
  escrowPipelineUsd?: number;
  verifiedCapabilitiesCount: number;
  verifiedHoursLogged?: number;
  pulseStory?: string | null;
  sdgMetrics: Array<{
    sdgLabel: string;
    unTargetTag: string;
    title: string;
    primaryValue: string;
    metricCaption: string;
  }>;
}

export function formatSdgImpactReportId(
  practitionerName: string,
  isoDate?: string
): string {
  const datePart = (isoDate || new Date().toISOString()).slice(0, 10).replace(/-/g, '');
  const nameTag =
    normalizePdfAscii(practitionerName)
      .replace(/[^a-zA-Z0-9]/g, '')
      .toUpperCase()
      .slice(0, 6) || 'BUILD';
  return `VNA-SDG-${datePart}-${nameTag}`;
}

export function buildSdgImpactSummaryPdfBytes(
  params: SdgImpactSummaryPdfInput
): Uint8Array {
  const issuedIso = params.generatedAtIso || new Date().toISOString();
  const issuedDate = issuedIso.slice(0, 10);
  const reportId = formatSdgImpactReportId(params.practitionerName, issuedIso);
  const stageLine = params.stageBreakdown
    .map((s) => `${s.stage}: ${s.count.toLocaleString()} (${s.sdg})`)
    .join(' | ');

  const lines: PdfLineSpec[] = [
    {
      text: 'VUKA NA AMANA - CROSSING OVER',
      font: 'F2',
      size: 10.5,
      gapAfter: 15,
      colorRgb: [0.078, 0.424, 0.325],
    },
    {
      text: 'SDG IMPACT SUMMARY REPORT',
      font: 'F2',
      size: 16,
      gapAfter: 18,
      colorRgb: [0.09, 0.1, 0.11],
    },
    {
      text: `Report Reference: ${reportId}   |   Issued: ${issuedDate}`,
      font: 'F3',
      size: 9.2,
      gapAfter: 13,
      colorRgb: [0.34, 0.36, 0.38],
    },
    {
      text: `Practitioner: ${params.practitionerName || 'Skilled Builder'}${
        params.ageStage ? `  |  Track: ${params.ageStage}` : ''
      }${params.verifiablePassportId ? `  |  Passport: ${params.verifiablePassportId}` : ''}`,
      font: 'F1',
      size: 9.5,
      gapAfter: 15,
      colorRgb: [0.22, 0.24, 0.27],
    },
    {
      text: '--------------------------------------------------------------------------',
      font: 'F3',
      size: 9,
      gapAfter: 14,
      colorRgb: [0.54, 0.52, 0.48],
    },
    {
      text: '1. HEADLINE PLATFORM & BUILDER IMPACT METRICS',
      font: 'F2',
      size: 10.5,
      gapAfter: 15,
      colorRgb: [0.078, 0.424, 0.325],
    },
    {
      text: `Total Verified Builders (5 Crossing Stages): ${params.totalVerifiedBuilders.toLocaleString()}`,
      font: 'F2',
      size: 11,
      gapAfter: 14,
      colorRgb: [0.09, 0.1, 0.11],
    },
    {
      text: `Stipends Earned (Builder): $${Math.max(0, Math.round(params.stipendsEarnedUsd)).toLocaleString()} USD`,
      font: 'F2',
      size: 11,
      gapAfter: 14,
      colorRgb: [0.769, 0.384, 0.176],
    },
    {
      text: `Total Disbursed Stipends (Platform): $${Math.max(0, Math.round(params.totalDisbursedStipendsUsd)).toLocaleString()} USD${
        typeof params.escrowPipelineUsd === 'number'
          ? `  |  Active Escrow: $${Math.max(0, Math.round(params.escrowPipelineUsd)).toLocaleString()} USD`
          : ''
      }`,
      font: 'F1',
      size: 9.8,
      gapAfter: 14,
      colorRgb: [0.15, 0.17, 0.19],
    },
    {
      text: `Active Solution Sprints: ${params.activeSprintsTotal}  |  Your Active: ${params.userActiveSprints}  |  Completed: ${params.userCompletedSprints}`,
      font: 'F1',
      size: 9.8,
      gapAfter: 13,
      colorRgb: [0.15, 0.17, 0.19],
    },
    {
      text: `Verified Capabilities: ${params.verifiedCapabilitiesCount}${
        typeof params.verifiedHoursLogged === 'number'
          ? `  |  Verified Hours Logged: ${params.verifiedHoursLogged}h`
          : ''
      }`,
      font: 'F1',
      size: 9.8,
      gapAfter: 14,
      colorRgb: [0.15, 0.17, 0.19],
    },
    ...wrapLine(`5-Stage Pipeline: ${stageLine}`, 84).map((line) => ({
      text: line,
      font: 'F3' as const,
      size: 8.5,
      gapAfter: 12,
      colorRgb: [0.32, 0.34, 0.37] as [number, number, number],
    })),
    {
      text: ' ',
      font: 'F1',
      size: 8,
      gapAfter: 8,
    },
    {
      text: '2. UN 2030 AGENDA SDG TARGET BREAKDOWN',
      font: 'F2',
      size: 10.5,
      gapAfter: 14,
      colorRgb: [0.078, 0.424, 0.325],
    },
  ];

  for (const metric of params.sdgMetrics) {
    lines.push({
      text: `${metric.sdgLabel} (${metric.unTargetTag}) - ${metric.primaryValue}`,
      font: 'F2',
      size: 9.5,
      gapAfter: 11.5,
      colorRgb: [0.09, 0.1, 0.11],
    });
    for (const wrapped of wrapLine(`${metric.title}: ${metric.metricCaption}`, 86)) {
      lines.push({
        text: wrapped,
        font: 'F1',
        size: 8.8,
        x: 62,
        gapAfter: 11,
        colorRgb: [0.3, 0.32, 0.36],
      });
    }
  }

  if (params.pulseStory && params.pulseStory.trim()) {
    lines.push(
      { text: ' ', font: 'F1', size: 8, gapAfter: 6 },
      {
        text: '3. LIVE IMPACT NARRATIVE',
        font: 'F2',
        size: 10.5,
        gapAfter: 13,
        colorRgb: [0.078, 0.424, 0.325],
      },
      ...wrapLine(params.pulseStory, 86).map((line) => ({
        text: line,
        font: 'F1' as const,
        size: 9.2,
        gapAfter: 12,
        colorRgb: [0.16, 0.18, 0.21] as [number, number, number],
      }))
    );
  }

  lines.push(
    {
      text: '--------------------------------------------------------------------------',
      font: 'F3',
      size: 9,
      gapAfter: 12,
      colorRgb: [0.54, 0.52, 0.48],
    },
    ...wrapLine(
      'Aligned with UN 2030 Agenda, UNESCO Qualifications Passport (UQP), and ILO PROSPECTS. Zero raw identity numbers or medical disclosures are included in this summary.',
      88
    ).map((line) => ({
      text: line,
      font: 'F1' as const,
      size: 8.5,
      gapAfter: 11,
      colorRgb: [0.4, 0.42, 0.45] as [number, number, number],
    }))
  );

  return buildSinglePagePdfFromLines(lines);
}

export function exportSdgImpactSummaryPdf(params: SdgImpactSummaryPdfInput): {
  filename: string;
  reportId: string;
  byteLength: number;
} {
  const issuedIso = params.generatedAtIso || new Date().toISOString();
  const reportId = formatSdgImpactReportId(params.practitionerName, issuedIso);
  const filename = `vuka-na-amana-sdg-impact-summary-${issuedIso.slice(0, 10)}.pdf`;
  const bytes = buildSdgImpactSummaryPdfBytes({
    ...params,
    generatedAtIso: issuedIso,
  });
  downloadPdfBlob(bytes, filename);
  return { filename, reportId, byteLength: bytes.byteLength };
}

export interface SprintSummaryReportPdfInput {
  practitionerName?: string;
  briefId: string;
  briefTitle: string;
  partnerOrg: string;
  domain: string;
  status: 'completed' | 'in-progress';
  hoursLogged: number;
  completedMilestones: string[];
  totalMilestones: number;
  journeyStageLabel: string;
  solutionNotes: string;
  assignedMentorName: string;
  assignedMentorRole: string;
  feedbackEntries: Array<{
    reviewerName: string;
    reviewerRole: string;
    rating: number;
    reviewText: string;
  }>;
  mentorThreadNotes?: Array<{
    author: string;
    body: string;
  }>;
  grossStipendUsd: number;
  platformFeeUsd: number;
  netDisbursedUsd: number;
  effectiveHourlyRateUsd: number;
  payoutStatusLabel: string;
  payoutRailLabel: string;
  receiptReference: string | null;
  updatedAtIso?: string;
}

export function formatSprintReportId(briefId: string, issuedIso: string): string {
  const cleanBrief =
    briefId.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 8) || 'SPRINT';
  const dateCompact = issuedIso.slice(0, 10).replace(/-/g, '') || '20261125';
  return `VNA-SPR-${cleanBrief}-${dateCompact}`;
}

export function buildSprintReportPdfBytes(
  params: SprintSummaryReportPdfInput
): Uint8Array {
  const issuedIso = params.updatedAtIso || new Date().toISOString();
  const reportId = formatSprintReportId(params.briefId, issuedIso);
  const statusLabel =
    params.status === 'completed' ? 'COMPLETED & VERIFIED' : 'IN PROGRESS';

  const lines: PdfLineSpec[] = [
    {
      text: 'VUKA NA AMANA - CROSSING OVER',
      font: 'F2',
      size: 10.5,
      gapAfter: 14,
      colorRgb: [0.078, 0.424, 0.325],
    },
    {
      text: 'SPRINT OUTCOME, MENTOR FEEDBACK & PAYOUT REPORT',
      font: 'F2',
      size: 15,
      gapAfter: 16,
      colorRgb: [0.09, 0.1, 0.11],
    },
    {
      text: `Report ID: ${reportId}  |  Date: ${issuedIso.slice(0, 10)}  |  Status: ${statusLabel}`,
      font: 'F3',
      size: 9,
      gapAfter: 12,
      colorRgb: [0.34, 0.36, 0.38],
    },
    {
      text: `Practitioner: ${params.practitionerName || 'Skilled Practitioner'}  |  Partner: ${params.partnerOrg}`,
      font: 'F1',
      size: 9.5,
      gapAfter: 12,
      colorRgb: [0.22, 0.24, 0.27],
    },
    ...wrapLine(`Sprint: ${params.briefTitle} (${params.domain})`, 78).map((line) => ({
      text: line,
      font: 'F2' as const,
      size: 10,
      gapAfter: 13,
      colorRgb: [0.09, 0.1, 0.11] as [number, number, number],
    })),
    {
      text: '--------------------------------------------------------------------------',
      font: 'F3',
      size: 9,
      gapAfter: 13,
      colorRgb: [0.54, 0.52, 0.48],
    },
    {
      text: '1. SPRINT OUTCOMES & MILESTONE JOURNEY',
      font: 'F2',
      size: 10.5,
      gapAfter: 13,
      colorRgb: [0.078, 0.424, 0.325],
    },
    {
      text: `Current Journey Stage: ${params.journeyStageLabel}`,
      font: 'F1',
      size: 9.5,
      gapAfter: 12,
    },
    {
      text: `Milestones Delivered (${params.completedMilestones.length}/${params.totalMilestones}): ${
        params.completedMilestones.length > 0
          ? params.completedMilestones.join(', ')
          : 'In initial scoping'
      }`,
      font: 'F1',
      size: 9.5,
      gapAfter: 12,
    },
    {
      text: `Effort Logged: ${params.hoursLogged} hours`,
      font: 'F1',
      size: 9.5,
      gapAfter: 12,
    },
    ...wrapLine(`Solution Summary: ${params.solutionNotes}`, 84).map((line) => ({
      text: line,
      font: 'F1' as const,
      size: 9.2,
      gapAfter: 11.5,
      colorRgb: [0.24, 0.26, 0.29] as [number, number, number],
    })),
    { text: ' ', font: 'F1', size: 6, gapAfter: 6 },
    {
      text: '2. MENTOR & PARTNER FEEDBACK',
      font: 'F2',
      size: 10.5,
      gapAfter: 13,
      colorRgb: [0.078, 0.424, 0.325],
    },
    {
      text: `Assigned Pod Mentor: ${params.assignedMentorName} (${params.assignedMentorRole})`,
      font: 'F1',
      size: 9.5,
      gapAfter: 12,
    },
  ];

  if (params.feedbackEntries.length > 0) {
    for (const fb of params.feedbackEntries.slice(0, 2)) {
      lines.push({
        text: `Review (${fb.rating}/5) - ${fb.reviewerName} (${fb.reviewerRole}):`,
        font: 'F2',
        size: 9.2,
        x: 56,
        gapAfter: 11,
      });
      for (const wrapped of wrapLine(`"${fb.reviewText}"`, 82)) {
        lines.push({
          text: wrapped,
          font: 'F1',
          size: 9,
          x: 62,
          gapAfter: 11,
          colorRgb: [0.26, 0.28, 0.31],
        });
      }
    }
  } else {
    lines.push({
      text: 'Partner review pending or not yet submitted in Pulse.',
      font: 'F1',
      size: 9,
      x: 56,
      gapAfter: 12,
      colorRgb: [0.36, 0.38, 0.41],
    });
  }

  if (params.mentorThreadNotes && params.mentorThreadNotes.length > 0) {
    for (const note of params.mentorThreadNotes.slice(-2)) {
      for (const wrapped of wrapLine(`${note.author}: ${note.body}`, 82)) {
        lines.push({
          text: wrapped,
          font: 'F1',
          size: 8.8,
          x: 58,
          gapAfter: 10.5,
          colorRgb: [0.32, 0.34, 0.37],
        });
      }
    }
  }

  lines.push(
    { text: ' ', font: 'F1', size: 6, gapAfter: 6 },
    {
      text: '3. FINAL PAYOUT BREAKDOWN',
      font: 'F2',
      size: 10.5,
      gapAfter: 13,
      colorRgb: [0.078, 0.424, 0.325],
    },
    {
      text: `Gross Milestone Stipend: $${params.grossStipendUsd.toLocaleString()} USD`,
      font: 'F1',
      size: 9.5,
      gapAfter: 12,
    },
    {
      text: `Platform / Broker Fee:   $${params.platformFeeUsd.toLocaleString()} USD (Zero-Deduction Guarantee)`,
      font: 'F1',
      size: 9.5,
      gapAfter: 12,
    },
    {
      text: `FINAL NET PAYOUT:        $${params.netDisbursedUsd.toLocaleString()} USD ($${params.effectiveHourlyRateUsd.toLocaleString()}/h effective)`,
      font: 'F2',
      size: 11,
      gapAfter: 13,
      colorRgb: [0.078, 0.424, 0.325],
    },
    {
      text: `Settlement Status:       ${params.payoutStatusLabel} via ${params.payoutRailLabel}`,
      font: 'F1',
      size: 9.5,
      gapAfter: 12,
    },
    ...(params.receiptReference
      ? [
          {
            text: `Compliance Receipt ID:   ${params.receiptReference}`,
            font: 'F3' as const,
            size: 9.2,
            gapAfter: 14,
            colorRgb: [0.22, 0.24, 0.27] as [number, number, number],
          },
        ]
      : []),
    {
      text: '--------------------------------------------------------------------------',
      font: 'F3',
      size: 9,
      gapAfter: 12,
      colorRgb: [0.54, 0.52, 0.48],
    },
    ...wrapLine(
      'Issued digitally for practitioner income records, portable work verification, and partner audit archiving.',
      86
    ).map((line) => ({
      text: line,
      font: 'F1' as const,
      size: 8.5,
      gapAfter: 11,
      colorRgb: [0.4, 0.42, 0.45] as [number, number, number],
    }))
  );

  return buildSinglePagePdfFromLines(lines);
}

export function exportSprintReportPdf(params: SprintSummaryReportPdfInput): {
  filename: string;
  reportId: string;
  byteLength: number;
} {
  const issuedIso = params.updatedAtIso || new Date().toISOString();
  const reportId = formatSprintReportId(params.briefId, issuedIso);
  const slug =
    params.briefTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 36) || 'sprint';
  const filename = `vuka-sprint-report-${slug}-${issuedIso.slice(0, 10)}.pdf`;
  const bytes = buildSprintReportPdfBytes({ ...params, updatedAtIso: issuedIso });
  downloadPdfBlob(bytes, filename);
  return { filename, reportId, byteLength: bytes.byteLength };
}

export function downloadPdfBlob(bytes: Uint8Array, filename: string): void {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  const blob = new Blob([copy.buffer], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
