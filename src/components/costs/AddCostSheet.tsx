/**
 * AddCostSheet — PR-14
 *
 * Mobile-friendly bottom sheet (Drawer) for adding a cost entry.
 * Fields: cost_type, amount_net, note (optional), incurred_at (default today).
 * Receipt photo is NOT required (belongs to a later PR).
 * Validates with Zod, submits via useAddProjectCost.
 */

import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAddProjectCost, type CostType } from '@/hooks/useProjectCosts';

// ── Schema ────────────────────────────────────────────────────────────────────

const addCostSchema = z.object({
  cost_type: z.enum(['MATERIAL', 'LABOR', 'TRAVEL', 'OTHER']),
  amount_net: z
    .string()
    .min(1)
    .refine((v) => !isNaN(Number(v.replace(',', '.'))) && Number(v.replace(',', '.')) >= 0, {
      message: 'Kwota musi być poprawną liczbą nieujemną',
    }),
  note: z.string().optional(),
  incurred_at: z.string().optional(),
});

type AddCostFormValues = z.infer<typeof addCostSchema>;

// ── Props ─────────────────────────────────────────────────────────────────────

interface AddCostSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AddCostSheet({ open, onOpenChange, projectId }: AddCostSheetProps) {
  const { t } = useTranslation();
  const addCost = useAddProjectCost();
  const today = new Date().toISOString().split('T')[0];

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<AddCostFormValues>({
    resolver: zodResolver(addCostSchema),
    defaultValues: {
      cost_type: 'OTHER',
      amount_net: '',
      note: '',
      incurred_at: today,
    },
  });

  const costTypeValue = watch('cost_type');

  const onSubmit = async (values: AddCostFormValues) => {
    const amountRaw = values.amount_net.replace(',', '.');
    try {
      await addCost.mutateAsync({
        project_id: projectId,
        cost_type: values.cost_type as CostType,
        amount_net: Number(amountRaw),
        note: values.note?.trim() || null,
        incurred_at: values.incurred_at || today,
      });
      toast.success(t('burnBar.addSuccess'));
      reset({
        cost_type: 'OTHER',
        amount_net: '',
        note: '',
        incurred_at: today,
      });
      onOpenChange(false);
    } catch {
      toast.error(t('burnBar.addError'));
    }
  };

  const COST_TYPES: { value: CostType; labelKey: string }[] = [
    { value: 'MATERIAL', labelKey: 'burnBar.typeMaterial' },
    { value: 'LABOR',    labelKey: 'burnBar.typeLabor' },
    { value: 'TRAVEL',   labelKey: 'burnBar.typeTravel' },
    { value: 'OTHER',    labelKey: 'burnBar.typeOther' },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl pb-safe max-h-[90vh] overflow-y-auto">
        <SheetHeader className="text-left pb-4">
          <SheetTitle className="text-lg">{t('burnBar.addCostTitle')}</SheetTitle>
          <SheetDescription className="text-sm text-muted-foreground">
            {t('burnBar.addCostDesc')}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Cost type */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">{t('burnBar.costType')}</Label>
            <Select
              value={costTypeValue}
              onValueChange={(v) => setValue('cost_type', v as CostType)}
            >
              <SelectTrigger className="h-12 text-base touch-target">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COST_TYPES.map((ct) => (
                  <SelectItem key={ct.value} value={ct.value} className="h-11 text-base">
                    {t(ct.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">{t('burnBar.amountNet')}</Label>
            <div className="relative">
              <Input
                {...register('amount_net')}
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                className={`h-12 text-base pr-14 touch-target ${errors.amount_net ? 'border-destructive' : ''}`}
                autoComplete="off"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                PLN
              </span>
            </div>
            {errors.amount_net && (
              <p className="text-xs text-destructive">{t('burnBar.amountInvalid')}</p>
            )}
          </div>

          {/* Note (optional) */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">
              {t('burnBar.note')}{' '}
              <span className="text-muted-foreground font-normal">({t('burnBar.optional')})</span>
            </Label>
            <Input
              {...register('note')}
              type="text"
              placeholder={t('burnBar.notePlaceholder')}
              className="h-12 text-base touch-target"
            />
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">{t('burnBar.incurredAt')}</Label>
            <Input
              {...register('incurred_at')}
              type="date"
              className="h-12 text-base touch-target"
              max={today}
            />
          </div>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full h-12 text-base font-semibold mt-2"
            disabled={addCost.isPending}
          >
            {addCost.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {addCost.isPending ? t('burnBar.adding') : t('burnBar.addCostSubmit')}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
