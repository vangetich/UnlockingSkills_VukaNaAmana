# Build History — Vuka na Amana: Crossing Over

**Encourage the dream. Acknowledge the skill. Attain the work.**  
*Turning sidelined talent into active impact.*

This document logs the chronological development milestones, major prompt implementations, architectural decisions, and feature additions across the evolution of **Vuka na Amana — Crossing Over**.

---

## Milestone 1 — Visual Foundation, Brand Identity & 4-Tab Talent Studio
- **Editorial Design System**:
  - Established the Warm Alabaster Paper canvas (`#FAF8F5`), Deep Charcoal Ink (`#17191C`), Amana Emerald (`#146C53` — verification, trust, and legal clearance), and Vuka Terracotta (`#C4622D` — warm human momentum), paired with `Fraunces` editorial serif headings, `Plus Jakarta Sans` UI copy, and `JetBrains Mono` tabular figures.
  - Designed 5% opacity inline SVG resilience background motifs (`WovenBridgeArcsMotif`, `TopographicAscentMotif`, `RippleConstellationMotif` in `src/components/ResilienceMotifs.tsx`) and embedded the official `public/bridge.jpeg` emblem across the Landing Funnel and Top Navigation bar.
- **Multilingual, Voice-First & RTL Support**:
  - Implemented 4-locale internationalization (`en`, `sw`, `es`, `ar` with automatic `dir="rtl"` switching in `src/utils/i18n.ts`) and Web Speech API voice-to-text dictation (`src/hooks/useSpeechInput.ts`, `src/components/VoiceField.tsx`, `src/components/VoiceRecorder.tsx`).
- **Zero-Gate Landing Funnel to Studio Handoff**:
  - Built `src/components/LandingFunnel.tsx` so a practitioner's selected age track (`15–17`, `18–29`, `30–45`, `46+`) and problem statement carry directly into Tab 1 (`[Verify]`) without a bureaucratic account wall or mandatory CV upload.

---

## Milestone 2 — Tab 1 (`[Verify]`): Adaptive 3-Path Credential Verification & Living Competency Passport
- **Adaptive 3-Path Verification Router (`src/components/VerifyView.tsx`)**:
  - Grounded in **WES Gateway / ENIC-NARIC** (partial foreign credentials), **UNESCO Qualifications Passport (UQP)** (paperless structured competency defense), and **ILO / KNQA Recognition of Prior Learning (RPL)** (hands-on practical portfolios).
- **4-Tier Trust Ladder & Living Competency Passport**:
  - Implemented capability progression (`pending` -> `field-verified` -> `master-endorsed`), peer endorsement request/verification flows (`src/components/PeerEndorsementPanel.tsx`), and partner fee-waiver/stipend activation.
- **Offline QR Code Export & Read-Only External Sharing**:
  - Built `src/components/PassportPreviewModal.tsx` (using `qrcode`) and `src/components/SharedPassportView.tsx` to generate a unique, scannable QR code and read-only URL token (`?passport=...`) for offline and external employer verification.
- **Global Command Palette (`Cmd+K` / `Ctrl+K`)**:
  - Built `src/components/CommandPalette.tsx` for instant keyboard navigation across the 4 tabs, voice dictation triggers, passport sharing, and platform guide/FAQ search.

---

## Milestone 3 — Tab 2 (`[Unlock]`): Compliance Readiness: Crossing Over Access
- **Module 1 — Work-Authorization Crossing Card (`src/components/ComplianceCrossingSection.tsx`)**:
  - Grounded in the **ILO Guiding Principles on the Access of Refugees and Other Forcibly Displaced Persons to the Labour Market**, classifying host jurisdictions into `Enabling`, `Mixed — Friction Guided`, or `Restricted — Remote/EOR Route Active` with plain-language steps strictly under 15 words.
- **Module 2 — Financial & Payout Rail Readiness**:
  - Grounded in **UNHCR Financial Inclusion** findings and **FATF Risk-Based Tiered KYC** standards, mapping identity document tiers to Mobile Money (M-Pesa, MTN, Airtel), Humanitarian Aid Cards, Local Bank/SACCO accounts, and Partner EOR Fiscal Hosts.
