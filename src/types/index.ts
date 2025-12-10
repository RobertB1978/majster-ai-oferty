export interface User {
  id: string;
  email: string;
  created_at: string;
}

export type ProjectStatus = 'Nowy' | 'Wycena w toku' | 'Oferta wysłana' | 'Zaakceptowany';
export type ProjectPriority = 'low' | 'normal' | 'high';

export interface Project {
  id: string;
  user_id: string;
  client_id: string;
  project_name: string;
  status: ProjectStatus;
  priority?: ProjectPriority;
  start_date?: string;
  end_date?: string;
  created_at: string;
}

export interface QuotePosition {
  id: string;
  name: string;
  qty: number;
  unit: string;
  price: number;
  category: 'Materiał' | 'Robocizna';
  notes?: string;
}

export interface Quote {
  id: string;
  project_id: string;
  user_id: string;
  positions: QuotePosition[];
  summary_materials: number;
  summary_labor: number;
  margin_percent: number;
  total: number;
  created_at: string;
}

export interface PdfData {
  id: string;
  project_id: string;
  user_id: string;
  version: 'standard' | 'premium';
  title: string;
  offer_text: string;
  terms: string;
  deadline_text: string;
  created_at: string;
}
