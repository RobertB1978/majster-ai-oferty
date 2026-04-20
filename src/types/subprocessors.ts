export type SubprocessorStatus = 'active' | 'inactive' | 'planned';

export type SubprocessorCategory = 'infrastructure' | 'email' | 'monitoring' | 'payments' | 'ai' | 'analytics' | string;

export interface Subprocessor {
  id: string;
  slug: string;
  name: string;
  category: SubprocessorCategory;
  purpose: string;
  data_categories: string | null;
  location: string | null;
  transfer_basis: string | null;
  dpa_url: string | null;
  privacy_url: string | null;
  display_order: number;
}
