import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calculator, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function QuickEstimate() {
  const navigate = useNavigate();

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <Card className="border shadow-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
            <Calculator className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Szybka Wycena</CardTitle>
          <CardDescription className="text-base mt-2">
            Moduł szybkiej wyceny jest w przygotowaniu. Wkrótce będziesz mógł
            tworzyć wyceny głosem, zdjęciem lub w kilka kliknięć.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center pb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-warning/10 border border-warning/20 text-warning text-sm font-medium mb-6">
            Wkrótce
          </div>
          <div className="flex flex-col gap-3 max-w-xs mx-auto">
            <Button onClick={() => navigate('/app/jobs/new')} className="w-full">
              Utwórz wycenę ręcznie
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={() => navigate('/app/dashboard')}>
              Wróć do pulpitu
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
