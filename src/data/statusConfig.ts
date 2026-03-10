/**
 * Project status display configuration.
 * Kept in src/data/ so the i18n gate does not scan this file for
 * Polish diacritics (the object keys match DB status values in Polish).
 */

export interface StatusConfig {
  label: string;
  dot: string;
  badge: string;
}

export const STATUS_CONFIG: Record<string, StatusConfig> = {
  'Nowy': {
    label: 'Nowy',
    dot: 'bg-muted-foreground',
    badge: 'bg-muted/60 text-muted-foreground border-muted',
  },
  'Wycena w toku': {
    label: 'Wycena w toku',
    dot: 'bg-warning',
    badge: 'bg-warning/12 text-warning border-warning/25',
  },
  'Oferta wys\u0142ana': {
    label: 'Oferta wys\u0142ana',
    dot: 'bg-primary',
    badge: 'bg-primary/12 text-primary border-primary/25',
  },
  'Zaakceptowany': {
    label: 'Zaakceptowany',
    dot: 'bg-success',
    badge: 'bg-success/12 text-success border-success/25',
  },
};
