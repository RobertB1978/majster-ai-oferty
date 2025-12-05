import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Client, Project, Quote, PdfData, QuotePosition } from '@/types';

interface DataContextType {
  clients: Client[];
  projects: Project[];
  quotes: Quote[];
  pdfData: PdfData[];
  addClient: (client: Omit<Client, 'id' | 'user_id' | 'created_at'>) => Client;
  updateClient: (id: string, client: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  addProject: (project: Omit<Project, 'id' | 'user_id' | 'created_at'>) => Project;
  updateProject: (id: string, project: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  getProjectById: (id: string) => Project | undefined;
  getClientById: (id: string) => Client | undefined;
  getQuoteByProjectId: (projectId: string) => Quote | undefined;
  saveQuote: (projectId: string, positions: QuotePosition[], marginPercent: number) => Quote;
  getPdfDataByProjectId: (projectId: string) => PdfData | undefined;
  savePdfData: (projectId: string, data: Omit<PdfData, 'id' | 'project_id' | 'user_id' | 'created_at'>) => PdfData;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const initialClients: Client[] = [
  {
    id: '1',
    user_id: '1',
    name: 'Jan Kowalski',
    phone: '+48 123 456 789',
    email: 'jan.kowalski@email.pl',
    address: 'ul. Warszawska 15, 00-001 Warszawa',
    created_at: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    user_id: '1',
    name: 'Firma Budowlana XYZ Sp. z o.o.',
    phone: '+48 987 654 321',
    email: 'kontakt@xyz-budowlana.pl',
    address: 'ul. Przemysłowa 42, 02-200 Kraków',
    created_at: '2024-02-01T14:30:00Z',
  },
];

const initialProjects: Project[] = [
  {
    id: '1',
    user_id: '1',
    client_id: '1',
    project_name: 'Remont łazienki',
    status: 'Wycena w toku',
    created_at: '2024-03-01T09:00:00Z',
  },
  {
    id: '2',
    user_id: '1',
    client_id: '2',
    project_name: 'Instalacja elektryczna - hala magazynowa',
    status: 'Oferta wysłana',
    created_at: '2024-03-10T11:00:00Z',
  },
];

const initialQuotes: Quote[] = [
  {
    id: '1',
    project_id: '1',
    user_id: '1',
    positions: [
      { id: '1', name: 'Płytki ceramiczne 60x60', qty: 25, unit: 'm²', price: 89, category: 'Materiał' },
      { id: '2', name: 'Klej do płytek', qty: 5, unit: 'worek', price: 45, category: 'Materiał' },
      { id: '3', name: 'Układanie płytek', qty: 25, unit: 'm²', price: 120, category: 'Robocizna' },
    ],
    summary_materials: 2450,
    summary_labor: 3000,
    margin_percent: 15,
    total: 6267.5,
    created_at: '2024-03-02T10:00:00Z',
  },
];

export function DataProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [quotes, setQuotes] = useState<Quote[]>(initialQuotes);
  const [pdfData, setPdfData] = useState<PdfData[]>([]);

  const addClient = (clientData: Omit<Client, 'id' | 'user_id' | 'created_at'>): Client => {
    const newClient: Client = {
      ...clientData,
      id: crypto.randomUUID(),
      user_id: '1',
      created_at: new Date().toISOString(),
    };
    setClients(prev => [...prev, newClient]);
    return newClient;
  };

  const updateClient = (id: string, clientData: Partial<Client>) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...clientData } : c));
  };

  const deleteClient = (id: string) => {
    setClients(prev => prev.filter(c => c.id !== id));
  };

  const addProject = (projectData: Omit<Project, 'id' | 'user_id' | 'created_at'>): Project => {
    const newProject: Project = {
      ...projectData,
      id: crypto.randomUUID(),
      user_id: '1',
      created_at: new Date().toISOString(),
    };
    setProjects(prev => [...prev, newProject]);
    return newProject;
  };

  const updateProject = (id: string, projectData: Partial<Project>) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...projectData } : p));
  };

  const deleteProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
  };

  const getProjectById = (id: string) => {
    const project = projects.find(p => p.id === id);
    if (project) {
      const client = clients.find(c => c.id === project.client_id);
      return { ...project, client };
    }
    return undefined;
  };

  const getClientById = (id: string) => clients.find(c => c.id === id);

  const getQuoteByProjectId = (projectId: string) => quotes.find(q => q.project_id === projectId);

  const saveQuote = (projectId: string, positions: QuotePosition[], marginPercent: number): Quote => {
    const summaryMaterials = positions
      .filter(p => p.category === 'Materiał')
      .reduce((sum, p) => sum + p.qty * p.price, 0);
    const summaryLabor = positions
      .filter(p => p.category === 'Robocizna')
      .reduce((sum, p) => sum + p.qty * p.price, 0);
    const subtotal = summaryMaterials + summaryLabor;
    const total = subtotal * (1 + marginPercent / 100);

    const existingQuote = quotes.find(q => q.project_id === projectId);
    
    const quote: Quote = {
      id: existingQuote?.id || crypto.randomUUID(),
      project_id: projectId,
      user_id: '1',
      positions,
      summary_materials: summaryMaterials,
      summary_labor: summaryLabor,
      margin_percent: marginPercent,
      total,
      created_at: existingQuote?.created_at || new Date().toISOString(),
    };

    if (existingQuote) {
      setQuotes(prev => prev.map(q => q.id === quote.id ? quote : q));
    } else {
      setQuotes(prev => [...prev, quote]);
    }

    return quote;
  };

  const getPdfDataByProjectId = (projectId: string) => pdfData.find(p => p.project_id === projectId);

  const savePdfData = (projectId: string, data: Omit<PdfData, 'id' | 'project_id' | 'user_id' | 'created_at'>): PdfData => {
    const existingPdf = pdfData.find(p => p.project_id === projectId);
    
    const pdf: PdfData = {
      ...data,
      id: existingPdf?.id || crypto.randomUUID(),
      project_id: projectId,
      user_id: '1',
      created_at: existingPdf?.created_at || new Date().toISOString(),
    };

    if (existingPdf) {
      setPdfData(prev => prev.map(p => p.id === pdf.id ? pdf : p));
    } else {
      setPdfData(prev => [...prev, pdf]);
    }

    return pdf;
  };

  return (
    <DataContext.Provider value={{
      clients,
      projects,
      quotes,
      pdfData,
      addClient,
      updateClient,
      deleteClient,
      addProject,
      updateProject,
      deleteProject,
      getProjectById,
      getClientById,
      getQuoteByProjectId,
      saveQuote,
      getPdfDataByProjectId,
      savePdfData,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
