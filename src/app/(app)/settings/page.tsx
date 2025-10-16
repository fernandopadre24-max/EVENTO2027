
'use client';

import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { useAppTitle, DEFAULT_TITLE } from '@/context/app-title-provider';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAppTheme, DEFAULT_BG_COLOR_LIGHT, DEFAULT_BG_COLOR_DARK } from '@/context/app-theme-provider';
import { useAppFontSize } from '@/context/app-font-size-provider';
import { Slider } from '@/components/ui/slider';


export default function SettingsPage() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { title, setTitle } = useAppTitle();
  const { backgroundColor, setBackgroundColor } = useAppTheme();
  const { fontSize, setFontSize } = useAppFontSize();

  const [localTitle, setLocalTitle] = useState(title);
  const [localBgColor, setLocalBgColor] = useState(backgroundColor);
  const [localFontSize, setLocalFontSize] = useState(fontSize);

  const { toast } = useToast();

  useEffect(() => {
    setLocalTitle(title);
  }, [title]);

  useEffect(() => {
    setLocalBgColor(backgroundColor);
  }, [backgroundColor]);
  
  useEffect(() => {
    setLocalFontSize(fontSize);
  }, [fontSize]);

  const handleTitleSave = () => {
    setTitle(localTitle);
    toast({
        title: 'Sucesso!',
        description: 'O título do aplicativo foi atualizado.',
    });
  };

  const handleRestoreTitle = () => {
    setLocalTitle(DEFAULT_TITLE);
    setTitle(''); // Pass empty string to signal reset
    toast({
        title: 'Sucesso!',
        description: 'O título do aplicativo foi restaurado para o padrão.',
    });
  };

  const handleThemeSave = () => {
    setBackgroundColor(localBgColor);
    toast({
        title: 'Sucesso!',
        description: 'A cor de fundo foi atualizada.',
    });
  }

  const handleRestoreTheme = () => {
    const defaultColor = resolvedTheme === 'dark' ? DEFAULT_BG_COLOR_DARK : DEFAULT_BG_COLOR_LIGHT;
    setLocalBgColor(defaultColor);
    setBackgroundColor(''); // Pass empty string to signal reset
     toast({
        title: 'Sucesso!',
        description: 'A cor de fundo foi restaurada para o padrão do tema.',
    });
  }
  
  const handleFontSizeSave = () => {
    setFontSize(localFontSize);
    toast({
        title: 'Sucesso!',
        description: 'O tamanho da fonte foi atualizado.',
    });
  }

  const handleRestoreFontSize = () => {
    setFontSize(100); // Reset to default 100%
     toast({
        title: 'Sucesso!',
        description: 'O tamanho da fonte foi restaurado para o padrão.',
    });
  }


  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight font-headline">
        Configurações
      </h1>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Geral</CardTitle>
          <CardDescription>
            Personalize as configurações gerais do aplicativo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="appName">Título do Aplicativo</Label>
            <Input 
              id="appName" 
              value={localTitle} 
              onChange={(e) => setLocalTitle(e.target.value)}
              placeholder="Ex: Minha Banda"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleTitleSave}>Salvar Título</Button>
            <Button variant="ghost" onClick={handleRestoreTitle}>Restaurar Padrão</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Aparência</CardTitle>
          <CardDescription>
            Personalize a aparência do aplicativo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <Label>Tema</Label>
            <RadioGroup
              value={theme}
              onValueChange={setTheme}
              className="grid max-w-md grid-cols-1 gap-4 sm:grid-cols-3"
            >
              <div>
                <RadioGroupItem value="light" id="light" className="peer sr-only" />
                <Label
                  htmlFor="light"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  Modo Claro
                </Label>
              </div>
              <div>
                <RadioGroupItem value="dark" id="dark" className="peer sr-only" />
                <Label
                  htmlFor="dark"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  Modo Escuro
                </Label>
              </div>
              <div>
                <RadioGroupItem value="system" id="system" className="peer sr-only" />
                <Label
                  htmlFor="system"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  Sistema
                </Label>
              </div>
            </RadioGroup>
          </div>
           <div className="space-y-2">
            <Label htmlFor="bgColor">Cor de Fundo</Label>
            <div className='flex items-center gap-2'>
              <Input 
                id="bgColor" 
                type="color"
                value={localBgColor}
                onChange={(e) => setLocalBgColor(e.target.value)}
                className="p-1 h-10 w-14"
              />
              <Input
                value={localBgColor}
                onChange={(e) => setLocalBgColor(e.target.value)}
                placeholder="#ffffff"
              />
            </div>
            
          </div>
          <div className="flex gap-2">
            <Button onClick={handleThemeSave}>Salvar Aparência</Button>
            <Button variant="ghost" onClick={handleRestoreTheme}>Restaurar Padrão</Button>
          </div>
           <div className="space-y-4">
            <Label htmlFor="fontSize">Tamanho da Fonte ({localFontSize}%)</Label>
            <Slider
                id="fontSize"
                min={80}
                max={120}
                step={5}
                value={[localFontSize]}
                onValueChange={(value) => setLocalFontSize(value[0])}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleFontSizeSave}>Salvar Fonte</Button>
            <Button variant="ghost" onClick={handleRestoreFontSize}>Restaurar Padrão</Button>
          </div>
        </CardContent>
      </Card>
      
       <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Conta</CardTitle>
          <CardDescription>
            Gerencie as configurações da sua conta.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <Button variant="outline" disabled>Alterar Senha</Button>
            <p className="text-sm text-muted-foreground">Em breve: Altere a senha associada à sua conta.</p>
             <Button variant="destructive" disabled>Excluir Conta</Button>
             <p className="text-sm text-muted-foreground">Em breve: Exclua permanentemente sua conta e todos os seus dados.</p>
        </CardContent>
      </Card>

    </div>
  );
}
