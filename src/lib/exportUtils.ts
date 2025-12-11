import * as XLSX from 'xlsx';
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

export function exportQuoteToExcel(data: ExportQuoteData) {
  const { projectName, positions, summaryMaterials, summaryLabor, marginPercent, total } = data;
  
  // Prepare positions data
  const positionsData = positions.map((pos, idx) => ({
    'Lp.': idx + 1,
    'Nazwa': pos.name,
    'Ilość': pos.qty,
    'Jednostka': pos.unit,
    'Cena jedn. (zł)': pos.price,
    'Suma (zł)': pos.qty * pos.price,
    'Kategoria': pos.category,
  }));

  // Create worksheet from positions
  const ws = XLSX.utils.json_to_sheet(positionsData);

  // Add summary rows
  const summaryStartRow = positionsData.length + 3;
  XLSX.utils.sheet_add_aoa(ws, [
    [],
    ['', '', '', '', 'Suma materiałów:', summaryMaterials],
    ['', '', '', '', 'Suma robocizny:', summaryLabor],
    ['', '', '', '', `Marża (${marginPercent}%):`, (summaryMaterials + summaryLabor) * marginPercent / 100],
    ['', '', '', '', 'RAZEM:', total],
  ], { origin: `A${summaryStartRow}` });

  // Set column widths
  ws['!cols'] = [
    { wch: 5 },   // Lp.
    { wch: 40 },  // Nazwa
    { wch: 10 },  // Ilość
    { wch: 12 },  // Jednostka
    { wch: 15 },  // Cena
    { wch: 15 },  // Suma
    { wch: 12 },  // Kategoria
  ];

  // Create workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Wycena');

  // Generate filename with date
  const date = new Date().toISOString().split('T')[0];
  const sanitizedName = projectName.replace(/[^a-zA-Z0-9ąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s-]/g, '').trim();
  const filename = `wycena_${sanitizedName}_${date}.xlsx`;

  // Download
  XLSX.writeFile(wb, filename);
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

export function exportProjectsToCSV(projects: ProjectForExport[]) {
  // Limit to 500 records for free tier performance protection
  const MAX_EXPORT_LIMIT = 500;

  if (projects.length > MAX_EXPORT_LIMIT) {
    toast.warning(
      `Eksport ograniczony do ${MAX_EXPORT_LIMIT} rekordów`,
      {
        description: `Próbujesz wyeksportować ${projects.length} projektów. W planie Free eksport jest ograniczony do ${MAX_EXPORT_LIMIT} rekordów. Upgrade do planu Business, aby usunąć ograniczenia.`,
        duration: 6000,
      }
    );
  }

  // Take only first 500 projects
  const projectsToExport = projects.slice(0, MAX_EXPORT_LIMIT);

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
