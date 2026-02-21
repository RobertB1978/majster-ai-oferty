// features.data.ts — Single source of truth for landing page features
// TRUTH RULE: status is set only after evidence is confirmed in Phase 0 detection

export type FeatureStatus = 'live' | 'beta' | 'soon';

export interface Feature {
  key: string;
  icon: string;       // lucide-react icon name
  title: string;
  desc: string;
  status: FeatureStatus;
  evidence?: string;  // REQUIRED for 'live' and 'beta' — file path + route/component
}

// Truth Ledger (filled after Phase 0 detection):
// - 'live'  = confirmed route in src/App.tsx OR component in src/
// - 'beta'  = component exists, feature not fully deployed
// - 'soon'  = no code evidence found
export const FEATURES: Feature[] = [
  {
    key: 'quotes',
    icon: 'FileText',
    title: 'Wyceny PDF',
    desc: 'Profesjonalne oferty PDF. Edytowalne szablony.',
    status: 'live',
    evidence: 'src/App.tsx:162-163 → /app/jobs/:id/quote → QuoteEditor, /app/quick-est → QuickEstimate',
  },
  {
    key: 'projects',
    icon: 'FolderOpen',
    title: 'Centrum projektów',
    desc: 'Projekty, statusy, zadania i dokumenty w jednym miejscu.',
    status: 'live',
    evidence: 'src/App.tsx:160 → /app/jobs → Projects component',
  },
  {
    key: 'clients',
    icon: 'Users',
    title: 'Baza klientów',
    desc: 'Kartoteka klientów z historią i kontaktami.',
    status: 'live',
    evidence: 'src/App.tsx:158 → /app/customers → Clients component',
  },
  {
    key: 'calendar',
    icon: 'Calendar',
    title: 'Kalendarz',
    desc: 'Terminarz prac i timeline projektów.',
    status: 'live',
    evidence: 'src/App.tsx:165 → /app/calendar → Calendar component',
  },
  {
    key: 'finance',
    icon: 'TrendingUp',
    title: 'Finanse',
    desc: 'Faktury, koszty, wyniki finansowe.',
    status: 'live',
    evidence: 'src/App.tsx:167 → /app/finance → Finance component',
  },
  {
    key: 'analytics',
    icon: 'BarChart2',
    title: 'Analityka',
    desc: 'Statystyki sprzedaży i raporty.',
    status: 'live',
    evidence: 'src/App.tsx:169 → /app/analytics → Analytics component',
  },
  {
    key: 'photos',
    icon: 'Camera',
    title: 'Dokumentacja zdjęciowa',
    desc: 'Zdjęcia z postępu prac przypisane do projektu.',
    status: 'live',
    evidence: 'src/App.tsx:164 → /app/photos → Photos component',
  },
  {
    key: 'i18n',
    icon: 'Globe',
    title: '3 języki',
    desc: 'Polski, English, Українська.',
    status: 'live',
    evidence: 'src/i18n/locales/pl.json + en.json + uk.json all confirmed in detection',
  },
  {
    key: 'mobile',
    icon: 'Smartphone',
    title: 'Mobile-first',
    desc: 'Zoptymalizowane na telefon.',
    status: 'live',
    evidence: 'UI itself is the evidence — always live',
  },
  {
    key: 'ai_assist',
    icon: 'Brain',
    title: 'Asystent AI',
    desc: 'Sugestie i automatyzacja wycen.',
    status: 'beta',
    evidence: 'src/components/ai/AiChatAgent.tsx + VoiceQuoteCreator.tsx — components exist, no confirmed full route',
  },
  {
    key: 'voice',
    icon: 'Mic',
    title: 'Wyceny głosem',
    desc: 'Twórz oferty dyktując głosem.',
    status: 'beta',
    evidence: 'src/components/ai/VoiceInputButton.tsx + VoiceQuoteCreator.tsx — components exist',
  },
  {
    key: 'privacy',
    icon: 'Shield',
    title: 'Prywatność danych',
    desc: 'Prywatność danych i kontrola dostępu.',
    status: 'soon',
  },
  {
    key: 'offline',
    icon: 'WifiOff',
    title: 'Tryb offline',
    desc: 'Pracuj bez internetu. Sync po połączeniu.',
    status: 'soon',
  },
  {
    key: 'native_app',
    icon: 'Download',
    title: 'Aplikacja iOS/Android',
    desc: 'Natywna aplikacja mobilna.',
    status: 'soon',
  },
  {
    key: 'api',
    icon: 'Code2',
    title: 'API dla integratorów',
    desc: 'Integruj Majster.AI ze swoimi systemami.',
    status: 'soon',
  },
];
