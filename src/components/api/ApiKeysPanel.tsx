import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Key, Plus, Copy, Trash2, Eye, EyeOff, Code } from 'lucide-react';
import { useApiKeys, useCreateApiKey, useDeleteApiKey, useUpdateApiKey } from '@/hooks/useApiKeys';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

export function ApiKeysPanel() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [permissions, setPermissions] = useState<string[]>(['read']);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());

  const { data: keys = [] } = useApiKeys();
  const createKey = useCreateApiKey();
  const deleteKey = useDeleteApiKey();
  const updateKey = useUpdateApiKey();

  const handleCreate = async () => {
    if (!keyName) {
      toast.error(t('apiKeys.toast.nameRequired'));
      return;
    }

    await createKey.mutateAsync({ keyName, permissions });
    setIsOpen(false);
    setKeyName('');
    setPermissions(['read']);
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success(t('apiKeys.toast.copied'));
  };

  const toggleVisibility = (id: string) => {
    setVisibleKeys(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const togglePermission = (perm: string) => {
    setPermissions(prev =>
      prev.includes(perm)
        ? prev.filter(p => p !== perm)
        : [...prev, perm]
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            {t('apiKeys.title')}
          </span>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                {t('apiKeys.newKey')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('apiKeys.createTitle')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>{t('apiKeys.keyName')}</Label>
                  <Input
                    value={keyName}
                    onChange={(e) => setKeyName(e.target.value)}
                    placeholder={t('apiKeys.keyNamePlaceholder')}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('apiKeys.permissions')}</Label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="read"
                        checked={permissions.includes('read')}
                        onCheckedChange={() => togglePermission('read')}
                      />
                      <Label htmlFor="read" className="font-normal">{t('apiKeys.readPerm')}</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="write"
                        checked={permissions.includes('write')}
                        onCheckedChange={() => togglePermission('write')}
                      />
                      <Label htmlFor="write" className="font-normal">{t('apiKeys.writePerm')}</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="delete"
                        checked={permissions.includes('delete')}
                        onCheckedChange={() => togglePermission('delete')}
                      />
                      <Label htmlFor="delete" className="font-normal">{t('apiKeys.deletePerm')}</Label>
                    </div>
                  </div>
                </div>
                <Button onClick={handleCreate} className="w-full" disabled={createKey.isPending}>
                  {t('apiKeys.createKey')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
        <CardDescription>
          {t('apiKeys.description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {keys.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Code className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>{t('apiKeys.noKeys')}</p>
            <p className="text-sm">{t('apiKeys.noKeysDesc')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {keys.map((key) => (
              <div key={key.id} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{key.key_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {t('apiKeys.created', { date: format(new Date(key.created_at), 'dd MMM yyyy', { locale: pl }) })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={key.is_active ? 'default' : 'secondary'}>
                      {key.is_active ? t('apiKeys.active') : t('apiKeys.inactive')}
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => updateKey.mutate({ id: key.id, is_active: !key.is_active })}
                    >
                      {key.is_active ? t('apiKeys.disable') : t('apiKeys.enable')}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteKey.mutate(key.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <code className="flex-1 p-2 bg-muted rounded text-sm font-mono">
                    {visibleKeys.has(key.id)
                      ? key.api_key
                      : '••••••••••••••••••••••••••••••••'
                    }
                  </code>
                  <Button size="sm" variant="outline" onClick={() => toggleVisibility(key.id)}>
                    {visibleKeys.has(key.id) ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => copyKey(key.api_key)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex gap-2">
                  {(key.permissions as string[]).map((perm) => (
                    <Badge key={perm} variant="outline">{perm}</Badge>
                  ))}
                </div>

                {key.last_used_at && (
                  <p className="text-xs text-muted-foreground">
                    {t('apiKeys.lastUsed', { date: format(new Date(key.last_used_at), 'dd MMM yyyy HH:mm', { locale: pl }) })}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* API Documentation */}
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <Code className="h-4 w-4" />
            {t('apiKeys.apiDocs')}
          </h4>
          <div className="space-y-2 text-sm">
            <p><strong>Base URL:</strong> <code>{window.location.origin}/api</code></p>
            <p><strong>{t('apiKeys.authorization')}:</strong> Header <code>x-api-key: YOUR_API_KEY</code></p>
            <p><strong>{t('apiKeys.endpoints')}:</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li><code>GET /projects</code> - {t('apiKeys.listProjects')}</li>
              <li><code>POST /projects</code> - {t('apiKeys.createProject')}</li>
              <li><code>GET /clients</code> - {t('apiKeys.listClients')}</li>
              <li><code>GET /quotes</code> - {t('apiKeys.listQuotes')}</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
