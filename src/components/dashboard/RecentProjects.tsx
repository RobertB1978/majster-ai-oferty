import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { pl, enUS, uk } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight, FolderOpen, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { STATUS_CONFIG } from '@/data/statusConfig';

interface Project {
  id: string;
  /** v2_projects uses `title` (aligned with DashboardProject interface) */
  title: string;
  status: string;
  created_at: string;
  clients?: { name: string } | null;
}

interface RecentProjectsProps {
  projects: Project[];
  isLoading: boolean;
}


const dateLocales: Record<string, Locale> = { pl, en: enUS, uk };

/** Avatar initial from client name */
function ClientAvatar({ name }: { name: string }) {
  const initial = name.charAt(0).toUpperCase();
  // Deterministic color based on first char
  const colors = [
    'bg-primary text-white',
    'bg-success text-white',
    'bg-warning text-white',
    'bg-info text-white',
    'bg-accent text-accent-foreground',
  ];
  const colorIdx = name.charCodeAt(0) % colors.length;

  return (
    <div
      className={cn(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold shadow-sm',
        colors[colorIdx]
      )}
    >
      {initial}
    </div>
  );
}

export function RecentProjects({ projects, isLoading }: RecentProjectsProps) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const dateLocale = dateLocales[i18n.language] ?? pl;

  return (
    <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base font-semibold">
              {t('dashboard.recentProjects', 'Ostatnie projekty')}
            </CardTitle>
            <CardDescription className="text-xs">
              {t('dashboard.yourLatestProjects', 'Twoje najnowsze projekty')}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/app/projects')}
            className="text-xs gap-1 hover:text-primary"
          >
            {t('dashboard.viewAll', 'Zobacz wszystkie')}
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </CardHeader>
        <CardContent className="pt-0 pb-2">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 px-1 py-2">
                  <Skeleton className="h-9 w-9 rounded-xl" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-40" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                  <Skeleton className="h-5 w-24 rounded-full" />
                </div>
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted mb-3">
                <FolderOpen className="h-7 w-7 text-muted-foreground/60" />
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                {t('dashboard.noProjects')}
              </p>
              <Button
                variant="link"
                onClick={() => navigate('/app/projects/new')}
                className="text-sm p-0 h-auto text-primary"
              >
                {t('dashboard.createFirstProject')}
              </Button>
            </div>
          ) : (
            <AnimatePresence>
              <div className="divide-y divide-border/60">
                {projects.map((project, index) => {
                  const statusCfg = STATUS_CONFIG[project.status] ?? STATUS_CONFIG['Nowy'];
                  const clientName = project.clients?.name || t('dashboard.unknownClient', 'Nieznany klient');

                  return (
                    <motion.div
                      key={project.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.06, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                      className="group flex items-center gap-3 px-1 py-3 cursor-pointer rounded-lg hover:bg-muted/40 transition-colors duration-150 -mx-1"
                      onClick={() => navigate(`/app/projects/${project.id}`)}
                    >
                      {/* Client avatar */}
                      <ClientAvatar name={clientName} />

                      {/* Project info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate leading-tight group-hover:text-primary transition-colors">
                          {project.title}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-xs text-muted-foreground truncate">
                            {clientName}
                          </span>
                          <span className="text-muted-foreground/40 text-xs">·</span>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {formatDistanceToNow(new Date(project.created_at), {
                              addSuffix: true,
                              locale: dateLocale,
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Status badge */}
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge
                          variant="outline"
                          className={cn('text-[11px] font-medium px-2 py-0.5 border', statusCfg.badge)}
                        >
                          <span className={cn('mr-1.5 h-1.5 w-1.5 rounded-full inline-block', statusCfg.dot)} />
                          {project.status}
                        </Badge>

                        {/* Arrow (hover only) */}
                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/0 group-hover:text-muted-foreground/50 transition-all duration-200 shrink-0" />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </AnimatePresence>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
