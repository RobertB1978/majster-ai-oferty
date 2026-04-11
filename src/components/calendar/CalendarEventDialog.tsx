import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Trash2, Loader2, AlertTriangle, CheckCircle2, Circle, RefreshCw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { CalendarEvent } from '@/hooks/useCalendarEvents';
import type { EventFormData, RecurrenceRule } from './calendarTypes';

interface Project {
  id: string;
  project_name: string;
}

interface CalendarEventDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingEvent: CalendarEvent | null;
  eventData: EventFormData;
  setEventData: (data: EventFormData) => void;
  selectedDate: Date;
  projects: Project[];
  onSave: () => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isSaving: boolean;
}

export function CalendarEventDialog({
  isOpen,
  onOpenChange,
  editingEvent,
  eventData,
  setEventData,
  selectedDate,
  projects,
  onSave,
  onDelete,
  isSaving,
}: CalendarEventDialogProps) {
  const { t } = useTranslation();
  const [pendingDelete, setPendingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setPendingDelete(false);
      setIsDeleting(false);
    }
  }, [isOpen]);

  const handleConfirmedDelete = async () => {
    if (!editingEvent) return;
    setIsDeleting(true);
    try {
      await onDelete(editingEvent.id);
      onOpenChange(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const isCompleted = eventData.status === 'completed';
  const hasRecurrence = eventData.recurrence_rule !== 'none';

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md flex flex-col max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            {editingEvent ? t('common.edit') : t('calendar.addEvent')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto flex-1 min-h-0 pr-1">
          {/* Status toggle */}
          <button
            type="button"
            onClick={() => setEventData({ ...eventData, status: isCompleted ? 'pending' : 'completed' })}
            className={cn(
              'w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors',
              isCompleted
                ? 'bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400'
                : 'bg-muted/40 border-muted text-muted-foreground hover:bg-muted/70'
            )}
          >
            {isCompleted
              ? <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
              : <Circle className="h-4 w-4 flex-shrink-0" />}
            {isCompleted ? t('calendar.statusCompleted') : t('calendar.statusPending')}
          </button>

          {/* Title */}
          <div>
            <Label>{t('calendar.eventTitle')} *</Label>
            <Input
              value={eventData.title}
              onChange={(e) => setEventData({ ...eventData, title: e.target.value })}
              placeholder={t('calendar.eventTitle')}
              className={cn(isCompleted && 'line-through opacity-60')}
            />
          </div>

          {/* Type + Start time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{t('calendar.eventType')}</Label>
              <Select value={eventData.event_type} onValueChange={(v) => setEventData({ ...eventData, event_type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="deadline">{t('calendar.eventTypes.deadline')}</SelectItem>
                  <SelectItem value="meeting">{t('calendar.eventTypes.meeting')}</SelectItem>
                  <SelectItem value="reminder">{t('calendar.eventTypes.reminder')}</SelectItem>
                  <SelectItem value="follow_up">{t('calendar.eventTypes.follow_up')}</SelectItem>
                  <SelectItem value="other">{t('calendar.eventTypes.other')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('calendar.eventTime')}</Label>
              <Input
                type="time"
                value={eventData.event_time}
                onChange={(e) => setEventData({ ...eventData, event_time: e.target.value })}
              />
            </div>
          </div>

          {/* End time (optional) */}
          {eventData.event_time && (
            <div>
              <Label>{t('calendar.endTime')}</Label>
              <Input
                type="time"
                value={eventData.end_time}
                onChange={(e) => setEventData({ ...eventData, end_time: e.target.value })}
              />
            </div>
          )}

          {/* Recurrence */}
          <div>
            <Label className="flex items-center gap-1.5">
              <RefreshCw className="h-3.5 w-3.5" />
              {t('calendar.recurrence')}
            </Label>
            <Select
              value={eventData.recurrence_rule}
              onValueChange={(v) => setEventData({ ...eventData, recurrence_rule: v as RecurrenceRule, recurrence_end_date: '' })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t('calendar.recurrenceNone')}</SelectItem>
                <SelectItem value="daily">{t('calendar.recurrenceDaily')}</SelectItem>
                <SelectItem value="weekly">{t('calendar.recurrenceWeekly')}</SelectItem>
                <SelectItem value="monthly">{t('calendar.recurrenceMonthly')}</SelectItem>
                <SelectItem value="yearly">{t('calendar.recurrenceYearly')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Recurrence end date */}
          {hasRecurrence && (
            <div>
              <Label>{t('calendar.recurrenceEndDate')}</Label>
              <Input
                type="date"
                value={eventData.recurrence_end_date}
                min={format(selectedDate, 'yyyy-MM-dd')}
                onChange={(e) => setEventData({ ...eventData, recurrence_end_date: e.target.value })}
              />
            </div>
          )}

          {/* Linked project */}
          <div>
            <Label>{t('calendar.linkedProject')}</Label>
            <Select
              value={eventData.project_id || 'none'}
              onValueChange={(v) => setEventData({ ...eventData, project_id: v === 'none' ? '' : v })}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('common.none')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">({t('common.none')})</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.project_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div>
            <Label>{t('calendar.eventDescription')}</Label>
            <Textarea
              value={eventData.description}
              onChange={(e) => setEventData({ ...eventData, description: e.target.value })}
              rows={3}
            />
          </div>

          <p className="text-xs text-muted-foreground">
            {t('calendar.selectedDate')}: {format(selectedDate, 'dd.MM.yyyy')}
          </p>
        </div>

        <DialogFooter className="flex gap-2 flex-wrap">
          {editingEvent && !pendingDelete && (
            <Button variant="destructive" onClick={() => setPendingDelete(true)}>
              <Trash2 className="h-4 w-4 mr-2" />
              {t('common.delete')}
            </Button>
          )}
          {editingEvent && pendingDelete && (
            <Button
              variant="destructive"
              disabled={isDeleting}
              onClick={() => { void handleConfirmedDelete(); }}
            >
              {isDeleting
                ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                : <AlertTriangle className="h-4 w-4 mr-2" />}
              {t('calendar.confirmDelete')}
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={onSave} disabled={isSaving || isDeleting}>
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
