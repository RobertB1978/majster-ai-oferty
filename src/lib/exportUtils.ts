import { QuotePosition } from '@/hooks/useQuotes';
import { toast } from 'sonner';
import { formatDate } from '@/lib/formatters';

interface ExportQuoteData {
  projectName: string;
  positions: QuotePosition[];
  summaryMaterials: number;
  summaryLabor: number;
  marginPercent: number;
  total: number;
}

export async function exportQuoteToExcel(data: ExportQuoteData): Promise<void> {
  const { projectName, positions, summaryMaterials, summaryLabor, marginPercent, total } = data;

  // Truly lazy import — the 937 kB ExcelJS chunk is loaded only when the user
  // actually triggers an Excel export, not on initial page load.
  const mod = await import('exceljs');
  const ExcelJS = mod.default ?? mod;

  // Create workbook and worksheet
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Wycena');

  // Set column definitions with widths
  worksheet.columns = [
    { header: 'Lp.', key: 'lp', width: 5 },
    { header: 'Nazwa', key: 'nazwa', width: 40 },
    { header: 'Ilość', key: 'ilosc', width: 10 },
    { header: 'Jednostka', key: 'jednostka', width: 12 },
    { header: 'Cena jedn. (zł)', key: 'cena', width: 15 },
    { header: 'Suma (zł)', key: 'suma', width: 15 },
    { header: 'Kategoria', key: 'kategoria', width: 12 },
  ];

  // Add position rows with sanitized data
  positions.forEach((pos, idx) => {
    // Whitelist only safe properties to prevent prototype pollution
    worksheet.addRow({
      lp: idx + 1,
      nazwa: String(pos.name),
      ilosc: Number(pos.qty),
      jednostka: String(pos.unit),
      cena: Number(pos.price),
      suma: Number(pos.qty) * Number(pos.price),
      kategoria: String(pos.category),
    });
  });

  // Add summary section
  const _summaryStartRow = positions.length + 3;
  worksheet.addRow([]);
  worksheet.addRow(['', '', '', '', 'Suma materiałów:', summaryMaterials]);
  worksheet.addRow(['', '', '', '', 'Suma robocizny:', summaryLabor]);
  worksheet.addRow(['', '', '', '', `Marża (${marginPercent}%):`, (summaryMaterials + summaryLabor) * marginPercent / 100]);
  worksheet.addRow(['', '', '', '', 'RAZEM:', total]);

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();

  // Create blob and download
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const url = URL.createObjectURL(blob);

  const date = new Date().toISOString().split('T')[0];
  const sanitizedName = projectName.replace(/[^a-zA-Z0-9ąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s-]/g, '').trim();
  const filename = `wycena_${sanitizedName}_${date}.xlsx`;

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportQuoteToCSV(data: ExportQuoteData): void {
  const { projectName, positions, summaryMaterials, summaryLabor, marginPercent, total } = data;

  const rows = [
    ['Lp.', 'Nazwa', 'Ilość', 'Jednostka', 'Cena jedn. (zł)', 'Suma (zł)', 'Kategoria'],
    ...positions.map((pos, idx) => [
      idx + 1,
      pos.name,
      pos.qty,
      pos.unit,
      pos.price,
      pos.qty * pos.price,
      pos.category,
    ]),
    [],
    ['', '', '', '', 'Suma materiałów:', summaryMaterials],
    ['', '', '', '', 'Suma robocizny:', summaryLabor],
    ['', '', '', '', `Marża (${marginPercent}%):`, (summaryMaterials + summaryLabor) * marginPercent / 100],
    ['', '', '', '', 'RAZEM:', total],
  ];

  const csvContent = rows.map(row => row.map(cell => 
    typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell
  ).join(',')).join('\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const date = new Date().toISOString().split('T')[0];
  const sanitizedName = projectName.replace(/[^a-zA-Z0-9ąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s-]/g, '').trim();
  const filename = `wycena_${sanitizedName}_${date}.csv`;

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

interface ProjectForExport {
  project_name: string;
  status: string;
  created_at: string;
  clients?: { name: string } | null;
  total?: number;
}

/**
 * Export projects to CSV with subscription-based limits
 * @param projects - Array of projects to export
 * @param maxLimit - Maximum number of records (based on subscription plan)
 */
export function exportProjectsToCSV(
  projects: ProjectForExport[],
  maxLimit: number = 500,
  locale?: string,
): void {
  if (projects.length > maxLimit) {
    const isUnlimited = maxLimit === Infinity;

    if (!isUnlimited) {
      toast.warning(
        `Eksport ograniczony do ${maxLimit} rekordów`,
        {
          description: `Próbujesz wyeksportować ${projects.length} projektów. Twój plan pozwala na eksport maksymalnie ${maxLimit} rekordów. Upgrade do wyższego planu, aby zwiększyć limit.`,
          duration: 6000,
        }
      );
    }
  }

  // Take only allowed number of projects
  const projectsToExport = maxLimit === Infinity
    ? projects
    : projects.slice(0, maxLimit);

  const rows = [
    ['Nazwa projektu', 'Klient', 'Status', 'Data utworzenia', 'Kwota (zł)'],
    ...projectsToExport.map(p => [
      p.project_name,
      p.clients?.name || '-',
      p.status,
      formatDate(p.created_at, locale),
      p.total?.toFixed(2) || '-',
    ]),
  ];

  const csvContent = rows.map(row => row.map(cell => 
    typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell
  ).join(',')).join('\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const date = new Date().toISOString().split('T')[0];
  const filename = `projekty_${date}.csv`;

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ── Finance Excel export ──────────────────────────────────────────────────────

export interface FinanceSummaryExport {
  totalRevenue: number;
  totalCosts: number;
  grossMargin: number;
  marginPercent: number;
  projectCount: number;
  monthly: Array<{ month: string; revenue: number; costs: number; margin: number }>;
  dateFrom?: string;
  dateTo?: string;
}

export async function exportFinanceToExcel(data: FinanceSummaryExport): Promise<void> {
  const { totalRevenue, totalCosts, grossMargin, marginPercent, projectCount, monthly, dateFrom, dateTo } = data;

  const mod = await import('exceljs');
  const ExcelJS = mod.default ?? mod;
  const workbook = new ExcelJS.Workbook();

  // Sheet 1: Summary KPIs
  const summarySheet = workbook.addWorksheet('Podsumowanie');
  summarySheet.columns = [
    { header: 'Wskaźnik', key: 'metric', width: 30 },
    { header: 'Wartość', key: 'value', width: 22 },
  ];
  const summaryRows: Array<{ metric: string; value: string | number }> = [
    { metric: 'Całkowite przychody (zł)', value: Number(totalRevenue) },
    { metric: 'Całkowite koszty (zł)', value: Number(totalCosts) },
    { metric: 'Marża brutto (zł)', value: Number(grossMargin) },
    { metric: 'Marża %', value: `${marginPercent.toFixed(1)}%` },
    { metric: 'Liczba projektów', value: Number(projectCount) },
  ];
  if (dateFrom || dateTo) {
    summaryRows.push({ metric: 'Zakres dat', value: `${dateFrom ?? 'początek'} – ${dateTo ?? 'teraz'}` });
  }
  summaryRows.forEach(row => summarySheet.addRow(row));

  // Sheet 2: Monthly breakdown
  const monthlySheet = workbook.addWorksheet('Miesięczne');
  monthlySheet.columns = [
    { header: 'Miesiąc', key: 'month', width: 12 },
    { header: 'Przychody (zł)', key: 'revenue', width: 18 },
    { header: 'Koszty (zł)', key: 'costs', width: 15 },
    { header: 'Marża (zł)', key: 'margin', width: 15 },
  ];
  monthly.forEach(row => {
    monthlySheet.addRow({
      month: String(row.month),
      revenue: Number(row.revenue),
      costs: Number(row.costs),
      margin: Number(row.margin),
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const exportDate = new Date().toISOString().split('T')[0];
  const financeFilename = `finanse_${exportDate}.xlsx`;

  const xlsxLink = document.createElement('a');
  xlsxLink.href = url;
  xlsxLink.download = financeFilename;
  document.body.appendChild(xlsxLink);
  xlsxLink.click();
  document.body.removeChild(xlsxLink);
  URL.revokeObjectURL(url);
}

// ── Finance PDF export ────────────────────────────────────────────────────────

export async function exportFinanceToPdf(data: FinanceSummaryExport): Promise<void> {
  const { totalRevenue, totalCosts, grossMargin, marginPercent, projectCount, monthly, dateFrom, dateTo } = data;

  const { jsPDF } = await import('jspdf');
  await import('jspdf-autotable');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // Header
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('Raport finansowy', 20, 30);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  const periodText = dateFrom || dateTo
    ? `Okres: ${dateFrom ?? 'początek'} – ${dateTo ?? 'teraz'}`
    : 'Okres: cały czas';
  doc.text(periodText, 20, 40);
  doc.text(`Wygenerowano: ${new Date().toLocaleDateString('pl-PL')}`, 20, 47);
  doc.setTextColor(0, 0, 0);

  doc.setLineWidth(0.5);
  doc.line(20, 53, 190, 53);

  // KPI summary table
  (doc as unknown as { autoTable: (opts: unknown) => void }).autoTable({
    startY: 58,
    head: [['Wskaźnik', 'Wartość']],
    body: [
      ['Całkowite przychody', `${totalRevenue.toLocaleString('pl-PL')} zł`],
      ['Całkowite koszty', `${totalCosts.toLocaleString('pl-PL')} zł`],
      ['Marża brutto', `${grossMargin.toLocaleString('pl-PL')} zł`],
      ['Marża %', `${marginPercent.toFixed(1)}%`],
      ['Liczba projektów', String(projectCount)],
    ],
    styles: { fontSize: 10, cellPadding: 3 },
    headStyles: { fillColor: [34, 197, 94], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 1: { halign: 'right' } },
    margin: { left: 20, right: 20 },
  });

  // Monthly breakdown table
  const lastTable = (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable;
  const finalY = lastTable?.finalY ?? 120;

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('Podział miesięczny', 20, finalY + 12);

  (doc as unknown as { autoTable: (opts: unknown) => void }).autoTable({
    startY: finalY + 18,
    head: [['Miesiąc', 'Przychody (zł)', 'Koszty (zł)', 'Marża (zł)']],
    body: monthly.map(row => [
      row.month,
      row.revenue.toLocaleString('pl-PL'),
      row.costs.toLocaleString('pl-PL'),
      row.margin.toLocaleString('pl-PL'),
    ]),
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [34, 197, 94], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
    margin: { left: 20, right: 20 },
  });

  // Footer on every page
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Majster.AI — Raport finansowy | Strona ${i} z ${pageCount}`, 20, 290);
    doc.setTextColor(0, 0, 0);
  }

  const exportDate = new Date().toISOString().split('T')[0];
  doc.save(`finanse_${exportDate}.pdf`);
}
