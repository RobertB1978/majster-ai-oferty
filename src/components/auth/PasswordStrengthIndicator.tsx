import { useMemo } from 'react';
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
  const analysis = useMemo(() => validatePasswordStrength(password), [password]);
  const strengthLabel = useMemo(() => getPasswordStrengthLabel(analysis.score), [analysis.score]);
  
  if (!password) return null;
  
  const progressPercent = (analysis.score / 7) * 100;
  
  return (
    <div className="mt-2 space-y-2">
      {/* Strength bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Siła hasła:</span>
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
            text="Minimum 8 znaków" 
          />
          <RequirementItem 
            met={/[A-Z]/.test(password)} 
            text="Wielka litera (A-Z)" 
          />
          <RequirementItem 
            met={/[a-z]/.test(password)} 
            text="Mała litera (a-z)" 
          />
          <RequirementItem 
            met={/\d/.test(password)} 
            text="Cyfra (0-9)" 
          />
          <RequirementItem 
            met={/[!@#$%^&*(),.?":{}|<>]/.test(password)} 
            text="Znak specjalny (opcjonalne)" 
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