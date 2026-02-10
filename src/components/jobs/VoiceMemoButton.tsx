import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Mic } from 'lucide-react';
import { toast } from 'sonner';

interface VoiceMemoButtonProps {
  className?: string;
}

/** Placeholder voice memo button - shows toast that feature is coming. */
export function VoiceMemoButton({ className }: VoiceMemoButtonProps) {
  const { t } = useTranslation();

  return (
    <Button
      variant="outline"
      size="icon"
      className={`min-h-[44px] min-w-[44px] ${className ?? ''}`}
      onClick={() => toast.info(t('voiceMemo.comingSoon'))}
      aria-label={t('voiceMemo.ariaLabel')}
    >
      <Mic className="h-5 w-5" />
    </Button>
  );
}
