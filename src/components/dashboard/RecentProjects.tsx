import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight, FolderOpen } from 'lucide-react';

interface Project {
  id: string;
  project_name: string;
  status: string;
  created_at: string;
  clients?: { name: string } | null;
}

interface RecentProjectsProps {
  projects: Project[];
  isLoading: boolean;
}

const statusColors: Record<string, string> = {
  'Nowy': 'bg-muted text-muted-foreground',
  'Wycena w toku': 'bg-warning/10 text-warning border-warning/20',
  'Oferta wysłana': 'bg-primary/10 text-primary border-primary/20',
  'Zaakceptowany': 'bg-success/10 text-success border-success/20',
};

export function RecentProjects({ projects, isLoading }: RecentProjectsProps) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Ostatnie projekty</CardTitle>
            <CardDescription>Twoje najnowsze projekty</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/projects')}>
            Zobacz wszystkie
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-lg border">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-3 w-[150px]" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FolderOpen className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">Brak projektów</p>
              <Button 
                variant="link" 
                onClick={() => navigate('/projects/new')}
                className="mt-2"
              >
                Utwórz pierwszy projekt
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {projects.map((project, index) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="group flex flex-col gap-3 rounded-lg border border-border bg-card p-4 transition-all hover:shadow-md hover:border-primary/20 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <FolderOpen className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium group-hover:text-primary transition-colors">
                        {project.project_name}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{project.clients?.name || 'Nieznany klient'}</span>
                        <span>•</span>
                        <span>
                          {formatDistanceToNow(new Date(project.created_at), { 
                            addSuffix: true,
                            locale: pl 
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={statusColors[project.status]} variant="outline">
                      {project.status}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/projects/${project.id}`)}
                    >
                      Otwórz
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
