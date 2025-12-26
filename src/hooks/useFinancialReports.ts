import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface FinancialReport {
  id: string;
  user_id: string;
  report_month: string;
  total_revenue: number;
  total_costs: number;
  gross_margin: number;
  project_count: number;
  report_data: unknown;
  created_at: string;
}

export function useFinancialReports() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['financial_reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('financial_reports')
        .select('*')
        .eq('user_id', user!.id)
        .order('report_month', { ascending: false });

      if (error) throw error;
      return data as FinancialReport[];
    },
    enabled: !!user,
  });
}

export function useFinancialSummary() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['financial_summary'],
    queryFn: async () => {
      // Get all quotes (revenue)
      const { data: quotes } = await supabase
        .from('quotes')
        .select('total, created_at, project_id')
        .eq('user_id', user!.id);

      // Get all purchase costs
      const { data: costs } = await supabase
        .from('purchase_costs')
        .select('gross_amount, created_at, project_id')
        .eq('user_id', user!.id);

      // Get projects
      const { data: projects } = await supabase
        .from('projects')
        .select('id, project_name, status, created_at')
        .eq('user_id', user!.id);

      const totalRevenue = (quotes || []).reduce((sum, q) => sum + Number(q.total), 0);
      const totalCosts = (costs || []).reduce((sum, c) => sum + Number(c.gross_amount), 0);
      const grossMargin = totalRevenue - totalCosts;
      const marginPercent = totalRevenue > 0 ? (grossMargin / totalRevenue) * 100 : 0;

      // Monthly breakdown
      const monthlyData: Record<string, { revenue: number; costs: number }> = {};
      
      (quotes || []).forEach(q => {
        const month = q.created_at.substring(0, 7);
        if (!monthlyData[month]) monthlyData[month] = { revenue: 0, costs: 0 };
        monthlyData[month].revenue += Number(q.total);
      });

      (costs || []).forEach(c => {
        const month = c.created_at.substring(0, 7);
        if (!monthlyData[month]) monthlyData[month] = { revenue: 0, costs: 0 };
        monthlyData[month].costs += Number(c.gross_amount);
      });

      const monthly = Object.entries(monthlyData)
        .map(([month, data]) => ({
          month,
          revenue: data.revenue,
          costs: data.costs,
          margin: data.revenue - data.costs
        }))
        .sort((a, b) => a.month.localeCompare(b.month));

      return {
        totalRevenue,
        totalCosts,
        grossMargin,
        marginPercent,
        projectCount: projects?.length || 0,
        monthly,
        projects: projects || [],
        quotes: quotes || [],
        costs: costs || []
      };
    },
    enabled: !!user,
  });
}

export function useAIFinancialAnalysis() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      // Get data for analysis
      const { data: projects } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user!.id);

      const { data: quotes } = await supabase
        .from('quotes')
        .select('*')
        .eq('user_id', user!.id);

      const { data: costs } = await supabase
        .from('purchase_costs')
        .select('*')
        .eq('user_id', user!.id);

      const { data, error } = await supabase.functions.invoke('finance-ai-analysis', {
        body: {
          projectsData: projects,
          costsData: costs,
          revenueData: quotes
        }
      });

      if (error) throw error;
      return data.analysis;
    },
    onSuccess: () => {
      toast.success('Analiza AI zakończona');
    },
    onError: () => {
      toast.error('Błąd analizy AI');
    },
  });
}
