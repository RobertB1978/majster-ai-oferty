import { useState } from 'react';
import { LayoutDashboard, FileText, Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { LANDING_ASSETS } from '@/config/landingAssets';

// ---------------------------------------------------------------------------
// Inline UI mockups — faithful SVG representations of actual product screens.
// To upgrade a tab to a real screenshot: set the corresponding path in
// src/config/landingAssets.ts (screenshots.<key>.path). The component will
// automatically render <img> instead of the SVG when a path is present.
// ---------------------------------------------------------------------------

interface MockupStrings {
  nav: { dashboard: string; projects: string; clients: string; offers: string; finance: string };
  welcome: string;
  stats: { active: string; quotes: string; revenue: string };
  lastProjects: string;
  colProject: string;
  colClient: string;
  colStatus: string;
  colValue: string;
  colDeadline: string;
  statusInProgress: string;
  statusQuote: string;
  statusAccepted: string;
}

interface OfferStrings {
  nav: { dashboard: string; projects: string; clients: string; offers: string; finance: string };
  breadcrumb: string;
  clientSection: string;
  clientPlaceholder: string;
  itemsSection: string;
  colDesc: string;
  colQty: string;
  colUnit: string;
  colPrice: string;
  colTotal: string;
  subtotal: string;
  vat: string;
  gross: string;
  aiBtn: string;
  generateBtn: string;
  previewTitle: string;
}

interface PdfStrings {
  docTitle: string;
  docNumber: string;
  contractor: string;
  client: string;
  issued: string;
  validUntil: string;
  scope: string;
  colNo: string;
  colDesc: string;
  colQty: string;
  colUnit: string;
  colPrice: string;
  colTotal: string;
  subtotal: string;
  vat: string;
  toPay: string;
  notes: string;
  notesText: string;
  download: string;
  signContractor: string;
  signClient: string;
  footer: string;
}

// ---------------------------------------------------------------------------
// Dashboard mockup
// ---------------------------------------------------------------------------

function DashboardMockup({ s }: { s: MockupStrings }) {
  return (
    <svg viewBox="0 0 1200 750" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" aria-hidden="true">
      <rect width="1200" height="750" fill="#F9FAFB" />

      {/* Sidebar */}
      <rect width="220" height="750" fill="#111111" />
      <rect x="20" y="20" width="32" height="32" rx="8" fill="#F59E0B" />
      <text x="60" y="42" fontFamily="sans-serif" fontSize="15" fontWeight="700" fill="#FFFFFF">Majster.AI</text>
      {([
        { label: s.nav.dashboard, y: 96, active: true },
        { label: s.nav.projects, y: 136, active: false },
        { label: s.nav.clients, y: 176, active: false },
        { label: s.nav.offers, y: 216, active: false },
        { label: s.nav.finance, y: 256, active: false },
      ] as const).map(({ label, y, active }) => (
        <g key={label}>
          {active && <rect x="0" y={y - 10} width="220" height="32" fill="#F59E0B" opacity="0.15" />}
          {active && <rect x="0" y={y - 10} width="3" height="32" fill="#F59E0B" />}
          <rect x="20" y={y - 4} width="14" height="14" rx="3" fill={active ? '#F59E0B' : '#4B5563'} />
          <text x="42" y={y + 7} fontFamily="sans-serif" fontSize="13" fill={active ? '#F59E0B' : '#9CA3AF'} fontWeight={active ? '600' : '400'}>{label}</text>
        </g>
      ))}

      {/* Main content */}
      <rect x="220" y="0" width="980" height="56" fill="#FFFFFF" />
      <rect x="220" y="55" width="980" height="1" fill="#E5E7EB" />
      <text x="244" y="34" fontFamily="sans-serif" fontSize="17" fontWeight="700" fill="#111827">{s.nav.dashboard}</text>
      <circle cx="1160" cy="28" r="18" fill="#F59E0B" opacity="0.2" />
      <text x="1153" y="33" fontFamily="sans-serif" fontSize="12" fontWeight="700" fill="#F59E0B">MK</text>
      <text x="244" y="88" fontFamily="sans-serif" fontSize="13" fill="#6B7280">{s.welcome}</text>

      {/* Stat cards */}
      {([
        { label: s.stats.active, value: '7', sub: '+2 mies.', x: 244, color: '#F59E0B' },
        { label: s.stats.quotes, value: '3', sub: '28 400 zł', x: 574, color: '#3B82F6' },
        { label: s.stats.revenue, value: '12 400 zł', sub: '+18%', x: 904, color: '#10B981' },
      ] as const).map(({ label, value, sub, x, color }) => (
        <g key={label}>
          <rect x={x} y={108} width="290" height="88" rx="12" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="1" />
          <rect x={x + 16} y={124} width="10" height="10" rx="3" fill={color} />
          <text x={x + 32} y={134} fontFamily="sans-serif" fontSize="11" fill="#6B7280">{label}</text>
          <text x={x + 16} y={166} fontFamily="sans-serif" fontSize="22" fontWeight="700" fill="#111827">{value}</text>
          <text x={x + 16} y={184} fontFamily="sans-serif" fontSize="10" fill="#9CA3AF">{sub}</text>
        </g>
      ))}

      {/* Projects table */}
      <text x="244" y="230" fontFamily="sans-serif" fontSize="14" fontWeight="600" fill="#111827">{s.lastProjects}</text>
      <rect x="244" y="240" width="916" height="32" rx="8" fill="#F3F4F6" />
      {([
        { label: s.colProject, x: 260 },
        { label: s.colClient, x: 500 },
        { label: s.colStatus, x: 700 },
        { label: s.colValue, x: 860 },
        { label: s.colDeadline, x: 1020 },
      ] as const).map(({ label, x }) => (
        <text key={label} x={x} y={261} fontFamily="sans-serif" fontSize="11" fontWeight="600" fill="#6B7280">{label}</text>
      ))}
      {([
        { name: 'Remont łazienki — ul. Kwiatowa 5', client: 'Jan Nowak', status: s.statusInProgress, sColor: '#3B82F6', sBg: '#EFF6FF', amount: '8 500 zł', date: '30.04.2026' },
        { name: 'Układanie podłóg — Wilanów', client: 'Anna Kowalska', status: s.statusQuote, sColor: '#F59E0B', sBg: '#FFFBEB', amount: '4 200 zł', date: '15.05.2026' },
        { name: 'Malowanie mieszkania 3-pok.', client: 'Firma ABC Sp. z o.o.', status: s.statusAccepted, sColor: '#10B981', sBg: '#ECFDF5', amount: '6 900 zł', date: '20.05.2026' },
        { name: 'Montaż ogrodzenia — Praga Płn.', client: 'Marta Wiśniewska', status: s.statusInProgress, sColor: '#3B82F6', sBg: '#EFF6FF', amount: '3 100 zł', date: '10.06.2026' },
      ] as const).map(({ name, client, status, sColor, sBg, amount, date }, idx) => {
        const y = 290 + idx * 44;
        return (
          <g key={name}>
            <rect x="244" y={y} width="916" height="40" fill={idx % 2 === 0 ? '#FFFFFF' : '#F9FAFB'} />
            <rect x="244" y={y + 39} width="916" height="1" fill="#F3F4F6" />
            <text x="260" y={y + 25} fontFamily="sans-serif" fontSize="12" fontWeight="500" fill="#111827">{name}</text>
            <text x="500" y={y + 25} fontFamily="sans-serif" fontSize="12" fill="#6B7280">{client}</text>
            <rect x="695" y={y + 10} width="76" height="20" rx="6" fill={sBg} />
            <text x="733" y={y + 24} fontFamily="sans-serif" fontSize="10" fontWeight="600" fill={sColor} textAnchor="middle">{status}</text>
            <text x="860" y={y + 25} fontFamily="sans-serif" fontSize="12" fontWeight="600" fill="#111827">{amount}</text>
            <text x="1020" y={y + 25} fontFamily="sans-serif" fontSize="12" fill="#6B7280">{date}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Offer editor mockup
// ---------------------------------------------------------------------------

function OfferEditorMockup({ s }: { s: OfferStrings }) {
  return (
    <svg viewBox="0 0 1200 750" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" aria-hidden="true">
      <rect width="1200" height="750" fill="#F9FAFB" />

      {/* Sidebar */}
      <rect width="220" height="750" fill="#111111" />
      <rect x="20" y="20" width="32" height="32" rx="8" fill="#F59E0B" />
      <text x="60" y="42" fontFamily="sans-serif" fontSize="15" fontWeight="700" fill="#FFFFFF">Majster.AI</text>
      {([
        { label: s.nav.dashboard, y: 96, active: false },
        { label: s.nav.projects, y: 136, active: false },
        { label: s.nav.clients, y: 176, active: false },
        { label: s.nav.offers, y: 216, active: true },
        { label: s.nav.finance, y: 256, active: false },
      ] as const).map(({ label, y, active }) => (
        <g key={label}>
          {active && <rect x="0" y={y - 10} width="220" height="32" fill="#F59E0B" opacity="0.15" />}
          {active && <rect x="0" y={y - 10} width="3" height="32" fill="#F59E0B" />}
          <rect x="20" y={y - 4} width="14" height="14" rx="3" fill={active ? '#F59E0B' : '#4B5563'} />
          <text x="42" y={y + 7} fontFamily="sans-serif" fontSize="13" fill={active ? '#F59E0B' : '#9CA3AF'} fontWeight={active ? '600' : '400'}>{label}</text>
        </g>
      ))}

      {/* Top bar */}
      <rect x="220" y="0" width="980" height="56" fill="#FFFFFF" />
      <rect x="220" y="55" width="980" height="1" fill="#E5E7EB" />
      <text x="244" y="34" fontFamily="sans-serif" fontSize="13" fill="#9CA3AF">{s.nav.offers} /</text>
      <text x={244 + s.nav.offers.length * 8} y="34" fontFamily="sans-serif" fontSize="13" fontWeight="600" fill="#111827"> {s.breadcrumb}</text>

      {/* Form card */}
      <rect x="244" y="76" width="600" height="560" rx="12" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="1" />
      <text x="268" y="108" fontFamily="sans-serif" fontSize="13" fontWeight="600" fill="#111827">{s.clientSection}</text>
      <rect x="268" y="118" width="272" height="36" rx="8" fill="#F9FAFB" stroke="#E5E7EB" strokeWidth="1" />
      <text x="284" y="141" fontFamily="sans-serif" fontSize="12" fill="#111827">Jan Nowak</text>
      <rect x="556" y="118" width="272" height="36" rx="8" fill="#F9FAFB" stroke="#E5E7EB" strokeWidth="1" />
      <text x="568" y="141" fontFamily="sans-serif" fontSize="12" fill="#111827">Remont łazienki — Kwiatowa</text>

      {/* Items */}
      <text x="268" y="180" fontFamily="sans-serif" fontSize="13" fontWeight="600" fill="#111827">{s.itemsSection}</text>
      <rect x="268" y="190" width="552" height="28" rx="6" fill="#F3F4F6" />
      {([
        { label: s.colDesc, x: 278 },
        { label: s.colQty, x: 488 },
        { label: s.colUnit, x: 532 },
        { label: s.colPrice, x: 570 },
        { label: s.colTotal, x: 658 },
      ] as const).map(({ label, x }) => (
        <text key={label} x={x} y={209} fontFamily="sans-serif" fontSize="10" fontWeight="600" fill="#6B7280">{label}</text>
      ))}
      {([
        { desc: 'Skuwanie starych płytek', qty: '16', unit: 'h', price: '85,00', total: '1 360,00' },
        { desc: 'Układanie nowych płytek', qty: '24', unit: 'h', price: '90,00', total: '2 160,00' },
        { desc: 'Płytki ścienne (60×30)', qty: '18', unit: 'm²', price: '120,00', total: '2 160,00' },
        { desc: 'Materiały montażowe', qty: '1', unit: 'kpl', price: '340,00', total: '340,00' },
      ] as const).map(({ desc, qty, unit, price, total }, idx) => {
        const y = 226 + idx * 36;
        return (
          <g key={desc}>
            <rect x="268" y={y} width="552" height="32" fill={idx % 2 === 0 ? '#FFFFFF' : '#F9FAFB'} />
            <rect x="268" y={y + 31} width="552" height="1" fill="#F3F4F6" />
            <text x="278" y={y + 20} fontFamily="sans-serif" fontSize="11" fill="#374151">{desc}</text>
            <text x="492" y={y + 20} fontFamily="sans-serif" fontSize="11" fill="#374151">{qty}</text>
            <text x="532" y={y + 20} fontFamily="sans-serif" fontSize="11" fill="#6B7280">{unit}</text>
            <text x="570" y={y + 20} fontFamily="sans-serif" fontSize="11" fill="#374151">{price} zł</text>
            <text x="658" y={y + 20} fontFamily="sans-serif" fontSize="11" fontWeight="500" fill="#111827">{total} zł</text>
          </g>
        );
      })}

      {/* Summary */}
      <rect x="476" y="380" width="344" height="120" rx="8" fill="#F9FAFB" stroke="#E5E7EB" strokeWidth="1" />
      <text x="492" y="404" fontFamily="sans-serif" fontSize="11" fill="#6B7280">{s.subtotal}</text>
      <text x="788" y="404" fontFamily="sans-serif" fontSize="11" fill="#111827" textAnchor="end">6 020,00 zł</text>
      <rect x="476" y="413" width="344" height="1" fill="#E5E7EB" />
      <text x="492" y="433" fontFamily="sans-serif" fontSize="11" fill="#6B7280">{s.vat}</text>
      <text x="788" y="433" fontFamily="sans-serif" fontSize="11" fill="#111827" textAnchor="end">1 384,60 zł</text>
      <rect x="476" y="442" width="344" height="1" fill="#E5E7EB" />
      <text x="492" y="468" fontFamily="sans-serif" fontSize="14" fontWeight="700" fill="#111827">{s.gross}</text>
      <text x="788" y="468" fontFamily="sans-serif" fontSize="14" fontWeight="700" fill="#F59E0B" textAnchor="end">7 404,60 zł</text>

      {/* AI chip */}
      <rect x="268" y="520" width="180" height="36" rx="8" fill="#FFFBEB" stroke="#F59E0B" strokeWidth="1" />
      <rect x="280" y="532" width="12" height="12" rx="3" fill="#F59E0B" />
      <text x="300" y="543" fontFamily="sans-serif" fontSize="12" fontWeight="500" fill="#92400E">{s.aiBtn}</text>

      {/* Generate button */}
      <rect x="476" y="516" width="344" height="44" rx="10" fill="#F59E0B" />
      <text x="648" y="543" fontFamily="sans-serif" fontSize="13" fontWeight="700" fill="#000000" textAnchor="middle">{s.generateBtn}</text>

      {/* Right panel */}
      <rect x="868" y="76" width="332" height="560" rx="12" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="1" />
      <text x="892" y="108" fontFamily="sans-serif" fontSize="13" fontWeight="600" fill="#111827">{s.previewTitle}</text>
      <rect x="892" y="120" width="284" height="370" rx="8" fill="#F9FAFB" stroke="#E5E7EB" strokeWidth="1" />
      <rect x="892" y="120" width="284" height="40" rx="8" fill="#111827" />
      <rect x="904" y="132" width="20" height="20" rx="4" fill="#F59E0B" />
      <text x="932" y="146" fontFamily="sans-serif" fontSize="11" fontWeight="600" fill="#FFFFFF">Majster.AI</text>
      <rect x="904" y="174" width="180" height="6" rx="3" fill="#E5E7EB" />
      <rect x="904" y="186" width="120" height="4" rx="2" fill="#F3F4F6" />
      <rect x="892" y="210" width="284" height="1" fill="#E5E7EB" />
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <rect x="904" y={220 + i * 28} width="260" height="20" rx="3" fill={i === 0 ? '#F3F4F6' : '#FAFAFA'} />
          <rect x="904" y={239 + i * 28} width="260" height="1" fill="#F3F4F6" />
        </g>
      ))}
      <rect x="904" y="345" width="260" height="24" rx="4" fill="#FFFBEB" stroke="#FDE68A" strokeWidth="1" />
      <text x="1034" y="362" fontFamily="sans-serif" fontSize="11" fontWeight="700" fill="#92400E" textAnchor="middle">7 404,60 zł</text>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// PDF preview mockup
// ---------------------------------------------------------------------------

function PdfPreviewMockup({ s }: { s: PdfStrings }) {
  return (
    <svg viewBox="0 0 1200 750" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" aria-hidden="true">
      <rect width="1200" height="750" fill="#D1D5DB" />

      {/* Toolbar */}
      <rect width="1200" height="44" fill="#374151" />
      <text x="24" y="27" fontFamily="sans-serif" fontSize="12" fill="#9CA3AF">wycena_remont_lazienki_jan_nowak.pdf</text>
      <rect x="1100" y="10" width="72" height="24" rx="6" fill="#F59E0B" />
      <text x="1136" y="26" fontFamily="sans-serif" fontSize="11" fontWeight="700" fill="#000000" textAnchor="middle">{s.download}</text>

      {/* Document */}
      <rect x="200" y="60" width="800" height="668" rx="4" fill="#FFFFFF" />
      <rect x="200" y="60" width="800" height="80" rx="4" fill="#111111" />
      <rect x="224" y="76" width="36" height="36" rx="8" fill="#F59E0B" />
      <text x="268" y="95" fontFamily="sans-serif" fontSize="16" fontWeight="700" fill="#FFFFFF">Majster.AI</text>
      <text x="268" y="112" fontFamily="sans-serif" fontSize="10" fill="#9CA3AF">Profesjonalne usługi remontowe</text>
      <text x="976" y="95" fontFamily="sans-serif" fontSize="18" fontWeight="800" fill="#FFFFFF" textAnchor="end">{s.docTitle}</text>
      <text x="976" y="112" fontFamily="sans-serif" fontSize="10" fill="#F59E0B" textAnchor="end">{s.docNumber}</text>

      {/* Info boxes */}
      <rect x="224" y="158" width="350" height="88" rx="8" fill="#F9FAFB" stroke="#E5E7EB" strokeWidth="1" />
      <text x="240" y="178" fontFamily="sans-serif" fontSize="10" fontWeight="600" fill="#6B7280">{s.contractor}</text>
      <text x="240" y="196" fontFamily="sans-serif" fontSize="12" fontWeight="600" fill="#111827">Marek Kowalski — Usługi Remontowe</text>
      <text x="240" y="212" fontFamily="sans-serif" fontSize="11" fill="#6B7280">ul. Budowlana 12, 00-001 Warszawa</text>
      <text x="240" y="228" fontFamily="sans-serif" fontSize="11" fill="#6B7280">NIP: 123-456-78-90</text>

      <rect x="626" y="158" width="350" height="88" rx="8" fill="#FFFBEB" stroke="#FDE68A" strokeWidth="1" />
      <text x="642" y="178" fontFamily="sans-serif" fontSize="10" fontWeight="600" fill="#92400E">{s.client}</text>
      <text x="642" y="196" fontFamily="sans-serif" fontSize="12" fontWeight="600" fill="#111827">Jan Nowak</text>
      <text x="642" y="212" fontFamily="sans-serif" fontSize="11" fill="#6B7280">ul. Kwiatowa 5, 02-532 Warszawa</text>
      <text x="642" y="228" fontFamily="sans-serif" fontSize="11" fill="#6B7280">jan.nowak@email.pl</text>

      {/* Meta */}
      <text x="224" y="270" fontFamily="sans-serif" fontSize="11" fill="#6B7280">{s.issued}</text>
      <text x="340" y="270" fontFamily="sans-serif" fontSize="11" fontWeight="600" fill="#111827">12.04.2026</text>
      <text x="480" y="270" fontFamily="sans-serif" fontSize="11" fill="#6B7280">{s.validUntil}</text>
      <text x="560" y="270" fontFamily="sans-serif" fontSize="11" fontWeight="600" fill="#111827">30.04.2026</text>

      {/* Table */}
      <text x="224" y="302" fontFamily="sans-serif" fontSize="12" fontWeight="700" fill="#111827">{s.scope}</text>
      <rect x="224" y="312" width="752" height="28" rx="4" fill="#111827" />
      {([
        { label: s.colNo, x: 232 },
        { label: s.colDesc, x: 260 },
        { label: s.colQty, x: 600 },
        { label: s.colUnit, x: 652 },
        { label: s.colPrice, x: 700 },
        { label: s.colTotal, x: 800 },
      ] as const).map(({ label, x }) => (
        <text key={label} x={x} y={331} fontFamily="sans-serif" fontSize="10" fontWeight="600" fill="#FFFFFF">{label}</text>
      ))}
      {([
        { no: '1', desc: 'Robocizna — skuwanie starych płytek (łazienka 6 m²)', qty: '16', unit: 'h', price: '85,00', total: '1 360,00' },
        { no: '2', desc: 'Robocizna — układanie nowych płytek podłogowych', qty: '24', unit: 'h', price: '90,00', total: '2 160,00' },
        { no: '3', desc: 'Płytki ścienne ceramiczne 60×30 cm (kolor biały)', qty: '18', unit: 'm²', price: '120,00', total: '2 160,00' },
        { no: '4', desc: 'Materiały montażowe (klej do płytek, fuga biała)', qty: '1', unit: 'kpl', price: '340,00', total: '340,00' },
      ] as const).map(({ no, desc, qty, unit, price, total }, idx) => {
        const y = 344 + idx * 32;
        return (
          <g key={no}>
            <rect x="224" y={y} width="752" height="28" fill={idx % 2 === 0 ? '#FFFFFF' : '#F9FAFB'} />
            <rect x="224" y={y + 27} width="752" height="1" fill="#E5E7EB" />
            <text x="232" y={y + 18} fontFamily="sans-serif" fontSize="10" fill="#6B7280">{no}</text>
            <text x="260" y={y + 18} fontFamily="sans-serif" fontSize="11" fill="#111827">{desc}</text>
            <text x="600" y={y + 18} fontFamily="sans-serif" fontSize="11" fill="#374151">{qty}</text>
            <text x="652" y={y + 18} fontFamily="sans-serif" fontSize="11" fill="#6B7280">{unit}</text>
            <text x="700" y={y + 18} fontFamily="sans-serif" fontSize="11" fill="#374151">{price} zł</text>
            <text x="820" y={y + 18} fontFamily="sans-serif" fontSize="11" fontWeight="500" fill="#111827" textAnchor="end">{total} zł</text>
          </g>
        );
      })}

      {/* Summary */}
      <rect x="624" y="480" width="352" height="120" rx="8" fill="#F9FAFB" stroke="#E5E7EB" strokeWidth="1" />
      <text x="640" y="504" fontFamily="sans-serif" fontSize="11" fill="#6B7280">{s.subtotal}</text>
      <text x="960" y="504" fontFamily="sans-serif" fontSize="11" fill="#111827" textAnchor="end">6 020,00 zł</text>
      <rect x="624" y="514" width="352" height="1" fill="#E5E7EB" />
      <text x="640" y="534" fontFamily="sans-serif" fontSize="11" fill="#6B7280">{s.vat}</text>
      <text x="960" y="534" fontFamily="sans-serif" fontSize="11" fill="#111827" textAnchor="end">1 384,60 zł</text>
      <rect x="624" y="544" width="352" height="1" fill="#E5E7EB" />
      <rect x="624" y="548" width="352" height="44" fill="#F59E0B" opacity="0.08" />
      <text x="640" y="575" fontFamily="sans-serif" fontSize="14" fontWeight="700" fill="#111827">{s.toPay}</text>
      <text x="960" y="575" fontFamily="sans-serif" fontSize="16" fontWeight="800" fill="#92400E" textAnchor="end">7 404,60 zł</text>

      {/* Notes */}
      <text x="224" y="504" fontFamily="sans-serif" fontSize="10" fill="#6B7280">{s.notes}</text>
      <text x="224" y="520" fontFamily="sans-serif" fontSize="10" fill="#374151">{s.notesText}</text>

      {/* Signature */}
      <rect x="224" y="610" width="200" height="1" fill="#D1D5DB" />
      <text x="324" y="628" fontFamily="sans-serif" fontSize="9" fill="#9CA3AF" textAnchor="middle">{s.signContractor}</text>
      <rect x="776" y="610" width="200" height="1" fill="#D1D5DB" />
      <text x="876" y="628" fontFamily="sans-serif" fontSize="9" fill="#9CA3AF" textAnchor="middle">{s.signClient}</text>

      {/* Footer */}
      <text x="600" y="716" fontFamily="sans-serif" fontSize="9" fill="#9CA3AF" textAnchor="middle">{s.footer}</text>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------

const TABS = [
  { key: 'dashboard' as const, icon: LayoutDashboard, urlHint: 'app.majster.ai/dashboard' },
  { key: 'editor' as const, icon: FileText, urlHint: 'app.majster.ai/oferty/nowa' },
  { key: 'pdf' as const, icon: Eye, urlHint: 'app.majster.ai/pdf-podglad' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

// Maps each tab key to its screenshot asset config entry.
// path: null → render inline SVG mockup; string → render <img>.
const SCREENSHOT_ASSETS: Record<TabKey, { path: string | null; alt: string }> = {
  dashboard: LANDING_ASSETS.screenshots.dashboard,
  editor: LANDING_ASSETS.screenshots.offerEditor,
  pdf: LANDING_ASSETS.screenshots.pdfPreview,
};

// ---------------------------------------------------------------------------
// Section component
// ---------------------------------------------------------------------------

export function ProductScreenshotsSection() {
  const { t } = useTranslation();
  const shouldReduce = useReducedMotion();
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');

  const active = TABS.find((tab) => tab.key === activeTab) ?? TABS[0];

  // Translated strings passed into each SVG mockup so UI chrome responds to language
  const dashStrings: MockupStrings = {
    nav: {
      dashboard: t('landing.screenshots.mock.nav.dashboard'),
      projects: t('landing.screenshots.mock.nav.projects'),
      clients: t('landing.screenshots.mock.nav.clients'),
      offers: t('landing.screenshots.mock.nav.offers'),
      finance: t('landing.screenshots.mock.nav.finance'),
    },
    welcome: t('landing.screenshots.mock.welcome'),
    stats: {
      active: t('landing.screenshots.mock.stats.active'),
      quotes: t('landing.screenshots.mock.stats.quotes'),
      revenue: t('landing.screenshots.mock.stats.revenue'),
    },
    lastProjects: t('landing.screenshots.mock.lastProjects'),
    colProject: t('landing.screenshots.mock.col.project'),
    colClient: t('landing.screenshots.mock.col.client'),
    colStatus: t('landing.screenshots.mock.col.status'),
    colValue: t('landing.screenshots.mock.col.value'),
    colDeadline: t('landing.screenshots.mock.col.deadline'),
    statusInProgress: t('landing.screenshots.mock.status.inProgress'),
    statusQuote: t('landing.screenshots.mock.status.quote'),
    statusAccepted: t('landing.screenshots.mock.status.accepted'),
  };

  const offerStrings: OfferStrings = {
    nav: dashStrings.nav,
    breadcrumb: t('landing.screenshots.mock.offer.breadcrumb'),
    clientSection: t('landing.screenshots.mock.offer.clientSection'),
    clientPlaceholder: t('landing.screenshots.mock.offer.clientPlaceholder'),
    itemsSection: t('landing.screenshots.mock.offer.itemsSection'),
    colDesc: t('landing.screenshots.mock.offer.colDesc'),
    colQty: t('landing.screenshots.mock.col.qty'),
    colUnit: t('landing.screenshots.mock.col.unit'),
    colPrice: t('landing.screenshots.mock.col.price'),
    colTotal: t('landing.screenshots.mock.col.total'),
    subtotal: t('landing.screenshots.mock.summary.subtotal'),
    vat: t('landing.screenshots.mock.summary.vat'),
    gross: t('landing.screenshots.mock.summary.gross'),
    aiBtn: t('landing.screenshots.mock.offer.aiBtn'),
    generateBtn: t('landing.screenshots.mock.offer.generateBtn'),
    previewTitle: t('landing.screenshots.mock.offer.previewTitle'),
  };

  const pdfStrings: PdfStrings = {
    docTitle: t('landing.screenshots.mock.pdf.docTitle'),
    docNumber: t('landing.screenshots.mock.pdf.docNumber'),
    contractor: t('landing.screenshots.mock.pdf.contractor'),
    client: t('landing.screenshots.mock.pdf.client'),
    issued: t('landing.screenshots.mock.pdf.issued'),
    validUntil: t('landing.screenshots.mock.pdf.validUntil'),
    scope: t('landing.screenshots.mock.pdf.scope'),
    colNo: t('landing.screenshots.mock.pdf.colNo'),
    colDesc: t('landing.screenshots.mock.offer.colDesc'),
    colQty: t('landing.screenshots.mock.col.qty'),
    colUnit: t('landing.screenshots.mock.col.unit'),
    colPrice: t('landing.screenshots.mock.col.price'),
    colTotal: t('landing.screenshots.mock.col.total'),
    subtotal: t('landing.screenshots.mock.summary.subtotal'),
    vat: t('landing.screenshots.mock.summary.vat'),
    toPay: t('landing.screenshots.mock.summary.toPay'),
    notes: t('landing.screenshots.mock.pdf.notes'),
    notesText: t('landing.screenshots.mock.pdf.notesText'),
    download: t('landing.screenshots.mock.pdf.download'),
    signContractor: t('landing.screenshots.mock.pdf.signContractor'),
    signClient: t('landing.screenshots.mock.pdf.signClient'),
    footer: t('landing.screenshots.mock.pdf.footer'),
  };

  const activeScreenshotAsset = SCREENSHOT_ASSETS[activeTab];

  const panelVariants = shouldReduce
    ? { initial: {}, animate: {}, exit: {} }
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -4 },
      };

  return (
    <section
      className="relative py-20 md:py-28 bg-white dark:bg-brand-dark overflow-hidden"
      aria-labelledby="screenshots-heading"
    >
      {/* Ambient radial glow — purely decorative depth behind the frame */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] rounded-full bg-amber-400/[0.025] dark:bg-accent-amber/[0.04] blur-3xl" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-accent-amber/30 bg-accent-amber/10 px-4 py-1.5 text-sm font-medium text-accent-amber mb-6">
            {t('landing.screenshots.badge')}
          </div>
          <h2
            id="screenshots-heading"
            className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4"
          >
            {t('landing.screenshots.sectionTitle')}
          </h2>
          <p className="text-lg text-gray-600 dark:text-neutral-400 leading-relaxed max-w-2xl mx-auto">
            {t('landing.screenshots.sectionSubtitle')}
          </p>
        </div>

        {/* Tab navigation — scrollable on mobile */}
        <div
          className="flex gap-2 justify-start sm:justify-center mb-8 overflow-x-auto pb-1 scrollbar-hide"
          role="tablist"
          aria-label={t('landing.screenshots.sectionTitle')}
        >
          {TABS.map((tab) => {
            const isActive = tab.key === activeTab;
            return (
              <button
                key={tab.key}
                role="tab"
                aria-selected={isActive}
                aria-controls={`screenshot-panel-${tab.key}`}
                onClick={() => setActiveTab(tab.key)}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-amber focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-brand-dark shrink-0 ${
                  isActive
                    ? 'bg-accent-amber text-black shadow-md shadow-accent-amber/25'
                    : 'bg-gray-100 dark:bg-brand-card text-gray-600 dark:text-neutral-400 hover:bg-gray-200 dark:hover:bg-brand-border hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-brand-border'
                }`}
              >
                <tab.icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                {t(`landing.screenshots.${tab.key}.tab`)}
              </button>
            );
          })}
        </div>

        {/* Screenshot frame — glow ring wrapper */}
        <div className="relative">
          {/* Ambient amber glow ring behind the frame */}
          <div
            className="absolute -inset-px rounded-[1.1rem] bg-gradient-to-b from-amber-400/20 via-amber-400/5 to-transparent dark:from-accent-amber/12 dark:via-accent-amber/3 dark:to-transparent blur-sm pointer-events-none"
            aria-hidden="true"
          />

          <div
            id={`screenshot-panel-${active.key}`}
            role="tabpanel"
            className="relative rounded-2xl overflow-hidden border border-gray-200 dark:border-brand-border shadow-2xl shadow-gray-900/10 dark:shadow-black/50"
          >
            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-4 py-3 bg-gray-100 dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-[#2a2a2a]">
              <span className="w-3 h-3 rounded-full bg-red-400/80 shrink-0" aria-hidden="true" />
              <span className="w-3 h-3 rounded-full bg-yellow-400/80 shrink-0" aria-hidden="true" />
              <span className="w-3 h-3 rounded-full bg-green-400/80 shrink-0" aria-hidden="true" />
              <div className="flex-1 mx-3 bg-white dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#3a3a3a] rounded-md px-3 py-1 text-xs text-gray-400 dark:text-neutral-600 truncate select-none">
                {active.urlHint}
              </div>
              {/* Honest placeholder indicator — shown only while SVG mockup is active */}
              {activeScreenshotAsset.path === null && (
                <span className="hidden sm:inline-flex items-center gap-1 shrink-0 ml-2 text-[10px] font-medium text-gray-400 dark:text-neutral-600 bg-gray-200/70 dark:bg-[#252525] border border-gray-300/60 dark:border-[#333] rounded px-2 py-0.5 select-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400/70 dark:bg-accent-amber/60 shrink-0" aria-hidden="true" />
                  {t('landing.screenshots.badge')}
                </span>
              )}
            </div>

            {/* Animated tab panel */}
            <div className="aspect-[16/10] bg-[#F9FAFB] overflow-hidden">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={activeTab}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  variants={panelVariants}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full h-full"
                >
                  {activeScreenshotAsset.path !== null ? (
                    <img
                      src={activeScreenshotAsset.path}
                      alt={activeScreenshotAsset.alt}
                      className="w-full h-full object-cover"
                      draggable={false}
                    />
                  ) : (
                    <>
                      {activeTab === 'dashboard' && <DashboardMockup s={dashStrings} />}
                      {activeTab === 'editor' && <OfferEditorMockup s={offerStrings} />}
                      {activeTab === 'pdf' && <PdfPreviewMockup s={pdfStrings} />}
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>{/* end role="tabpanel" */}
        </div>{/* end glow ring wrapper */}

        {/* Caption */}
        <p className="mt-4 text-center text-sm text-gray-500 dark:text-neutral-500">
          {t(`landing.screenshots.${active.key}.caption`)}
        </p>
      </div>
    </section>
  );
}
