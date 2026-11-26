import type { AgeStage, LocaleCode } from '../types/kora';

export interface LocaleOption {
  code: LocaleCode;
  shortCode: string;
  nativeLabel: string;
  speechLang: string;
  dir: 'ltr' | 'rtl';
}

export const LOCALE_OPTIONS: LocaleOption[] = [
  { code: 'en', shortCode: 'EN', nativeLabel: 'English', speechLang: 'en-US', dir: 'ltr' },
  { code: 'sw', shortCode: 'SW', nativeLabel: 'Kiswahili', speechLang: 'sw-KE', dir: 'ltr' },
  { code: 'fr', shortCode: 'FR', nativeLabel: 'Français', speechLang: 'fr-FR', dir: 'ltr' },
  { code: 'ar', shortCode: 'AR', nativeLabel: 'العربية', speechLang: 'ar-SA', dir: 'rtl' },
];

export interface TranslationDictionary {
  brandName: string;
  brandSubtitle: string;
  backToHome: string;
  navHiringPartners: string;
  navEnterStudio: string;
  navVerify: string;
  navUnlock: string;
  navSolve: string;
  navPulse: string;
  signInGoogle: string;
  signOut: string;
  syncedAccount: string;
  guestLocalMode: string;
  heroEyebrow: string;
  heroHeadline: string;
  heroQuestion: string;
  heroSubcopy: string;
  problemInputLabel: string;
  problemInputPlaceholder: string;
  nameInputLabel: string;
  nameInputPlaceholder: string;
  stageSelectorLabel: string;
  stage15Title: string;
  stage15Desc: string;
  stage18Title: string;
  stage18Desc: string;
  stage30Title: string;
  stage30Desc: string;
  stage46Title: string;
  stage46Desc: string;
  beginCrossingCta: string;
  enterWorkspaceCta: string;
  continueWithGoogleCta: string;
  pillarSectionHeading: string;
  pillarSectionSubcopy: string;
  pillar1Title: string;
  pillar1Sdg: string;
  pillar1Body: string;
  pillar2Title: string;
  pillar2Sdg: string;
  pillar2Body: string;
  pillar3Title: string;
  pillar3Sdg: string;
  pillar3Body: string;
  ageVersatilityHeading: string;
  ageVersatilitySubcopy: string;
  closingHeading: string;
  closingBody: string;
  voiceStartLabel: string;
  voiceStopLabel: string;
  voiceListeningLabel: string;
  voiceUnsupportedNote: string;
  themeLight: string;
  themeDark: string;
  offlineBanner: string;
  onlineReady: string;
  queuedUpdatesSuffix: string;
  syncNow: string;
  installApp: string;
  installIos: string;
  verifyHeading: string;
  verifyLead: string;
  editFocusButton: string;
  saveFocusButton: string;
  cancelLabel: string;
  addCapabilityHeading: string;
  capabilityTitleLabel: string;
  capabilityTitlePlaceholder: string;
  capabilityDomainLabel: string;
  capabilityProofLabel: string;
  capabilityProofPlaceholder: string;
  addCapabilityCta: string;
  verifyStepCta: string;
  endorseStepCta: string;
  statusPending: string;
  statusFieldVerified: string;
  statusMasterEndorsed: string;
  unlockHeading: string;
  unlockLead: string;
  searchBriefsLabel: string;
  searchBriefsPlaceholder: string;
  filterAllDomains: string;
  matchSuffix: string;
  acceptBriefCta: string;
  acceptedBriefLabel: string;
  openInSolveCta: string;
  deliverablesHeading: string;
  solveHeading: string;
  solveLead: string;
  solveEmptyTitle: string;
  solveEmptyBody: string;
  browseBriefsCta: string;
  solutionNotesLabel: string;
  solutionNotesPlaceholder: string;
  hoursLoggedLabel: string;
  saveDraftCta: string;
  submitSolutionCta: string;
  completedBadge: string;
  inProgressBadge: string;
  pulseHeading: string;
  pulseLead: string;
  kpiVerifiedSkills: string;
  kpiPaidEarned: string;
  kpiHoursApplied: string;
  kpiActiveDomains: string;
  skillGrowthHeading: string;
  skillGrowthSubcopy: string;
  verifiedLabel: string;
  completedBriefsLabel: string;
  ledgerHeading: string;
  filterAllStatus: string;
  exportCsvCta: string;
  ledgerColBrief: string;
  ledgerColDomain: string;
  ledgerColStatus: string;
  ledgerColHours: string;
  ledgerColPayout: string;
  ledgerEmpty: string;
  syncCardHeading: string;
  syncCardBody: string;
  accountLabel: string;
  offlineQueueLabel: string;
  pendingSuffix: string;
  lastSyncedLabel: string;
  notSyncedYet: string;
  validationProblemRequired: string;
  validationCapabilityRequired: string;
  validationSolutionMinLength: string;
}

