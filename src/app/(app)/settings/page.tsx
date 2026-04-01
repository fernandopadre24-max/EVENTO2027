
'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAppSettings, DEFAULT_APP_NAME } from '@/hooks/use-app-settings';
import {
  Palette,
  Bell,
  Shield,
  Info,
  Trash2,
  Download,
  Moon,
  Sun,
  Monitor,
  AppWindow,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const auth = useAuth();
  const router = useRouter();
  const { appName, saveAppName, isSaving } = useAppSettings();

  const [nameInput, setNameInput] = useState('');
  const [nameSaved, setNameSaved] = useState(false);

  // Sync input with loaded app name
  useEffect(() => {
    setNameInput(appName);
  }, [appName]);

  const [notifications, setNotifications] = useState({
    events: true,
    finances: true,
    clients: false,
    reports: false,
  });

  const handleNotificationChange = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
    toast({ title: 'Preferência atualizada', description: 'Configuração de notificação salva.' });
  };

  const handleSaveAppName = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveAppName(nameInput);
    setNameSaved(true);
    toast({ title: '✅ Nome atualizado!', description: `O app agora se chama "${nameInput || DEFAULT_APP_NAME}".` });
    setTimeout(() => setNameSaved(false), 3000);
  };

  const handleSignOut = async () => {
    if (auth) {
      await signOut(auth);
      router.push('/login');
    }
  };

  const themeOptions = [
    { value: 'light', label: 'Claro', icon: Sun },
    { value: 'dark', label: 'Escuro', icon: Moon },
    { value: 'system', label: 'Sistema', icon: Monitor },
  ];

  return (
    <div className="space-y-8 max-w-2xl">
      <h1 className="text-3xl font-bold tracking-tight font-headline">Configurações</h1>

      {/* Nome do Aplicativo */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <AppWindow className="h-5 w-5 text-primary" />
            <CardTitle>Nome do Aplicativo</CardTitle>
          </div>
          <CardDescription>
            Personalize o nome exibido no cabeçalho e na navegação.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveAppName} className="flex gap-3 items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="appName">Nome</Label>
              <Input
                id="appName"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder={DEFAULT_APP_NAME}
                maxLength={30}
              />
              <p className="text-xs text-muted-foreground">
                Padrão: <span className="font-medium">{DEFAULT_APP_NAME}</span>
              </p>
            </div>
            <Button type="submit" disabled={isSaving || nameInput === appName} className="mb-6">
              {isSaving ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</>
              ) : nameSaved ? (
                <><CheckCircle2 className="mr-2 h-4 w-4 text-emerald-400" />Salvo!</>
              ) : (
                'Salvar'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Aparência */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            <CardTitle>Aparência</CardTitle>
          </div>
          <CardDescription>Personalize o visual da aplicação.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Label>Tema</Label>
            <div className="flex gap-3">
              {themeOptions.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  className={`flex flex-1 flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all hover:bg-muted ${
                    theme === value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-sm font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notificações */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <CardTitle>Notificações</CardTitle>
          </div>
          <CardDescription>Controle quais alertas você deseja receber.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: 'events' as const, label: 'Novos Eventos', desc: 'Alertas ao criar ou editar eventos' },
            { key: 'finances' as const, label: 'Movimentos Financeiros', desc: 'Pagamentos e recebimentos registrados' },
            { key: 'clients' as const, label: 'Novos Clientes', desc: 'Alertas ao cadastrar novos clientes' },
            { key: 'reports' as const, label: 'Relatórios Prontos', desc: 'Aviso quando relatórios estão disponíveis' },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
              <Switch checked={notifications[key]} onCheckedChange={() => handleNotificationChange(key)} />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Privacidade e Segurança */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle>Privacidade e Segurança</CardTitle>
          </div>
          <CardDescription>Gerencie seus dados e acesso à conta.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Exportar Meus Dados</p>
              <p className="text-xs text-muted-foreground">Baixe uma cópia de todos os seus dados</p>
            </div>
            <Button variant="outline" size="sm" onClick={() =>
              toast({ title: 'Exportação iniciada', description: 'Seus dados serão preparados em breve.' })
            }>
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-destructive">Encerrar Sessão</p>
              <p className="text-xs text-muted-foreground">Sair da sua conta neste dispositivo</p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Sair da Conta
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Encerrar sessão?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Você será desconectado e redirecionado para a tela de login.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleSignOut}>Confirmar</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      {/* Sobre */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" />
            <CardTitle>Sobre o App</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <div className="flex justify-between">
            <span>Nome atual</span>
            <span className="font-medium text-foreground">{appName}</span>
          </div>
          <div className="flex justify-between">
            <span>Versão</span>
            <span className="font-medium text-foreground">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span>Framework</span>
            <span className="font-medium text-foreground">Next.js 15</span>
          </div>
          <div className="flex justify-between">
            <span>Backend</span>
            <span className="font-medium text-foreground">Firebase</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