- **1+1=3 Employer Liability Shield (`Hiring Partner Compliance View`)**:
  - Built the dual-view segmented toggle (`[Skilled Worker View]` vs. `[Hiring Partner Compliance View]`), the **Zero-Friction Onboarding Dossier**, 1-click **1-Page Sprint & Compliance Agreement** generator (`src/components/SprintAgreementModal.tsx`, `src/components/OnboardingPackModal.tsx`), **Contribution Payout Health** status lifecycle pills (`Escrow Held` -> `Processing` -> `Released` in `src/components/PayoutStatusCard.tsx`), **Payout Transaction Ledger** with deterministic PDF receipt downloads (`src/components/PayoutTransactionLedger.tsx`), and the step-by-step **Compliance Guided Tour** (`src/components/ComplianceGuidedTour.tsx`).

---

## Milestone 4 — Tab 3 (`[Solve]`): Living Proof Portfolio, Matched Work & Demand-First Upskilling Bridge
- **Module 1 — Living Proof Portfolio & Market Readiness (`src/components/LivingProofPortfolioSection.tsx`)**:
  - Built relatable skill track selectors (`Trades, Solar & Repair`, `Craft, Tailoring & Creative`, `Business, Finance & Ops`, `Community Health & Education`, `Software, Data & Remote Tech`), client-side HTML5 `<canvas>` JPEG image compression for 1–3 work-sample photos, 30-second voice walkthrough capture, and Gemini Vision analysis (`/api/solve/proof-portfolio` and `/api/portfolio/analyze`) scoring both Local Hands-On and Remote Digital readiness.
- **Module 2 — Matched Work & Cross-Age Solution Flows (`src/components/MatchedWorkSection.tsx`)**:
  - Connected uploaded Living Proof portfolios and cleared compliance badges to real Local and Remote opportunities, with automatic **Cross-Age Pod Matching** pairing `15–29` Emerging/Rising Builders with `30–46+` Specialist Leads and Master Advisors across refugee and host communities.
- **Demand-First Job-to-Fit Upskilling Bridge (65%–90% Fit)**:
  - Grounded in **UNESCO UQP** and **ILO RPL** (`/api/solve/upskilling-bridge`), presenting candidates at 65%–90% fit with a calm **"Close the Final Gap"** drawer showing 2 strengths already proven, 1 concrete missing bridge skill, and a choice between a 3–7 day fee-waived TVET/RPL micro-bridge or a paid ILO Upgraded Apprenticeship Pod.
- **Interactive Sprint Milestones & Pod Mentorship Messaging**:
  - Added the 3-stage interactive milestone bar (`Analysis Complete`, `Draft Ready`, `Final Submission` in `src/components/SprintMilestoneProgressBar.tsx`) and real-time Senior Specialist mentor availability + messaging drawer (`src/contexts/MessagingContext.tsx`, `src/components/MentorMessagingDrawer.tsx`).

---

## Milestone 5 — Tab 4 (`[Pulse]`): UN 2030 Agenda SDG & Community Impact Pulse
- **5 Reactive UN 2030 SDG Pulse Cards (`src/components/PulseView.tsx`)**:
  - Mapped live workspace actions from Tabs 1–3 to **SDG 4** (Targets 4.4 & 4.5), **SDG 8** (Targets 8.5, 8.8 & 8.10), **SDG 10** (Targets 10.2 & 10.7), **SDG 16** (Targets 16.6 & 16.9), and **SDG 17** (Target 17.17).
- **Executive Telemetry & Feedback Loops**:
  - Added the 4-stage **Knowledge-to-Work Flow** conversion funnel, **Age & Cohesion Breakdown** strip, **Sprint Performance** sparkline widget (`src/components/SprintPerformanceWidget.tsx`), **Hiring Partner Sprint Feedback** star ratings and reviews (`src/components/SprintFeedbackPanel.tsx`), **48-Hour Sprint Due Alert** badge, Framer Motion emerald celebration banner, **AI Pulse Story** card (`/api/pulse/story`), and **Community Impact** practitioner gallery.

---

