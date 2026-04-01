
'use client';

import { useState } from 'react';
import { useTheme } from 'next-themes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
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

  const [notifications, setNotifications] = useState({
    events: true,
    finances: true,
    clients: false,
    reports: false,
  });

  const handleNotificationChange = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
    toast({
      title: 'Preferência atualizada',
      description: 'Suas configurações de notificação foram salvas.',
    });
  };

  const handleExportData = () => {
    toast({
      title: 'Exportação iniciada',
      description: 'Seus dados serão preparados para download em breve.',
    });
  };

  const handleDeleteAccount = async () => {
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
              <Switch
                checked={notifications[key]}
                onCheckedChange={() => handleNotificationChange(key)}
              />
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
            <Button variant="outline" size="sm" onClick={handleExportData}>
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
                  <AlertDialogAction onClick={handleDeleteAccount}>
                    Confirmar
                  </AlertDialogAction>
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
            <span>Aplicação</span>
            <span className="font-medium text-foreground">BandMate / EVENTO2027</span>
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
