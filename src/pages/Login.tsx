import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { loginSchema } from '@/lib/validations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Wrench, Mail, Lock, Loader2, Fingerprint } from 'lucide-react';
import { toast } from 'sonner';
import { useBiometricAuth } from '@/hooks/useBiometricAuth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const { isSupported, checkIfEnabled, authenticateWithBiometric, isAuthenticating } = useBiometricAuth();
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Check for stored email and biometric availability
  useEffect(() => {
    const storedEmail = localStorage.getItem('majster_last_email');
    if (storedEmail) {
      setEmail(storedEmail);
      if (isSupported) {
        const enabled = checkIfEnabled(storedEmail);
        setBiometricAvailable(enabled);
      }
    }
  }, [isSupported, checkIfEnabled]);

  // Update biometric availability when email changes
  useEffect(() => {
    if (email && isSupported) {
      const enabled = checkIfEnabled(email);
      setBiometricAvailable(enabled);
    } else {
      setBiometricAvailable(false);
    }
  }, [email, isSupported, checkIfEnabled]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) {
          newErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    const { error } = await login(email, password);
    setIsLoading(false);

    if (error) {
      if (error.includes('Invalid login')) {
        toast.error('Nieprawidłowy email lub hasło');
      } else if (error.includes('Email not confirmed')) {
        toast.error('Email nie został potwierdzony. Sprawdź skrzynkę.');
      } else {
        toast.error(error);
      }
    } else {
      localStorage.setItem('majster_last_email', email);
      toast.success('Zalogowano pomyślnie');
      navigate('/dashboard');
    }
  };

  const handleBiometricLogin = async () => {
    if (!email) {
      toast.error('Wprowadź email przed użyciem logowania biometrycznego');
      return;
    }

    const success = await authenticateWithBiometric(email);
    if (success) {
      // For biometric login, we need the password stored or use a different auth flow
      // Since we're using Supabase Auth, we'll just verify the biometric and show the password field
      toast.success('Weryfikacja biometryczna powiodła się. Wprowadź hasło.');
    } else {
      toast.error('Weryfikacja biometryczna nie powiodła się');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md animate-fade-in">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary">
            <Wrench className="h-8 w-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">Majster.AI</CardTitle>
          <CardDescription>Zaloguj się do swojego konta</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="jan@example.pl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`pl-10 ${errors.email ? 'border-destructive' : ''}`}
                />
              </div>
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Hasło</Label>
                <Link 
                  to="/forgot-password" 
                  className="text-sm text-primary hover:underline"
                >
                  Nie pamiętasz hasła?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`pl-10 ${errors.password ? 'border-destructive' : ''}`}
                />
              </div>
              {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logowanie...
                </>
              ) : (
                'Zaloguj się'
              )}
            </Button>
          </form>

          {biometricAvailable && (
            <>
              <div className="relative my-4">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                  lub
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleBiometricLogin}
                disabled={isAuthenticating}
              >
                {isAuthenticating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Weryfikacja...
                  </>
                ) : (
                  <>
                    <Fingerprint className="mr-2 h-4 w-4" />
                    Zaloguj odciskiem palca
                  </>
                )}
              </Button>
            </>
          )}

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Nie masz konta?{' '}
            <Link to="/register" className="font-medium text-primary hover:underline">
              Zarejestruj się
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