## Milestone 6 — Principal Backend Architecture, Partner Scale Engine, Bidirectional Funnel & Offline PWA/Email Sync
- **Modular Server-Side Layer & Partner Scale Engine (`server.ts`, `src/utils/serverArchitecture.ts`, `src/components/PartnerScaleDrawer.tsx`)**:
  - Implemented HMAC-SHA256 Server-Signed Living Competency Passports (`/api/verify/passport`, `VNA-2026-XXXX-XXXX`), 24-hour SHA-256 Deterministic Compliance Hash Caching (`/api/compliance/route`, `<30ms` cache hits), 8-Second Vision Circuit Breaker (`/api/portfolio/analyze`), Token-Bucket Rate Limiter, Refugee Data Protection Guard (`VNA-CONSENT-XXXX`, Zero-Raw-ID enforcement), Multi-Tenant Cohort Provisioner (`POST /api/cohorts/provision`), Append-Only SDG Telemetry Ledger (`GET /api/pulse/telemetry`, `POST /api/pulse/events`), and Live System Health & Trust Strip (`GET /api/health`).
- **Sovereign Email Data Vault & Dedicated PWA Offline Sync (`src/components/AccountSyncModal.tsx`, `src/components/PwaOfflineSyncButton.tsx`)**:
  - Paired Firebase Auth/Firestore (`src/lib/firebase.ts`) with a Zero-Raw-ID Sovereign Email Data Vault (`POST /api/sync/email-vault`, `GET /api/sync/email-vault`) supporting Gmail, Outlook/Hotmail, Yahoo, Proton, and NGO emails, alongside a dedicated **PWA Offline Ready / Sync** header button.
- **Bidirectional Toggleable `'Up/Down'` Funnel Arrows & Collapsible FAQs**:
  - Enhanced the Top, Middle, and Bottom arrow units in `src/components/LandingFunnel.tsx` with toggleable `'Up/Down'` directional motion, and added the collapsible **FAQs & Platform Guide** accordion (`src/components/FaqsAndPlatformGuide.tsx`) to both `UnlockView.tsx` (`[Unlock]`) and `SolveView.tsx` (`[Solve]`).

---

## Milestone 7 — Cloud Run Production Deployment & Executive Documentation
- **Production Node 22 Native TypeScript ESM Hardening (`server.ts`)**:
  - Updated relative server imports to include explicit `.ts` extensions (`./src/utils/serverArchitecture.ts`) and isolated `vite` middleware loading to development mode via dynamic `await import('vite')`, ensuring zero-downtime `NODE_ENV=production node server.ts` execution on Cloud Run.
- **Executive Documentation (`README.md` & `BuildHistory.md`)**:
  - Documented the 5-benchmark alignment table, Mermaid `flowchart LR` architecture diagram, privacy/security safeguards, unit test suite, and 90-second judge walkthrough.

---

## Milestone 8 — Tab 1 (`[Verify]`) Adaptive Credential & Skills Verification Engine Upgrade
- **Step 1 — Adaptive 3-Route Verification Router (`src/components/VerifyView.tsx`, `src/utils/talentEngine.ts`)**:
  - Added 3 progressive, dignified verification routes pre-highlighted by the practitioner's Landing Funnel Age Stage (`getRecommendedVerifyRoute(ageStage)`):
    1. **Route A (`Foreign Qualification or Partial Copy` — WES Gateway / ENIC-NARIC Track)** with a 1-click *"Try Sample: Foreign Civil Engineering Transcript"* preset (`FOREIGN_CIVIL_TRANSCRIPT_SAMPLE`), document upload, and NQF Level 6 equivalency mapping.
    2. **Route B (`Missing or Lost Paperwork` — UNESCO UQP Structured Track)** with a concise 3-part guided reconstruction flow (Background Reconstruction, 2-Part Technical/Oral Defense with Voice-Note dictation, and Alternative Context Notes).
    3. **Route C (`Hands-On / Informal Craft` — ILO & KNQA RPL Portfolio Track)** with a lightweight RPL Portfolio of Evidence (1 work photo upload/preset, 30-second *"How I built/fixed this"* walkthrough, and optional mentor/client vouch).
- **Step 2 — Upgraded Server-Signed Living Competency Passport (`POST /api/verify/passport` in `server.ts`)**:
  - Displays the **Verified Competency Map** (core technical + workplace skills, language proficiency, reconstructed credential summary, and **NQF / RPL Equivalency Level**), the **Transparent 4-Tier Trust Indicator** (`[1. AI-Evaluated] -> [2. Peer-Master Verified] -> [3. Paid Sprint Proven] -> [4. Accredited RPL / QAB Certified]`), an honest **UNESCO-aligned transparency note**, and a verifiable Passport ID (`VNA-2026-8412` / HMAC-signed ID) with 1-click **Share / Export Passport** preview.
