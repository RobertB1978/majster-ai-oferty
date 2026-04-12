import { useState } from 'react';
import { LayoutDashboard, FileText, Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// ---------------------------------------------------------------------------
// Inline UI mockups — faithful SVG representations of real product screens.
// Replace each <Mockup /> with an <img src="..."> when real screenshots arrive.
// ---------------------------------------------------------------------------

function DashboardMockup() {
  return (
    <svg
      viewBox="0 0 1200 750"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
      aria-hidden="true"
    >
      {/* Background */}
      <rect width="1200" height="750" fill="#F9FAFB" />

      {/* Sidebar */}
      <rect x="0" y="0" width="220" height="750" fill="#111111" />
      {/* Logo */}
      <rect x="20" y="20" width="32" height="32" rx="8" fill="#F59E0B" />
      <text x="60" y="42" fontFamily="sans-serif" fontSize="15" fontWeight="700" fill="#FFFFFF">
        Majster.AI
      </text>
      {/* Nav items */}
      {[
        { label: 'Dashboard', y: 96, active: true },
        { label: 'Projekty', y: 136, active: false },
        { label: 'Klienci', y: 176, active: false },
        { label: 'Oferty', y: 216, active: false },
        { label: 'Finanse', y: 256, active: false },
        { label: 'Kalendarz', y: 296, active: false },
        { label: 'Ustawienia', y: 640, active: false },
      ].map(({ label, y, active }) => (
        <g key={label}>
          {active && <rect x="0" y={y - 10} width="220" height="32" fill="#F59E0B" opacity="0.15" />}
          {active && <rect x="0" y={y - 10} width="3" height="32" fill="#F59E0B" />}
          <rect x="20" y={y - 4} width="14" height="14" rx="3" fill={active ? '#F59E0B' : '#4B5563'} />
          <text
            x="42"
            y={y + 7}
            fontFamily="sans-serif"
            fontSize="13"
            fill={active ? '#F59E0B' : '#9CA3AF'}
            fontWeight={active ? '600' : '400'}
          >
            {label}
          </text>
        </g>
      ))}

      {/* Main content area */}
      <rect x="220" y="0" width="980" height="750" fill="#F9FAFB" />

      {/* Top bar */}
      <rect x="220" y="0" width="980" height="56" fill="#FFFFFF" />
      <rect x="220" y="55" width="980" height="1" fill="#E5E7EB" />
      <text x="244" y="34" fontFamily="sans-serif" fontSize="17" fontWeight="700" fill="#111827">
        Dashboard
      </text>
      {/* Avatar */}
      <circle cx="1160" cy="28" r="18" fill="#F59E0B" opacity="0.2" />
      <text x="1153" y="33" fontFamily="sans-serif" fontSize="12" fontWeight="700" fill="#F59E0B">
        MK
      </text>

      {/* Welcome */}
      <text x="244" y="88" fontFamily="sans-serif" fontSize="13" fill="#6B7280">
        Witaj z powrotem, Marek
      </text>

      {/* Stat cards */}
      {[
        { label: 'Aktywne projekty', value: '7', sub: '+2 w tym miesiącu', x: 244, color: '#F59E0B' },
        { label: 'Oferty w toku', value: '3', sub: 'Łączna wartość: 28 400 zł', x: 574, color: '#3B82F6' },
        { label: 'Przychód (mies.)', value: '12 400 zł', sub: '+18% vs poprzedni', x: 904, color: '#10B981' },
      ].map(({ label, value, sub, x, color }) => (
        <g key={label}>
          <rect x={x} y={108} width="290" height="88" rx="12" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="1" />
          <rect x={x + 16} y={124} width="10" height="10" rx="3" fill={color} />
          <text x={x + 32} y={134} fontFamily="sans-serif" fontSize="11" fill="#6B7280">
            {label}
          </text>
          <text x={x + 16} y={166} fontFamily="sans-serif" fontSize="22" fontWeight="700" fill="#111827">
            {value}
          </text>
          <text x={x + 16} y={184} fontFamily="sans-serif" fontSize="10" fill="#9CA3AF">
            {sub}
          </text>
        </g>
      ))}

      {/* Projects table heading */}
      <text x="244" y="230" fontFamily="sans-serif" fontSize="14" fontWeight="600" fill="#111827">
        Ostatnie projekty
      </text>

      {/* Table header */}
      <rect x="244" y="240" width="916" height="32" rx="8" fill="#F3F4F6" />
      {[
        { label: 'Projekt', x: 260 },
        { label: 'Klient', x: 500 },
        { label: 'Status', x: 700 },
        { label: 'Wartość', x: 860 },
        { label: 'Termin', x: 1020 },
      ].map(({ label, x }) => (
        <text key={label} x={x} y={261} fontFamily="sans-serif" fontSize="11" fontWeight="600" fill="#6B7280">
          {label}
        </text>
      ))}

      {/* Table rows */}
      {[
        {
          name: 'Remont łazienki — ul. Kwiatowa 5',
          client: 'Jan Nowak',
          status: 'W toku',
          statusColor: '#3B82F6',
          statusBg: '#EFF6FF',
          amount: '8 500 zł',
          date: '30.04.2026',
        },
        {
          name: 'Układanie podłóg — Wilanów',
          client: 'Anna Kowalska',
          status: 'Wycena',
          statusColor: '#F59E0B',
          statusBg: '#FFFBEB',
          amount: '4 200 zł',
          date: '15.05.2026',
        },
        {
          name: 'Malowanie mieszkania 3-pok.',
          client: 'Firma ABC Sp. z o.o.',
          status: 'Zaakceptowany',
          statusColor: '#10B981',
          statusBg: '#ECFDF5',
          amount: '6 900 zł',
          date: '20.05.2026',
        },
        {
          name: 'Montaż ogrodzenia — Praga Płn.',
          client: 'Marta Wiśniewska',
          status: 'W toku',
          statusColor: '#3B82F6',
          statusBg: '#EFF6FF',
          amount: '3 100 zł',
          date: '10.06.2026',
        },
      ].map(({ name, client, status, statusColor, statusBg, amount, date }, idx) => {
        const y = 290 + idx * 44;
        const rowBg = idx % 2 === 0 ? '#FFFFFF' : '#F9FAFB';
        return (
          <g key={name}>
            <rect x="244" y={y} width="916" height="40" rx="0" fill={rowBg} />
            <rect x="244" y={y + 39} width="916" height="1" fill="#F3F4F6" />
            <text x="260" y={y + 25} fontFamily="sans-serif" fontSize="12" fontWeight="500" fill="#111827">
              {name}
            </text>
            <text x="500" y={y + 25} fontFamily="sans-serif" fontSize="12" fill="#6B7280">
              {client}
            </text>
            <rect x="695" y={y + 10} width="76" height="20" rx="6" fill={statusBg} />
            <text x="733" y={y + 24} fontFamily="sans-serif" fontSize="10" fontWeight="600" fill={statusColor} textAnchor="middle">
              {status}
            </text>
            <text x="860" y={y + 25} fontFamily="sans-serif" fontSize="12" fontWeight="600" fill="#111827">
              {amount}
            </text>
            <text x="1020" y={y + 25} fontFamily="sans-serif" fontSize="12" fill="#6B7280">
              {date}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function OfferEditorMockup() {
  return (
    <svg
      viewBox="0 0 1200 750"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
      aria-hidden="true"
    >
      <rect width="1200" height="750" fill="#F9FAFB" />

      {/* Sidebar */}
      <rect x="0" y="0" width="220" height="750" fill="#111111" />
      <rect x="20" y="20" width="32" height="32" rx="8" fill="#F59E0B" />
      <text x="60" y="42" fontFamily="sans-serif" fontSize="15" fontWeight="700" fill="#FFFFFF">
        Majster.AI
      </text>
      {[
        { label: 'Dashboard', y: 96, active: false },
        { label: 'Projekty', y: 136, active: false },
        { label: 'Klienci', y: 176, active: false },
        { label: 'Oferty', y: 216, active: true },
        { label: 'Finanse', y: 256, active: false },
      ].map(({ label, y, active }) => (
        <g key={label}>
          {active && <rect x="0" y={y - 10} width="220" height="32" fill="#F59E0B" opacity="0.15" />}
          {active && <rect x="0" y={y - 10} width="3" height="32" fill="#F59E0B" />}
          <rect x="20" y={y - 4} width="14" height="14" rx="3" fill={active ? '#F59E0B' : '#4B5563'} />
          <text x="42" y={y + 7} fontFamily="sans-serif" fontSize="13" fill={active ? '#F59E0B' : '#9CA3AF'} fontWeight={active ? '600' : '400'}>
            {label}
          </text>
        </g>
      ))}

      {/* Main content */}
      <rect x="220" y="0" width="980" height="56" fill="#FFFFFF" />
      <rect x="220" y="55" width="980" height="1" fill="#E5E7EB" />
      <text x="244" y="34" fontFamily="sans-serif" fontSize="13" fill="#9CA3AF">Oferty /</text>
      <text x="290" y="34" fontFamily="sans-serif" fontSize="13" fontWeight="600" fill="#111827"> Nowa oferta</text>

      {/* Form card */}
      <rect x="244" y="76" width="600" height="560" rx="12" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="1" />

      {/* Client section */}
      <text x="268" y="108" fontFamily="sans-serif" fontSize="13" fontWeight="600" fill="#111827">Dane klienta</text>
      {/* Name input */}
      <rect x="268" y="118" width="272" height="36" rx="8" fill="#F9FAFB" stroke="#E5E7EB" strokeWidth="1" />
      <text x="280" y="141" fontFamily="sans-serif" fontSize="12" fill="#9CA3AF">Imię i nazwisko klienta</text>
      <text x="284" y="141" fontFamily="sans-serif" fontSize="12" fill="#111827"> Jan Nowak</text>
      {/* Project name input */}
      <rect x="556" y="118" width="272" height="36" rx="8" fill="#F9FAFB" stroke="#E5E7EB" strokeWidth="1" />
      <text x="568" y="141" fontFamily="sans-serif" fontSize="12" fill="#111827">Remont łazienki — Kwiatowa</text>

      {/* Work items section heading */}
      <text x="268" y="180" fontFamily="sans-serif" fontSize="13" fontWeight="600" fill="#111827">Pozycje wyceny</text>
      {/* Table header */}
      <rect x="268" y="190" width="552" height="28" rx="6" fill="#F3F4F6" />
      {[
        { label: 'Opis pracy / materiału', x: 278 },
        { label: 'Ilość', x: 488 },
        { label: 'J.m.', x: 532 },
        { label: 'Cena netto', x: 570 },
        { label: 'Wartość', x: 658 },
      ].map(({ label, x }) => (
        <text key={label} x={x} y={209} fontFamily="sans-serif" fontSize="10" fontWeight="600" fill="#6B7280">
          {label}
        </text>
      ))}

      {/* Line items */}
      {[
        { desc: 'Robocizna — skuwanie starych płytek', qty: '16', unit: 'h', price: '85,00', total: '1 360,00' },
        { desc: 'Robocizna — układanie nowych płytek', qty: '24', unit: 'h', price: '90,00', total: '2 160,00' },
        { desc: 'Płytki ścienne (60x30 cm)', qty: '18', unit: 'm²', price: '120,00', total: '2 160,00' },
        { desc: 'Materiały montażowe (klej, fuga)', qty: '1', unit: 'kpl', price: '340,00', total: '340,00' },
      ].map(({ desc, qty, unit, price, total }, idx) => {
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
      <text x="492" y="404" fontFamily="sans-serif" fontSize="11" fill="#6B7280">Suma netto:</text>
      <text x="788" y="404" fontFamily="sans-serif" fontSize="11" fill="#111827" textAnchor="end">6 020,00 zł</text>
      <rect x="476" y="413" width="344" height="1" fill="#E5E7EB" />
      <text x="492" y="433" fontFamily="sans-serif" fontSize="11" fill="#6B7280">VAT (23%):</text>
      <text x="788" y="433" fontFamily="sans-serif" fontSize="11" fill="#111827" textAnchor="end">1 384,60 zł</text>
      <rect x="476" y="442" width="344" height="1" fill="#E5E7EB" />
      <text x="492" y="468" fontFamily="sans-serif" fontSize="14" fontWeight="700" fill="#111827">Razem brutto:</text>
      <text x="788" y="468" fontFamily="sans-serif" fontSize="14" fontWeight="700" fill="#F59E0B" textAnchor="end">7 404,60 zł</text>

      {/* AI assist chip */}
      <rect x="268" y="520" width="204" height="36" rx="8" fill="#FFFBEB" stroke="#F59E0B" strokeWidth="1" />
      <rect x="280" y="532" width="12" height="12" rx="3" fill="#F59E0B" />
      <text x="300" y="543" fontFamily="sans-serif" fontSize="12" fontWeight="500" fill="#92400E">Sugestie AI</text>

      {/* Generuj PDF button */}
      <rect x="476" y="516" width="344" height="44" rx="10" fill="#F59E0B" />
      <text x="648" y="543" fontFamily="sans-serif" fontSize="14" fontWeight="700" fill="#000000" textAnchor="middle">
        Generuj PDF i wyślij
      </text>

      {/* Right panel — preview */}
      <rect x="868" y="76" width="332" height="560" rx="12" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="1" />
      <text x="892" y="108" fontFamily="sans-serif" fontSize="13" fontWeight="600" fill="#111827">Podgląd szablonu</text>
      {/* Template thumbnail */}
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

function PdfPreviewMockup() {
  return (
    <svg
      viewBox="0 0 1200 750"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
      aria-hidden="true"
    >
      {/* Page background */}
      <rect width="1200" height="750" fill="#D1D5DB" />

      {/* PDF Toolbar */}
      <rect x="0" y="0" width="1200" height="44" fill="#374151" />
      <text x="24" y="27" fontFamily="sans-serif" fontSize="12" fill="#9CA3AF">wycena_remont_lazienki_jan_nowak.pdf</text>
      <rect x="1100" y="10" width="72" height="24" rx="6" fill="#F59E0B" />
      <text x="1136" y="26" fontFamily="sans-serif" fontSize="11" fontWeight="700" fill="#000000" textAnchor="middle">Pobierz</text>

      {/* PDF Document */}
      <rect x="200" y="60" width="800" height="668" rx="4" fill="#FFFFFF" />

      {/* Document header */}
      <rect x="200" y="60" width="800" height="80" rx="4" fill="#111111" />
      {/* Logo area */}
      <rect x="224" y="76" width="36" height="36" rx="8" fill="#F59E0B" />
      <text x="268" y="95" fontFamily="sans-serif" fontSize="16" fontWeight="700" fill="#FFFFFF">Majster.AI</text>
      <text x="268" y="112" fontFamily="sans-serif" fontSize="10" fill="#9CA3AF">Profesjonalne usługi remontowe</text>
      {/* Document label */}
      <text x="976" y="95" fontFamily="sans-serif" fontSize="18" fontWeight="800" fill="#FFFFFF" textAnchor="end">WYCENA PRAC</text>
      <text x="976" y="112" fontFamily="sans-serif" fontSize="10" fill="#F59E0B" textAnchor="end">Nr: 2026/04/031</text>

      {/* Two-column info row */}
      <rect x="224" y="158" width="350" height="88" rx="8" fill="#F9FAFB" stroke="#E5E7EB" strokeWidth="1" />
      <text x="240" y="178" fontFamily="sans-serif" fontSize="10" fontWeight="600" fill="#6B7280">WYKONAWCA</text>
      <text x="240" y="196" fontFamily="sans-serif" fontSize="12" fontWeight="600" fill="#111827">Marek Kowalski — Usługi Remontowe</text>
      <text x="240" y="212" fontFamily="sans-serif" fontSize="11" fill="#6B7280">ul. Budowlana 12, 00-001 Warszawa</text>
      <text x="240" y="228" fontFamily="sans-serif" fontSize="11" fill="#6B7280">NIP: 123-456-78-90</text>

      <rect x="626" y="158" width="350" height="88" rx="8" fill="#FFFBEB" stroke="#FDE68A" strokeWidth="1" />
      <text x="642" y="178" fontFamily="sans-serif" fontSize="10" fontWeight="600" fill="#92400E">KLIENT</text>
      <text x="642" y="196" fontFamily="sans-serif" fontSize="12" fontWeight="600" fill="#111827">Jan Nowak</text>
      <text x="642" y="212" fontFamily="sans-serif" fontSize="11" fill="#6B7280">ul. Kwiatowa 5, 02-532 Warszawa</text>
      <text x="642" y="228" fontFamily="sans-serif" fontSize="11" fill="#6B7280">jan.nowak@email.pl</text>

      {/* Meta row */}
      <text x="224" y="270" fontFamily="sans-serif" fontSize="11" fill="#6B7280">Data wystawienia:</text>
      <text x="340" y="270" fontFamily="sans-serif" fontSize="11" fontWeight="600" fill="#111827">12.04.2026</text>
      <text x="480" y="270" fontFamily="sans-serif" fontSize="11" fill="#6B7280">Ważna do:</text>
      <text x="548" y="270" fontFamily="sans-serif" fontSize="11" fontWeight="600" fill="#111827">30.04.2026</text>

      {/* Items table heading */}
      <text x="224" y="302" fontFamily="sans-serif" fontSize="12" fontWeight="700" fill="#111827">Szczegółowy zakres prac</text>

      {/* Table header */}
      <rect x="224" y="312" width="752" height="28" rx="4" fill="#111827" />
      {[
        { label: 'Lp.', x: 232 },
        { label: 'Opis pozycji', x: 260 },
        { label: 'Ilość', x: 600 },
        { label: 'J.m.', x: 652 },
        { label: 'Cena netto', x: 700 },
        { label: 'Wartość', x: 800 },
      ].map(({ label, x }) => (
        <text key={label} x={x} y={331} fontFamily="sans-serif" fontSize="10" fontWeight="600" fill="#FFFFFF">
          {label}
        </text>
      ))}

      {/* Table rows */}
      {[
        { no: '1', desc: 'Robocizna — skuwanie starych płytek (łazienka 6 m²)', qty: '16', unit: 'h', price: '85,00', total: '1 360,00' },
        { no: '2', desc: 'Robocizna — układanie nowych płytek podłogowych', qty: '24', unit: 'h', price: '90,00', total: '2 160,00' },
        { no: '3', desc: 'Płytki ścienne ceramiczne 60×30 cm (kolor biały)', qty: '18', unit: 'm²', price: '120,00', total: '2 160,00' },
        { no: '4', desc: 'Materiały montażowe (klej do płytek, fuga biała)', qty: '1', unit: 'kpl', price: '340,00', total: '340,00' },
      ].map(({ no, desc, qty, unit, price, total }, idx) => {
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

      {/* Summary block */}
      <rect x="624" y="480" width="352" height="120" rx="8" fill="#F9FAFB" stroke="#E5E7EB" strokeWidth="1" />
      <text x="640" y="504" fontFamily="sans-serif" fontSize="11" fill="#6B7280">Suma netto:</text>
      <text x="960" y="504" fontFamily="sans-serif" fontSize="11" fill="#111827" textAnchor="end">6 020,00 zł</text>
      <rect x="624" y="514" width="352" height="1" fill="#E5E7EB" />
      <text x="640" y="534" fontFamily="sans-serif" fontSize="11" fill="#6B7280">VAT (23%):</text>
      <text x="960" y="534" fontFamily="sans-serif" fontSize="11" fill="#111827" textAnchor="end">1 384,60 zł</text>
      <rect x="624" y="544" width="352" height="1" fill="#E5E7EB" />
      <rect x="624" y="548" width="352" height="44" rx="0" fill="#F59E0B" opacity="0.08" />
      <text x="640" y="575" fontFamily="sans-serif" fontSize="14" fontWeight="700" fill="#111827">Do zapłaty (brutto):</text>
      <text x="960" y="575" fontFamily="sans-serif" fontSize="16" fontWeight="800" fill="#92400E" textAnchor="end">7 404,60 zł</text>

      {/* Notes */}
      <text x="224" y="504" fontFamily="sans-serif" fontSize="10" fill="#6B7280">Uwagi:</text>
      <text x="224" y="520" fontFamily="sans-serif" fontSize="10" fill="#374151">Wycena obejmuje wszystkie wskazane prace. Materiały wg. specyfikacji.</text>
      <text x="224" y="536" fontFamily="sans-serif" fontSize="10" fill="#374151">Termin realizacji: ok. 5 dni roboczych od wpłaty zaliczki.</text>

      {/* Signature line */}
      <rect x="224" y="610" width="200" height="1" fill="#D1D5DB" />
      <text x="324" y="628" fontFamily="sans-serif" fontSize="9" fill="#9CA3AF" textAnchor="middle">Podpis wykonawcy</text>
      <rect x="776" y="610" width="200" height="1" fill="#D1D5DB" />
      <text x="876" y="628" fontFamily="sans-serif" fontSize="9" fill="#9CA3AF" textAnchor="middle">Podpis klienta / pieczęć</text>

      {/* Footer bar */}
      <text x="600" y="716" fontFamily="sans-serif" fontSize="9" fill="#9CA3AF" textAnchor="middle">
        Wygenerowano przez Majster.AI · app.majster.ai · Strona 1 z 1
      </text>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Section component
// ---------------------------------------------------------------------------

const TABS = [
  {
    key: 'dashboard' as const,
    icon: LayoutDashboard,
    urlHint: 'app.majster.ai/dashboard',
    Mockup: DashboardMockup,
  },
  {
    key: 'editor' as const,
    icon: FileText,
    urlHint: 'app.majster.ai/oferty/nowa',
    Mockup: OfferEditorMockup,
  },
  {
    key: 'pdf' as const,
    icon: Eye,
    urlHint: 'app.majster.ai/pdf-podglad',
    Mockup: PdfPreviewMockup,
  },
] as const;

type TabKey = (typeof TABS)[number]['key'];

export function ProductScreenshotsSection() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');

  const active = TABS.find((tab) => tab.key === activeTab) ?? TABS[0];

  return (
    <section
      className="py-20 md:py-28 bg-white dark:bg-brand-dark"
      aria-labelledby="screenshots-heading"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
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

        {/* Tab navigation */}
        <div
          className="flex flex-wrap gap-2 justify-center mb-8"
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
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-amber focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-brand-dark ${
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

        {/* Screenshot frame */}
        <div
          id={`screenshot-panel-${active.key}`}
          role="tabpanel"
          className="rounded-2xl overflow-hidden border border-gray-200 dark:border-brand-border shadow-2xl shadow-gray-900/10 dark:shadow-black/40"
        >
          {/* Browser chrome */}
          <div className="flex items-center gap-2 px-4 py-3 bg-gray-100 dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-[#2a2a2a]">
            <span className="w-3 h-3 rounded-full bg-red-400/80 shrink-0" aria-hidden="true" />
            <span className="w-3 h-3 rounded-full bg-yellow-400/80 shrink-0" aria-hidden="true" />
            <span className="w-3 h-3 rounded-full bg-green-400/80 shrink-0" aria-hidden="true" />
            <div className="flex-1 mx-3 bg-white dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#3a3a3a] rounded-md px-3 py-1 text-xs text-gray-400 dark:text-neutral-600 truncate select-none">
              {active.urlHint}
            </div>
          </div>

          {/* Actual screenshot / mockup */}
          <div className="aspect-[16/10] bg-[#F9FAFB] overflow-hidden">
            <active.Mockup />
          </div>
        </div>

        {/* Caption */}
        <p className="mt-4 text-center text-sm text-gray-500 dark:text-neutral-500">
          {t(`landing.screenshots.${active.key}.caption`)}
        </p>
      </div>
    </section>
  );
}
