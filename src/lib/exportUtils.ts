import { QuotePosition } from '@/hooks/useQuotes';
import { toast } from 'sonner';

interface ExportQuoteData {
  projectName: string;
  positions: QuotePosition[];
  summaryMaterials: number;
  summaryLabor: number;
  marginPercent: number;
  total: number;
}

export async function exportQuoteToExcel(data: ExportQuoteData) {
  const { projectName, positions, summaryMaterials, summaryLabor, marginPercent, total } = data;

  // Dynamic import to avoid 939KB static bundle
  const ExcelJS = (await import('exceljs')).default;

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

export function exportQuoteToCSV(data: ExportQuoteData) {
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
  maxLimit: number = 500
) {
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
      new Date(p.created_at).toLocaleDateString('pl-PL'),
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
