import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FileSignature, Link2, Copy, Check, Clock, XCircle, CheckCircle } from 'lucide-react';
import { useOfferApprovals, useCreateOfferApproval } from '@/hooks/useOfferApprovals';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { toast } from 'sonner';

interface OfferApprovalPanelProps {
  projectId: string;
  clientName?: string;
  clientEmail?: string;
}

export function OfferApprovalPanel({ projectId, clientName = '', clientEmail = '' }: OfferApprovalPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState(clientName);
  const [email, setEmail] = useState(clientEmail);

  const { data: approvals = [] } = useOfferApprovals(projectId);
  const createApproval = useCreateOfferApproval();

  const handleCreate = async () => {
    if (!name || !email) {
      toast.error('Wypełnij wszystkie pola');
      return;
    }

    await createApproval.mutateAsync({ projectId, clientName: name, clientEmail: email });
    setIsOpen(false);
  };

  const copyLink = (token: string) => {
    const link = `${window.location.origin}/offer/${token}`;
    navigator.clipboard.writeText(link);
    toast.success('Link skopiowany');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'Zaakceptowana';
      case 'rejected': return 'Odrzucona';
      default: return 'Oczekuje';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <FileSignature className="h-5 w-5" />
            E-Podpis klienta
          </span>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Link2 className="h-4 w-4 mr-2" />
                Utwórz link
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Utwórz link do akceptacji</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Imię i nazwisko klienta</Label>
                  <Input 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jan Kowalski"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email klienta</Label>
                  <Input 
                    type="email"
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jan@example.com"
                  />
                </div>
                <Button 
                  onClick={handleCreate} 
                  className="w-full"
                  disabled={createApproval.isPending}
                >
                  Utwórz link do akceptacji
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {approvals.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <FileSignature className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Brak linków do akceptacji</p>
            <p className="text-sm">Utwórz link, aby klient mógł zaakceptować ofertę online</p>
          </div>
        ) : (
          <div className="space-y-3">
            {approvals.map((approval) => (
              <div key={approval.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(approval.status)}
                  <div>
                    <p className="font-medium">{approval.client_name}</p>
                    <p className="text-sm text-muted-foreground">{approval.client_email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={
                    approval.status === 'approved' ? 'default' :
                    approval.status === 'rejected' ? 'destructive' : 'secondary'
                  }>
                    {getStatusText(approval.status)}
                  </Badge>
                  {approval.status === 'pending' && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => copyLink(approval.public_token)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  )}
                  {approval.approved_at && (
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(approval.approved_at), 'dd MMM', { locale: pl })}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