const EN: TranslationDictionary = {
  brandName: 'Vuka na Amana',
  brandSubtitle: 'Cross Over with Trust',
  backToHome: 'Back to Home',
  navHiringPartners: 'For Hiring Partners',
  navEnterStudio: 'Enter Studio',
  navVerify: '1. Verify',
  navUnlock: '2. Unlock',
  navSolve: '3. Solve',
  navPulse: '4. Pulse',
  signInGoogle: 'Sync with Google',
  signOut: 'Sign Out',
  syncedAccount: 'Cloud Synced',
  guestLocalMode: 'Local Offline Vault',
  heroEyebrow: 'ENCOURAGE · ACKNOWLEDGE · ATTAIN',
  heroHeadline: 'Seen for your skill. Cleared for your future.',
  heroQuestion: 'What real-world problems do you know how to solve?',
  heroSubcopy:
    'Vuka na Amana transforms displaced craft, technical judgment, and field mastery into verified, compliance-cleared paid work—without waiting on paper diplomas.',
  problemInputLabel: 'What real-world problems do you know how to solve?',
  problemInputPlaceholder:
    'e.g., 48V solar inverter diagnostics, cold-chain vaccine logistics, cooperative cash-flow ledgers, or offline sync APIs...',
  nameInputLabel: 'Preferred name or practitioner handle',
  nameInputPlaceholder: 'e.g., Amina Ochieng',
  stageSelectorLabel: 'Select age group entry point',
  stage15Title: '15–17yrs Emerging Builder',
  stage15Desc: 'Micro-badges & mentored field sprints',
  stage18Title: '18–29yrs Early-Career',
  stage18Desc: 'Independent paid briefs & micro-bridging',
  stage30Title: '30–45yrs Specialist',
  stage30Desc: 'Proven field & systems lead',
  stage46Title: '46+ Master Practitioner',
  stage46Desc: 'Accredited assessor, QA mentor & advisor',
  beginCrossingCta: 'Begin Your Crossing',
  enterWorkspaceCta: 'Enter Studio',
  continueWithGoogleCta: 'Sign in with Google for Cross-Device Sync',
  pillarSectionHeading: 'A three-pillar bridge built on dignity and verification',
  pillarSectionSubcopy:
    'Every practitioner crosses on proven competence—paired with legal work clarity and intergenerational collaboration.',
  pillar1Title: 'Proof Without Paper',
  pillar1Sdg: 'SDGs 4 & 8',
  pillar1Body:
    'Demonstrate applied judgment through voice summaries or short practical scenarios to mint a Living Competency Passport partners can immediately audit.',
  pillar2Title: 'Cleared to Work & Get Paid',
  pillar2Sdg: 'SDGs 8, 10 & 16',
  pillar2Body:
    'Scoped milestone briefs paired with compliance-ready verification and transparent payout ledgers—turning verified skill directly into dignified income.',
  pillar3Title: 'Cross-Age Solution Flows',
  pillar3Sdg: 'SDGs 8, 10 & 17',
  pillar3Body:
    'Pair 15–17 emerging builders with 46+ master practitioners inside structured solution pods so field wisdom transfers while every contributor earns.',
  ageVersatilityHeading: 'Designed for every stage of craft',
  ageVersatilitySubcopy:
    'Select an age bracket to preview how Vuka na Amana tailors verification, paid problem briefs, and mentorship pathways.',
  closingHeading: 'Ready to cross over with trust?',
  closingBody:
    'Your selected age track and problem statement carry straight into the Talent Studio—no account gate or CV upload required.',
  voiceStartLabel: 'Voice Note',
  voiceStopLabel: 'Stop Voice',
  voiceListeningLabel: 'Listening…',
  voiceUnsupportedNote: 'Voice dictation requires a speech-capable browser; type directly anytime.',
  themeLight: 'Light',
  themeDark: 'Dark',
  offlineBanner: 'Offline mode active — changes are queued locally and sync automatically.',
  onlineReady: 'Online',
  queuedUpdatesSuffix: 'queued',
  syncNow: 'Sync Now',
  installApp: 'Install App',
  installIos: 'Install on iOS',
  verifyHeading: 'Verified Capability Studio',
  verifyLead: 'Show your real-world judgment through past work or a practical scenario—no CV or paper degree required.',
  editFocusButton: 'Refine Focus',
  saveFocusButton: 'Save Focus',
  cancelLabel: 'Cancel',
  addCapabilityHeading: 'Record a Practical Capability',
  capabilityTitleLabel: 'Capability title',
  capabilityTitlePlaceholder: 'e.g., 48V LiFePO4 Microgrid Fault Isolation',
  capabilityDomainLabel: 'Practice domain',
  capabilityProofLabel: 'Field proof or concrete outcome achieved',
  capabilityProofPlaceholder: 'Describe a real system you built, repaired, or stabilized and the measurable result...',
  addCapabilityCta: 'Add to Ledger',
  verifyStepCta: 'Verify Field Proof',
  endorseStepCta: 'Confirm Mastery',
  statusPending: 'Pending Review',
  statusFieldVerified: 'Field Verified',
  statusMasterEndorsed: 'Master Endorsed',
  unlockHeading: 'Paid Problem-Solving Briefs',
  unlockLead: 'Scoped, milestone-paid challenges matched to your verified discipline and practice stage.',
  searchBriefsLabel: 'Search briefs by skill, domain, or region',
  searchBriefsPlaceholder: 'Search solar, logistics, water, backend...',
  filterAllDomains: 'All Domains',
  matchSuffix: 'match',
  acceptBriefCta: 'Accept Brief',
  acceptedBriefLabel: 'Active in Solve',
  openInSolveCta: 'Open in Solve',
  deliverablesHeading: 'Required Deliverables',
  solveHeading: 'Problem-Solving Workbench',
  solveLead: 'Draft your deliverable notes offline or online. Submit completed milestones directly to your ledger.',
  solveEmptyTitle: 'No active briefs selected yet',
  solveEmptyBody: 'Choose a paid problem-solving brief in Unlock to begin drafting your solution.',
  browseBriefsCta: 'Browse Open Briefs',
  solutionNotesLabel: 'Deliverable summary & technical resolution',
  solutionNotesPlaceholder: 'Document root cause, methodology, verification measurements, and handover notes...',
  hoursLoggedLabel: 'Hours applied',
  saveDraftCta: 'Save Draft',
  submitSolutionCta: 'Submit Milestone',
  completedBadge: 'Completed',
  inProgressBadge: 'In Progress',
  pulseHeading: 'Contributions & Skill Growth',
  pulseLead: 'A portable record of your verified capabilities, completed problem briefs, and domain progression.',
  kpiVerifiedSkills: 'Verified Capabilities',
  kpiPaidEarned: 'Milestones Earned',
  kpiHoursApplied: 'Hours Applied',
  kpiActiveDomains: 'Active Domains',
  skillGrowthHeading: 'Domain Proficiency Trajectory',
  skillGrowthSubcopy: 'Progression from baseline intake to verified field execution across your active disciplines.',
  verifiedLabel: 'verified',
  completedBriefsLabel: 'completed briefs',
  ledgerHeading: 'Contribution Ledger',
  filterAllStatus: 'All',
  exportCsvCta: 'Export CSV',
  ledgerColBrief: 'Brief',
  ledgerColDomain: 'Domain',
  ledgerColStatus: 'Status',
  ledgerColHours: 'Hours',
  ledgerColPayout: 'Payout',
  ledgerEmpty: 'Complete your first brief in Solve to record verified earnings and hours here.',
  syncCardHeading: 'Cross-Platform Synchronization',
  syncCardBody: 'Connect a Google account to synchronize your verified capabilities and contribution ledger across devices.',
  accountLabel: 'Account',
  offlineQueueLabel: 'Offline Queue',
  pendingSuffix: 'pending',
  lastSyncedLabel: 'Last synced',
  notSyncedYet: 'Local only — not yet synced to cloud',
  validationProblemRequired: 'Please describe at least one real-world problem you know how to solve.',
  validationCapabilityRequired: 'Please enter both a capability title and field proof summary.',
  validationSolutionMinLength: 'Please provide at least 10 characters of resolution notes and positive hours before submitting.',
};

