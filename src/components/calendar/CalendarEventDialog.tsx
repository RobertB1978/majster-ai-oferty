import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Trash2, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { CalendarEvent } from '@/hooks/useCalendarEvents';
import type { EventFormData } from './calendarTypes';

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

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md flex flex-col max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            {editingEvent ? t('common.edit') : t('calendar.addEvent')}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 overflow-y-auto flex-1 min-h-0 pr-1">
          <div>
            <Label>{t('calendar.eventTitle')} *</Label>
            <Input
              value={eventData.title}
              onChange={(e) => setEventData({ ...eventData, title: e.target.value })}
              placeholder={t('calendar.eventTitle')}
            />
          </div>
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
          <div>
            <Label>{t('calendar.eventDescription')}</Label>
            <Textarea
              value={eventData.description}
              onChange={(e) => setEventData({ ...eventData, description: e.target.value })}
              rows={3}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {t('calendar.selectedDate', 'Selected date')}: {format(selectedDate, 'dd.MM.yyyy')}
          </p>
        </div>
        <DialogFooter className="flex gap-2">
          {editingEvent && (
            <Button
              variant="destructive"
              onClick={() => {
                void onDelete(editingEvent.id);
                onOpenChange(false);
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t('common.delete')}
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={onSave} disabled={isSaving}>
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