- **Step 3 — Recognized Bridging, Re-Certification & Stipend Enablement Card**:
  - Identifies the exact 1–2 recognized bridging modules or RPL assessments, estimated assessment cost (`$55–$75 USD`), and an interactive **"Request Partner Fee-Waiver / Exam Stipend →"** trigger that flips to an Amana Emerald **"Stipend Pre-Approved via Partner Pool"** badge and automatically increments **SDG 4** in Tab 4 (`[Pulse]`).

---

## Milestone 9 — 5-Step Studio Navigation Expansion & Tab 5 (`[Cleared]` — Cleared for Your Future)
- **Balanced 5-Step Studio Navigation (`src/components/TopNav.tsx`, `src/types/kora.ts`)**:
  - Expanded the Main Studio navigation from 4 to 5 tabs: `[1. Verify] [2. Unlock] [3. Solve] [4. Pulse] [5. Cleared]`, with responsive desktop header and mobile bottom thumb-zone grid support.
- **Tab 5 (`[Cleared]` — Cleared for Your Future) (`src/components/ClearedView.tsx`, `src/components/ResilienceMotifs.tsx`)**:
  - Fulfills the Landing Funnel promise (*"Seen for your skill. Cleared for your future."*), shifting the user's mindset from immediate survival work to durable, long-term destiny.
  - **Open Horizon & Ascending Dawn Arc Motif**: Custom 5% opacity inline SVG background motif with rising horizon arcs and a faint compass star.
  - **Module 1 — Personal "Future-Readiness Bridge" Summary Strip**: Auto-hydrated from Tabs 1–3, showing 3 status pills (`[Portable Skill Proof]`, `[Cleared Legal/Payout Rail]`, `[Track Record Built]`) and an interactive **4-Track Horizon Selector** (Build Roots Here, Relocate Through Skill, Advance Through Study, Lead & Multiply) pre-recommended by Age Stage.
  - **Module 2 — Tailored Intelligence & Action Plan**: Displays actionable checklists, institutional frameworks (ILO PROSPECTS, WES Gateway, UNESCO UQP), and 1-click dossier export triggers.

---

## Milestone 10 — Tab 5 Module 3 (3-Year Cleared Horizon Roadmap), Telemetry Sync & Landing Funnel Preview
- **Tab 5 Module 3 — "Your 3-Year Cleared Horizon Roadmap" (`src/components/ClearedView.tsx`)**:
  - **1+1=3 Mechanic (Short-Term Sprints -> Lifetime Mobility)**: Interactive milestone-based 3-horizon timeline personalized to the user's Age Stage, Living Competency Passport, Compliance Tier, and Work Track:
    1. **Horizon 1 — Next 90 Days (Stabilize)**: Complete 2 paid Cross-Age Sprints, lock Tier 2/3 KYC payout rail, and build verified savings & proof-of-work buffer.
    2. **Horizon 2 — 6 to 18 Months (Upgrade Status)**: Complete targeted TVET/RPL bridging (via partner fee-waiver/stipend), advance to Tier 4 Accredited status, or submit vetted Labour Mobility / Education Pathway application with trusted partner referral.
    3. **Horizon 3 — 2 to 3 Years (Thrive & Give Back)**: Attain durable residency, skilled third-country placement, or registered enterprise growth—and graduate into a paid Peer Assessor / Master Mentor inside Vuka na Amana.
  - **Interactive Deliverables & Telemetry Sync**:
    - **Interactive Milestone Checkboxes**: Checking or committing to horizon steps updates an Amana Emerald progress arc ("Horizon Momentum") and automatically logs durable-outcome events into Tab 4 (`[Pulse]`) across SDGs 4, 8, 10, 16, and 17.
    - **One-Click "Export My Cleared Future Dossier" Preview**: Unites Tab 1 Passport, Tab 2 Compliance status, Tab 3 Living Proof highlights, and Tab 5 3-Year Durable Roadmap into a clean printable/copyable executive summary.
- **Landing Funnel Hero Preview Link**: Added a quiet secondary button ("Preview Where This Leads →") on the Landing Funnel hero linking smoothly to Tab 5 (`[Cleared]`) so judges immediately see how the landing promise pays off end-to-end.