const SW: TranslationDictionary = {
  brandName: 'Vuka na Amana',
  brandSubtitle: 'Vuka kwa Uaminifu',
  backToHome: 'Rudi Mwanzo',
  navHiringPartners: 'Kwa Washirika wa Ajira',
  navEnterStudio: 'Ingia Studio',
  navVerify: '1. Thibitisha',
  navUnlock: '2. Fungua',
  navSolve: '3. Tatua',
  navPulse: '4. Mapigo',
  signInGoogle: 'Sawazisha Google',
  signOut: 'Ondoka',
  syncedAccount: 'Imesawazishwa',
  guestLocalMode: 'Hifadhi ya Kifaa',
  heroEyebrow: 'HAMASISHA · TAMBUA · TIMIZA',
  heroHeadline: 'Tambuliwa kwa ujuzi wako. Funguliwa njia ya kesho.',
  heroQuestion: 'Ni changamoto zipi halisi unazoweza kutatua?',
  heroSubcopy:
    'Vuka na Amana hubadilisha ujuzi na uzoefu wa kiufundi kuwa kazi zilizothibitishwa na zenye malipo halali—bila kusubiri vyeti vya karatasi.',
  problemInputLabel: 'Ni changamoto zipi halisi unazoweza kutatua?',
  problemInputPlaceholder:
    'Mfano: uchunguzi wa mifumo ya jua ya 48V, usimamizi wa mnyororo baridi wa chanjo, uhasibu wa vyama vya ushirika...',
  nameInputLabel: 'Jina unalopendelea',
  nameInputPlaceholder: 'Mfano: Amina Ochieng',
  stageSelectorLabel: 'Chagua hatua yako ya uzoefu',
  stage15Title: '15–17 Mjenzi Chipukizi',
  stage15Desc: 'Beji ndogo na kazi zenye ushauri',
  stage18Title: '18–29 Mwanzo wa Kazi',
  stage18Desc: 'Kazi huru za malipo na madaraja ya ujuzi',
  stage30Title: '30–45 Mtaalamu',
  stage30Desc: 'Kiongozi wa mifumo na utekelezaji',
  stage46Title: '46+ Mtaalamu Mkuu',
  stage46Desc: 'Mkaguzi aliyeidhinishwa na mshauri',
  beginCrossingCta: 'Anza Kuvuka',
  enterWorkspaceCta: 'Ingia Studio',
  continueWithGoogleCta: 'Ingia na Google kusawazisha vifaa',
  pillarSectionHeading: 'Daraja la nguzo tatu la heshima na uthibitisho',
  pillarSectionSubcopy:
    'Kila mtaalamu huvuka kupitia uwezo uliothibitishwa—pamoja na uwazi wa kisheria wa malipo na ushirikiano wa vizazi.',
  pillar1Title: 'Ushahidi Bila Karatasi',
  pillar1Sdg: 'SDGs 4 na 8',
  pillar1Body:
    'Onyesha uamuzi wa vitendo kwa sauti au hali halisi ili kuunda Pasipoti Hai ya Uwezo ambayo washirika wanaweza kuiamini mara moja.',
  pillar2Title: 'Ruhusa ya Kazi na Malipo',
  pillar2Sdg: 'SDGs 8, 10 na 16',
  pillar2Body:
    'Miradi yenye malengo wazi na malipo ya uwazi—kubadilisha ujuzi uliothibitishwa kuwa kipato chenye heshima.',
  pillar3Title: 'Mtiririko wa Vizazi Vyote',
  pillar3Sdg: 'SDGs 8, 10 na 17',
  pillar3Body:
    'Unganisha wajenzi chipukizi wa 15–17 na wataalamu wakuu wa 46+ ndani ya vikundi vya utatuzi ili hekima isambae huku kila mmoja akilipwa.',
  ageVersatilityHeading: 'Imeundwa kwa kila hatua ya ujuzi',
  ageVersatilitySubcopy:
    'Bofya kundi la umri kuona jinsi Vuka na Amana inavyorekebisha uthibitisho, kazi zenye malipo, na ushauri.',
  closingHeading: 'Uko tayari kuvuka kwa uaminifu?',
  closingBody:
    'Hatua yako ya umri na maelezo yako huingia moja kwa moja kwenye Studio—hakuna kizuizi cha akaunti.',
  voiceStartLabel: 'Rekodi Sauti',
  voiceStopLabel: 'Simamisha Sauti',
  voiceListeningLabel: 'Inasikiliza…',
  voiceUnsupportedNote: 'Kuingiza kwa sauti kunahitaji kivinjari kinachoauni; andika moja kwa moja wakati wowote.',
  themeLight: 'Mwanga',
  themeDark: 'Giza',
  offlineBanner: 'Hali ya nje ya mtandao — mabadiliko yanahifadhiwa kwenye kifaa na kusawazishwa baadaye.',
  onlineReady: 'Mtandaoni',
  queuedUpdatesSuffix: 'katika foleni',
  syncNow: 'Sawazisha Sasa',
  installApp: 'Sakinisha App',
  installIos: 'Sakinisha kwenye iOS',
  verifyHeading: 'Studio ya Uthibitisho wa Uwezo',
  verifyLead: 'Onyesha uamuzi wako halisi kupitia kazi zilizopita au mfano wa vitendo—hakuna CV inayohitajika.',
  editFocusButton: 'Hariri Lengo',
  saveFocusButton: 'Hifadhi Lengo',
  cancelLabel: 'Ghairi',
  addCapabilityHeading: 'Rekodi Uwezo wa Vitendo',
  capabilityTitleLabel: 'Kichwa cha uwezo',
  capabilityTitlePlaceholder: 'Mfano: Uchunguzi wa Mfumo wa Jua wa 48V',
  capabilityDomainLabel: 'Sekta ya utaalamu',
  capabilityProofLabel: 'Ushahidi wa shambani au matokeo halisi',
  capabilityProofPlaceholder: 'Eleza mfumo halisi ulioujenga au kuukarabati na matokeo yake...',
  addCapabilityCta: 'Ongeza kwenye Daftari',
  verifyStepCta: 'Thibitisha Ushahidi',
  endorseStepCta: 'Idhinisha Umahiri',
  statusPending: 'Inasubiri Ukaguzi',
  statusFieldVerified: 'Imethibitishwa Shambani',
  statusMasterEndorsed: 'Imeidhinishwa na Mtaalamu',
  unlockHeading: 'Miradi ya Utatuzi Yenye Malipo',
  unlockLead: 'Changamoto zenye malipo ya hatua zinazolingana na utaalamu wako uliothibitishwa.',
  searchBriefsLabel: 'Tafuta miradi kwa ujuzi, sekta, au eneo',
  searchBriefsPlaceholder: 'Tafuta jua, maji, fedha, afya...',
  filterAllDomains: 'Sekta Zote',
  matchSuffix: 'ulinganifu',
  acceptBriefCta: 'Kubali Mradi',
  acceptedBriefLabel: 'Inaendelea Kutatuliwa',
  openInSolveCta: 'Fungua kwenye Tatua',
  deliverablesHeading: 'Matokeo Yanayohitajika',
  solveHeading: 'Dawati la Utatuzi',
  solveLead: 'Andika au rekodi suluhisho lako mtandaoni au nje ya mtandao na uwasilishe hatua zilizokamilika.',
  solveEmptyTitle: 'Hakuna mradi uliochaguliwa bado',
  solveEmptyBody: 'Chagua mradi wenye malipo katika Fungua ili kuanza kuandaa suluhisho lako.',
  browseBriefsCta: 'Tazama Miradi Wazi',
  solutionNotesLabel: 'Muhtasari wa matokeo na suluhisho la kiufundi',
  solutionNotesPlaceholder: 'Andika chanzo cha tatizo, mbinu, vipimo vya uthibitisho, na mwongozo...',
  hoursLoggedLabel: 'Saa zilizotumika',
  saveDraftCta: 'Hifadhi Rasimu',
  submitSolutionCta: 'Wasilisha Hatua',
  completedBadge: 'Imekamilika',
  inProgressBadge: 'Inaendelea',
  pulseHeading: 'Michango na Ukuaji wa Ujuzi',
  pulseLead: 'Rekodi inayobebeka ya uwezo wako uliothibitishwa, miradi iliyokamilika, na maendeleo yako.',
  kpiVerifiedSkills: 'Uwezo Uliothibitishwa',
  kpiPaidEarned: 'Malipo Yaliyopatikana',
  kpiHoursApplied: 'Saa Zilizotumika',
  kpiActiveDomains: 'Sekta Zinazofanya Kazi',
  skillGrowthHeading: 'Mwelekeo wa Umahiri',
  skillGrowthSubcopy: 'Maendeleo kutoka tathmini ya awali hadi utekelezaji uliothibitishwa shambani.',
  verifiedLabel: 'imethibitishwa',
  completedBriefsLabel: 'miradi iliyokamilika',
  ledgerHeading: 'Daftari la Michango',
  filterAllStatus: 'Zote',
  exportCsvCta: 'Hamisha CSV',
  ledgerColBrief: 'Mradi',
  ledgerColDomain: 'Sekta',
  ledgerColStatus: 'Hali',
  ledgerColHours: 'Saa',
  ledgerColPayout: 'Malipo',
  ledgerEmpty: 'Kamilisha mradi wako wa kwanza katika Tatua ili kurekodi mapato na saa hapa.',
  syncCardHeading: 'Usawazishaji Kwenye Vifaa',
  syncCardBody: 'Unganisha akaunti ya Google ili kusawazisha uwezo wako na daftari la michango kwenye vifaa vyote.',
  accountLabel: 'Akaunti',
  offlineQueueLabel: 'Foleni ya Nje ya Mtandao',
  pendingSuffix: 'inasubiri',
  lastSyncedLabel: 'Usawazishaji wa mwisho',
  notSyncedYet: 'Kwenye kifaa pekee — haijasawazishwa bado',
  validationProblemRequired: 'Tafadhali eleza angalau changamoto moja halisi unayoweza kutatua.',
  validationCapabilityRequired: 'Tafadhali weka kichwa cha uwezo na muhtasari wa ushahidi.',
  validationSolutionMinLength: 'Tafadhali andika angalau herufi 10 za suluhisho na saa zaidi ya sifuri.',
};

