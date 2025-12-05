import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock } from 'lucide-react';

interface ProjectStatusBreakdownProps {
  newCount: number;
  inProgressCount: number;
  sentCount: number;
  acceptedCount: number;
}

export function ProjectStatusBreakdown({ 
  newCount, 
  inProgressCount, 
  sentCount, 
  acceptedCount 
}: ProjectStatusBreakdownProps) {
  const statuses = [
    { label: 'Nowe', value: newCount, color: 'text-muted-foreground', bg: 'bg-muted/30' },
    { label: 'W toku', value: inProgressCount, color: 'text-warning', bg: 'bg-warning/5' },
    { label: 'Wysłane', value: sentCount, color: 'text-primary', bg: 'bg-primary/5' },
    { label: 'Zaakceptowane', value: acceptedCount, color: 'text-success', bg: 'bg-success/5' },
  ];

  const total = newCount + inProgressCount + sentCount + acceptedCount;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Status projektów
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Progress bar */}
          {total > 0 && (
            <div className="flex h-3 rounded-full overflow-hidden mb-6">
              {statuses.map((status, index) => (
                <div
                  key={status.label}
                  className={`${
                    index === 0 ? 'bg-muted-foreground' :
                    index === 1 ? 'bg-warning' :
                    index === 2 ? 'bg-primary' :
                    'bg-success'
                  }`}
                  style={{ width: `${(status.value / total) * 100}%` }}
                />
              ))}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-4">
            {statuses.map((status) => (
              <div 
                key={status.label} 
                className={`rounded-lg border border-border ${status.bg} p-4 text-center`}
              >
                <p className={`text-3xl font-bold ${status.color}`}>{status.value}</p>
                <p className="text-sm text-muted-foreground">{status.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
