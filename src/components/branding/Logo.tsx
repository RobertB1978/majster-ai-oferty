import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  animated?: boolean;
}

const sizes = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-14 h-14',
  xl: 'w-20 h-20',
};

const textSizes = {
  sm: 'text-lg',
  md: 'text-xl',
  lg: 'text-2xl',
  xl: 'text-3xl',
};

export function Logo({ className, size = 'md', showText = true, animated = true }: LogoProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className={cn(
        'relative flex items-center justify-center rounded-xl bg-gradient-to-br from-primary via-primary to-primary-glow shadow-lg',
        sizes[size],
        animated && 'group'
      )}>
        {/* Glow effect */}
        <div className={cn(
          'absolute inset-0 rounded-xl bg-gradient-to-br from-primary/40 to-primary-glow/40 blur-xl opacity-0 transition-opacity duration-500',
          animated && 'group-hover:opacity-100'
        )} />
        
        {/* Main logo SVG */}
        <svg
          viewBox="0 0 100 100"
          className={cn(
            'w-[60%] h-[60%] text-primary-foreground relative z-10 transition-transform duration-300',
            animated && 'group-hover:scale-110'
          )}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Hammer head */}
          <rect
            x="55"
            y="15"
            width="35"
            height="20"
            rx="3"
            fill="currentColor"
            className={cn(animated && 'origin-center group-hover:rotate-[-5deg] transition-transform duration-300')}
          />
          
          {/* Hammer handle */}
          <rect
            x="25"
            y="30"
            width="45"
            height="10"
            rx="2"
            fill="currentColor"
            transform="rotate(-45 47.5 35)"
          />
          
          {/* AI spark 1 */}
          <circle
            cx="85"
            cy="12"
            r="4"
            fill="currentColor"
            className={cn(animated && 'animate-pulse')}
          />
          
          {/* AI spark 2 */}
          <circle
            cx="95"
            cy="25"
            r="3"
            fill="currentColor"
            className={cn(animated && 'animate-pulse')}
            style={{ animationDelay: '0.3s' }}
          />
          
          {/* AI spark 3 */}
          <circle
            cx="75"
            cy="8"
            r="2"
            fill="currentColor"
            className={cn(animated && 'animate-pulse')}
            style={{ animationDelay: '0.6s' }}
          />
          
          {/* Circuit lines */}
          <path
            d="M20 70 L35 70 L40 65 L55 65"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            className="opacity-70"
          />
          <path
            d="M20 80 L45 80 L50 75 L65 75"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            className="opacity-70"
          />
          <path
            d="M20 90 L30 90 L35 85 L55 85"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            className="opacity-70"
          />
          
          {/* Circuit dots */}
          <circle cx="55" cy="65" r="3" fill="currentColor" className="opacity-70" />
          <circle cx="65" cy="75" r="3" fill="currentColor" className="opacity-70" />
          <circle cx="55" cy="85" r="3" fill="currentColor" className="opacity-70" />
        </svg>
      </div>
      
      {showText && (
        <div className="flex flex-col">
          <span className={cn(
            'font-bold text-foreground tracking-tight leading-none',
            textSizes[size]
          )}>
            Majster<span className="text-primary">.AI</span>
          </span>
          {size !== 'sm' && (
            <span className="text-[10px] text-muted-foreground font-medium mt-0.5">
              Inteligentne wyceny
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export function LogoIcon({ className, size = 'md', animated = true }: Omit<LogoProps, 'showText'>) {
  return <Logo className={className} size={size} showText={false} animated={animated} />;
}