const FR: TranslationDictionary = {
  brandName: 'Vuka na Amana',
  brandSubtitle: 'Traverser en Confiance',
  backToHome: 'Retour à l’accueil',
  navHiringPartners: 'Partenaires Recruteurs',
  navEnterStudio: 'Entrer au Studio',
  navVerify: '1. Vérifier',
  navUnlock: '2. Débloquer',
  navSolve: '3. Résoudre',
  navPulse: '4. Pouls',
  signInGoogle: 'Sync Google',
  signOut: 'Déconnexion',
  syncedAccount: 'Synchronisé',
  guestLocalMode: 'Coffre Local',
  heroEyebrow: 'ENCOURAGER · RECONNAÎTRE · ACCOMPLIR',
  heroHeadline: 'Reconnu pour votre savoir-faire. Libre pour votre avenir.',
  heroQuestion: 'Quels problèmes concrets savez-vous résoudre ?',
  heroSubcopy:
    'Vuka na Amana transforme les compétences déplacées et le jugement terrain en missions vérifiées et rémunérées—sans attendre les diplômes papier.',
  problemInputLabel: 'Quels problèmes concrets savez-vous résoudre ?',
  problemInputPlaceholder:
    'Ex. : diagnostic d’onduleurs solaires 48V, chaîne du froid vaccinale, trésorerie de coopérative ou API hors ligne...',
  nameInputLabel: 'Nom d’usage',
  nameInputPlaceholder: 'Ex. : Nadia Benali',
  stageSelectorLabel: 'Choisissez votre stade de pratique',
  stage15Title: '15–17 Bâtisseur Émergent',
  stage15Desc: 'Micro-badges et sprints encadrés',
  stage18Title: '18–29 Début de Carrière',
  stage18Desc: 'Missions rémunérées et micro-passerelles',
  stage30Title: '30–45 Spécialiste',
  stage30Desc: 'Responsable systèmes et terrain',
  stage46Title: '46+ Maître Praticien',
  stage46Desc: 'Évaluateur accrédité et mentor conseil',
  beginCrossingCta: 'Commencer Votre Traversée',
  enterWorkspaceCta: 'Entrer au Studio',
  continueWithGoogleCta: 'Connexion Google pour Synchronisation',
  pillarSectionHeading: 'Un pont en trois piliers fondé sur la dignité',
  pillarSectionSubcopy:
    'Chaque praticien avance grâce à des preuves concrètes—alliant conformité de paiement et transmission intergénérationnelle.',
  pillar1Title: 'Preuve Sans Papier',
  pillar1Sdg: 'ODD 4 & 8',
  pillar1Body:
    'Démontrez votre jugement concret par note vocale ou scénario pratique pour générer un Passeport de Compétences Vivant.',
  pillar2Title: 'Autorisé à Travailler & Payé',
  pillar2Sdg: 'ODD 8, 10 & 16',
  pillar2Body:
    'Des missions cadrées avec vérification conforme et paiements transparents par jalons—convertissant votre talent en revenu digne.',
  pillar3Title: 'Flux Intergénérationnels',
  pillar3Sdg: 'ODD 8, 10 & 17',
  pillar3Body:
    'Associez bâtisseurs de 15–17 ans et maîtres de 46+ ans dans des équipes de résolution pour transmettre le métier tout en rémunérant chacun.',
  ageVersatilityHeading: 'Pensé pour chaque âge du métier',
  ageVersatilitySubcopy:
    'Sélectionnez une tranche d’âge pour prévisualiser votre parcours de vérification, de missions et de mentorat.',
  closingHeading: 'Prêt à traverser en confiance ?',
  closingBody:
    'Votre stade d’âge et votre déclaration de compétence passent directement dans le Studio—sans barrière de compte.',
  voiceStartLabel: 'Note Vocale',
  voiceStopLabel: 'Arrêter',
  voiceListeningLabel: 'Écoute…',
  voiceUnsupportedNote: 'La dictée vocale nécessite un navigateur compatible ; saisissez au clavier à tout moment.',
  themeLight: 'Clair',
  themeDark: 'Sombre',
  offlineBanner: 'Mode hors ligne actif — modifications enregistrées localement et synchronisées dès retour réseau.',
  onlineReady: 'En ligne',
  queuedUpdatesSuffix: 'en file',
  syncNow: 'Synchroniser',
  installApp: 'Installer l’App',
  installIos: 'Installer sur iOS',
  verifyHeading: 'Studio des Compétences Vérifiées',
  verifyLead: 'Montrez votre jugement terrain par vos réalisations ou un scénario pratique—aucun CV requis.',
  editFocusButton: 'Modifier l’axe',
  saveFocusButton: 'Enregistrer',
  cancelLabel: 'Annuler',
  addCapabilityHeading: 'Enregistrer une Compétence Pratique',
  capabilityTitleLabel: 'Intitulé de la compétence',
  capabilityTitlePlaceholder: 'Ex. : Diagnostic de micro-réseau solaire 48V',
  capabilityDomainLabel: 'Domaine de pratique',
  capabilityProofLabel: 'Preuve terrain ou résultat obtenu',
  capabilityProofPlaceholder: 'Décrivez un système réel construit ou réparé et le résultat mesurable...',
  addCapabilityCta: 'Ajouter au Registre',
  verifyStepCta: 'Vérifier la Preuve',
  endorseStepCta: 'Confirmer la Maîtrise',
  statusPending: 'En Attente',
  statusFieldVerified: 'Vérifié Terrain',
  statusMasterEndorsed: 'Validé Maître',
  unlockHeading: 'Missions Rémunérées',
  unlockLead: 'Défis rémunérés par jalons adaptés à votre spécialité vérifiée et votre stade.',
  searchBriefsLabel: 'Rechercher par compétence, domaine ou région',
  searchBriefsPlaceholder: 'Rechercher solaire, logistique, eau, API...',
  filterAllDomains: 'Tous Domaines',
  matchSuffix: 'adéquation',
  acceptBriefCta: 'Accepter la Mission',
  acceptedBriefLabel: 'Actif dans Résoudre',
  openInSolveCta: 'Ouvrir dans Résoudre',
  deliverablesHeading: 'Livrables Attendus',
  solveHeading: 'Atelier de Résolution',
  solveLead: 'Rédigez vos notes hors ligne ou en ligne et soumettez vos jalons au registre.',
  solveEmptyTitle: 'Aucune mission active sélectionnée',
  solveEmptyBody: 'Choisissez une mission rémunérée dans Débloquer pour démarrer votre résolution.',
  browseBriefsCta: 'Parcourir les Missions',
  solutionNotesLabel: 'Synthèse du livrable et résolution technique',
  solutionNotesPlaceholder: 'Documentez la cause racine, la méthodologie, les mesures et la passation...',
  hoursLoggedLabel: 'Heures appliquées',
  saveDraftCta: 'Brouillon',
  submitSolutionCta: 'Soumettre le Jalon',
  completedBadge: 'Terminé',
  inProgressBadge: 'En Cours',
  pulseHeading: 'Contributions et Progression',
  pulseLead: 'Un dossier portable de vos compétences vérifiées, missions accomplies et progression.',
  kpiVerifiedSkills: 'Compétences Vérifiées',
  kpiPaidEarned: 'Jalons Rémunérés',
  kpiHoursApplied: 'Heures Appliquées',
  kpiActiveDomains: 'Domaines Actifs',
  skillGrowthHeading: 'Trajectoire de Maîtrise',
  skillGrowthSubcopy: 'Progression depuis l’accueil initial jusqu’à l’exécution vérifiée sur le terrain.',
  verifiedLabel: 'vérifiées',
  completedBriefsLabel: 'missions terminées',
  ledgerHeading: 'Registre des Contributions',
  filterAllStatus: 'Tout',
  exportCsvCta: 'Exporter CSV',
  ledgerColBrief: 'Mission',
  ledgerColDomain: 'Domaine',
  ledgerColStatus: 'Statut',
  ledgerColHours: 'Heures',
  ledgerColPayout: 'Paiement',
  ledgerEmpty: 'Terminez votre première mission dans Résoudre pour enregistrer vos gains et heures.',
  syncCardHeading: 'Synchronisation Multi-Appareils',
  syncCardBody: 'Connectez un compte Google pour synchroniser vos compétences et votre registre sur tous vos appareils.',
  accountLabel: 'Compte',
  offlineQueueLabel: 'File Hors Ligne',
  pendingSuffix: 'en attente',
  lastSyncedLabel: 'Dernière synchro',
  notSyncedYet: 'Local uniquement — non synchronisé',
  validationProblemRequired: 'Veuillez décrire au moins un problème concret que vous savez résoudre.',
  validationCapabilityRequired: 'Veuillez saisir un intitulé de compétence et une preuve terrain.',
  validationSolutionMinLength: 'Saisissez au moins 10 caractères de notes et des heures positives avant d’envoyer.',
};

