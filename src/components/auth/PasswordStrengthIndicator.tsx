import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { validatePasswordStrength, getPasswordStrengthLabel } from '@/lib/validations';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface PasswordStrengthIndicatorProps {
  password: string;
  showRequirements?: boolean;
}

export function PasswordStrengthIndicator({
  password,
  showRequirements = true
}: PasswordStrengthIndicatorProps) {
  const { t } = useTranslation();
  const analysis = useMemo(() => validatePasswordStrength(password), [password]);
  const strengthLabel = useMemo(() => getPasswordStrengthLabel(analysis.score), [analysis.score]);

  if (!password) return null;

  const progressPercent = (analysis.score / 7) * 100;
  
  return (
    <div className="mt-2 space-y-2">
      {/* Strength bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{t('auth.passwordStrength')}</span>
          <span className={strengthLabel.color}>{strengthLabel.label}</span>
        </div>
        <Progress 
          value={progressPercent} 
          className="h-1.5"
        />
      </div>
      
      {/* Requirements list */}
      {showRequirements && (
        <div className="space-y-1 text-xs">
          <RequirementItem
            met={password.length >= 8}
            text={t('auth.passwordRequirements.minLength')}
          />
          <RequirementItem
            met={/[A-Z]/.test(password)}
            text={t('auth.passwordRequirements.uppercase')}
          />
          <RequirementItem
            met={/[a-z]/.test(password)}
            text={t('auth.passwordRequirements.lowercase')}
          />
          <RequirementItem
            met={/\d/.test(password)}
            text={t('auth.passwordRequirements.digit')}
          />
          <RequirementItem
            met={/[!@#$%^&*(),.?":{}|<>]/.test(password)}
            text={t('auth.passwordRequirements.special')}
            optional
          />
        </div>
      )}
      
      {/* Errors */}
      {analysis.errors.length > 0 && (
        <div className="space-y-1">
          {analysis.errors.map((error, i) => (
            <div key={i} className="flex items-center gap-1 text-xs text-destructive">
              <XCircle className="h-3 w-3" />
              <span>{error}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RequirementItem({ 
  met, 
  text, 
  optional = false 
}: { 
  met: boolean; 
  text: string; 
  optional?: boolean;
}) {
  const Icon = met ? CheckCircle : optional ? AlertCircle : XCircle;
  const colorClass = met 
    ? 'text-green-500' 
    : optional 
      ? 'text-muted-foreground' 
      : 'text-destructive';
      
  return (
    <div className={`flex items-center gap-1.5 ${colorClass}`}>
      <Icon className="h-3 w-3" />
      <span>{text}</span>
    </div>
  );
}