const AR: TranslationDictionary = {
  brandName: 'Vuka na Amana',
  brandSubtitle: 'اعبر بثقة وأمانة',
  backToHome: 'العودة للرئيسية',
  navHiringPartners: 'لشركاء التوظيف',
  navEnterStudio: 'دخول الاستوديو',
  navVerify: '1. التحقق',
  navUnlock: '2. الفرص',
  navSolve: '3. الحل',
  navPulse: '4. الأثر',
  signInGoogle: 'المزامنة عبر Google',
  signOut: 'تسجيل الخروج',
  syncedAccount: 'متزامن سحابياً',
  guestLocalMode: 'حفظ محلي دون اتصال',
  heroEyebrow: 'التشجيع · التقدير · الإنجاز',
  heroHeadline: 'تُرى لمهارتك. ومُهيّأ لمستقبلك.',
  heroQuestion: 'ما هي المشكلات الواقعية التي تتقن حلها؟',
  heroSubcopy:
    'تحوّل Vuka na Amana المهارات الميدانية والحكم المهني إلى أعمال موثقة ومدفوعة الأجر بكرامة—دون انتظار الشهادات الورقية.',
  problemInputLabel: 'ما هي المشكلات الواقعية التي تتقن حلها؟',
  problemInputPlaceholder:
    'مثال: صيانة محولات الطاقة الشمسية 48 فولت، لوجستيات سلسلة التبريد للقاحات، دفاتر التدفق النقدي للتعاونيات...',
  nameInputLabel: 'الاسم المفضل',
  nameInputPlaceholder: 'مثال: طارق المنصور',
  stageSelectorLabel: 'اختر مرحلتك المهنية',
  stage15Title: '15–17 بنّاء ناشئ',
  stage15Desc: 'شارات مهارية ومهام بإشراف مباشر',
  stage18Title: '18–29 بداية المسار',
  stage18Desc: 'مهام مستقلة مدفوعة وجسور تأهيل سريعة',
  stage30Title: '30–45 أخصائي',
  stage30Desc: 'قائد أنظمة وعمليات ميدانية',
  stage46Title: '46+ خبير متمرس',
  stage46Desc: 'مقيّم معتمد وموجّه ومستشار مهني',
  beginCrossingCta: 'ابدأ عبورك الآن',
  enterWorkspaceCta: 'دخول الاستوديو',
  continueWithGoogleCta: 'تسجيل الدخول عبر Google للمزامنة',
  pillarSectionHeading: 'جسر من ثلاث ركائز يُبنى على الكرامة والثقة',
  pillarSectionSubcopy:
    'يعبر كل ممارس عبر كفاءته الفعلية—بالتكامل مع وضوح العمل القانوني والتعاون بين الأجيال.',
  pillar1Title: 'إثبات بلا ورق',
  pillar1Sdg: 'أهداف التنمية 4 و 8',
  pillar1Body:
    'اعرض حكمك المهني عبر رسالة صوتية أو سيناريو عملي لإصدار جواز كفاءة حي يمكن للشركاء اعتماده فوراً.',
  pillar2Title: 'مؤهّل للعمل والأجر العادل',
  pillar2Sdg: 'أهداف التنمية 8 و 10 و 16',
  pillar2Body:
    'مهام محددة النطاق مع تحقق جاهز للامتثال ومدفوعات شفافة—لتحويل مهارتك الموثقة إلى دخل كريم.',
  pillar3Title: 'تدفقات الحلول بين الأجيال',
  pillar3Sdg: 'أهداف التنمية 8 و 10 و 17',
  pillar3Body:
    'ربط الناشئين (15–17) بالخبراء المتمرسين (+46) في فرق حلول منظمة لنقل الخبرة الميدانية مع عائد عادل للجميع.',
  ageVersatilityHeading: 'مصمم لكل مرحلة من مراحل الخبرة',
  ageVersatilitySubcopy:
    'اختر الفئة العمرية لمعاينة مسار التحقق والمهام المدفوعة والإرشاد المخصص لك.',
  closingHeading: 'هل أنت مستعد للعبور بثقة؟',
  closingBody:
    'تنتقل مرحلتك المهنية ووصف مهارتك مباشرة إلى استوديو التحقق—دون حاجة لتسجيل مسبق أو سيرة ذاتية.',
  voiceStartLabel: 'ملاحظة صوتية',
  voiceStopLabel: 'إيقاف الصوت',
  voiceListeningLabel: 'جاري الاستماع…',
  voiceUnsupportedNote: 'يتطلب الإدخال الصوتي متصفحاً يدعم التعرف على الصوت؛ يمكنك الكتابة مباشرة في أي وقت.',
  themeLight: 'فاتح',
  themeDark: 'داكن',
  offlineBanner: 'وضع عدم الاتصال نشط — يتم حفظ التغييرات محلياً ومزامنتها تلقائياً.',
  onlineReady: 'متصل',
  queuedUpdatesSuffix: 'بانتظار المزامنة',
  syncNow: 'مزامنة الآن',
  installApp: 'تثبيت التطبيق',
  installIos: 'التثبيت على iOS',
  verifyHeading: 'استوديو القدرات الموثقة',
  verifyLead: 'أثبت حكمك المهني عبر أعمالك السابقة أو سيناريو عملي قصير—دون سيرة ذاتية أو شهادة ورقية.',
  editFocusButton: 'تعديل التخصص',
  saveFocusButton: 'حفظ التخصص',
  cancelLabel: 'إلغاء',
  addCapabilityHeading: 'إضافة قدرة عملية',
  capabilityTitleLabel: 'عنوان القدرة',
  capabilityTitlePlaceholder: 'مثال: عزل أعطال الشبكات الشمسية 48 فولت',
  capabilityDomainLabel: 'مجال الممارسة',
  capabilityProofLabel: 'الدليل الميداني أو النتيجة المحققة',
  capabilityProofPlaceholder: 'صف نظاماً حقيقياً قمت ببنائه أو إصلاحه والنتيجة القابلة للقياس...',
  addCapabilityCta: 'إضافة إلى السجل',
  verifyStepCta: 'توثيق الدليل الميداني',
  endorseStepCta: 'اعتماد الإتقان',
  statusPending: 'قيد المراجعة',
  statusFieldVerified: 'موثق ميدانياً',
  statusMasterEndorsed: 'معتمد كخبير',
  unlockHeading: 'مهام حل المشكلات المدفوعة',
  unlockLead: 'تحديات محددة النطاق ومدفوعة المراحل تتوافق مع تخصصك الموثق ومرحلتك المهنية.',
  searchBriefsLabel: 'ابحث في المهام حسب المهارة أو المجال أو المنطقة',
  searchBriefsPlaceholder: 'ابحث: طاقة شمسية، لوجستيات، مياه، برمجة...',
  filterAllDomains: 'جميع المجالات',
  matchSuffix: 'تطابق',
  acceptBriefCta: 'قبول المهمة',
  acceptedBriefLabel: 'نشط في الحل',
  openInSolveCta: 'فتح في مساحة الحل',
  deliverablesHeading: 'المخرجات المطلوبة',
  solveHeading: 'منصة تنفيذ الحلول',
  solveLead: 'دوّن ملاحظات الحل دون اتصال أو عبر الإنترنت، وسلّم المراحل المكتملة مباشرة إلى سجلك.',
  solveEmptyTitle: 'لا توجد مهام نشطة حالياً',
  solveEmptyBody: 'اختر مهمة مدفوعة من قسم الفرص للبدء في صياغة الحل.',
  browseBriefsCta: 'تصفح المهام المتاحة',
  solutionNotesLabel: 'ملخص المخرجات والحل الفني',
  solutionNotesPlaceholder: 'وثّق السبب الجذري، المنهجية، قياسات التحقق، وملاحظات التسليم...',
  hoursLoggedLabel: 'الساعات المنجزة',
  saveDraftCta: 'حفظ المسودة',
  submitSolutionCta: 'تسليم المرحلة',
  completedBadge: 'مكتمل',
  inProgressBadge: 'قيد التنفيذ',
  pulseHeading: 'المساهمات ونمو المهارات',
  pulseLead: 'سجل متنقل لقدراتك الموثقة والمهام المنجزة وتطورك المهني عبر التخصصات.',
  kpiVerifiedSkills: 'القدرات الموثقة',
  kpiPaidEarned: 'عوائد المراحل المنجزة',
  kpiHoursApplied: 'ساعات العمل المطبقة',
  kpiActiveDomains: 'المجالات النشطة',
  skillGrowthHeading: 'مسار إتقان التخصصات',
  skillGrowthSubcopy: 'التقدم من التقييم الأساسي إلى التنفيذ الميداني الموثق عبر تخصصاتك النشطة.',
  verifiedLabel: 'موثق',
  completedBriefsLabel: 'مهام مكتملة',
  ledgerHeading: 'سجل المساهمات',
  filterAllStatus: 'الكل',
  exportCsvCta: 'تصدير CSV',
  ledgerColBrief: 'المهمة',
  ledgerColDomain: 'المجال',
  ledgerColStatus: 'الحالة',
  ledgerColHours: 'الساعات',
  ledgerColPayout: 'العائد',
  ledgerEmpty: 'أكمل مهمتك الأولى في قسم الحل لتوثيق العوائد والساعات هنا.',
  syncCardHeading: 'المزامنة عبر المنصات',
  syncCardBody: 'اربط حساب Google لمزامنة قدراتك الموثقة وسجل مساهماتك عبر جميع أجهزتك.',
  accountLabel: 'الحساب',
  offlineQueueLabel: 'قائمة الانتظار المحلية',
  pendingSuffix: 'معلق',
  lastSyncedLabel: 'آخر مزامنة',
  notSyncedYet: 'حفظ محلي فقط — لم يُزامن بعد',
  validationProblemRequired: 'يرجى وصف مشكلة واقعية واحدة على الأقل تتقن حلها.',
  validationCapabilityRequired: 'يرجى إدخال عنوان القدرة وملخص الدليل الميداني.',
  validationSolutionMinLength: 'يرجى كتابة 10 أحرف على الأقل في ملخص الحل وتحديد ساعات موجبة قبل التسليم.',
};

export const TRANSLATIONS: Record<LocaleCode, TranslationDictionary> = {
  en: EN,
  sw: SW,
  fr: FR,
  ar: AR,
};

export function getLocaleMeta(code: LocaleCode): LocaleOption {
  return LOCALE_OPTIONS.find((opt) => opt.code === code) ?? LOCALE_OPTIONS[0];
}

export function getStageLabel(
  stage: AgeStage,
  t: TranslationDictionary
): { title: string; desc: string } {
  switch (stage) {
    case '15-17':
      return { title: t.stage15Title, desc: t.stage15Desc };
    case '18-29':
      return { title: t.stage18Title, desc: t.stage18Desc };
    case '30-45':
      return { title: t.stage30Title, desc: t.stage30Desc };
    case '46+':
      return { title: t.stage46Title, desc: t.stage46Desc };
  }
}
