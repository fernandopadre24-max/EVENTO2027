
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


// Helper to convert HSL string to hex
const hslStringToHex = (hsl: string): string => {
  const [h, s, l] = hsl.match(/\d+/g)!.map(Number);
  const s_norm = s / 100;
  const l_norm = l / 100;
  let c = (1 - Math.abs(2 * l_norm - 1)) * s_norm,
      x = c * (1 - Math.abs((h / 60) % 2 - 1)),
      m = l_norm - c/2,
      r = 0,
      g = 0,
      b = 0;
  if (0 <= h && h < 60) {
    r = c; g = x; b = 0;
  } else if (60 <= h && h < 120) {
    r = x; g = c; b = 0;
  } else if (120 <= h && h < 180) {
    r = 0; g = c; b = x;
  } else if (180 <= h && h < 240) {
    r = 0; g = x; b = c;
  } else if (240 <= h && h < 300) {
    r = x; g = 0; b = c;
  } else if (300 <= h && h < 360) {
    r = c; g = 0; b = x;
  }
  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

// Helper to convert hex to HSL string
const hexToHslString = (hex: string): string | null => {
    if (!/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex)) {
      return null;
    }
    let r_hex, g_hex, b_hex;
    if (hex.length === 4) {
      r_hex = hex[1] + hex[1];
      g_hex = hex[2] + hex[2];
      b_hex = hex[3] + hex[3];
    } else {
      r_hex = hex.substring(1, 3);
      g_hex = hex.substring(3, 5);
      b_hex = hex.substring(5, 7);
    }
    let r = parseInt(r_hex, 16) / 255;
    let g = parseInt(g_hex, 16) / 255;
    let b = parseInt(b_hex, 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    h = Math.round(h * 360);
    s = Math.round(s * 100);
    l = Math.round(l * 100);
    return `${h} ${s}% ${l}%`;
}


export default function SettingsPage() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { title, setTitle } = useAppTitle();
  const { backgroundColor, setBackgroundColor } = useAppTheme();
  const { fontSize, setFontSize } = useAppFontSize();

  const [localTitle, setLocalTitle] = useState(title);
  
  // Local color state is always hex for the color picker input
  const [localBgColorHex, setLocalBgColorHex] = useState(hslStringToHex(backgroundColor));
  
  const [localFontSize, setLocalFontSize] = useState(fontSize);

  const { toast } = useToast();

  useEffect(() => {
    setLocalTitle(title);
  }, [title]);

  useEffect(() => {
    setLocalBgColorHex(hslStringToHex(backgroundColor));
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
    const newHslColor = hexToHslString(localBgColorHex);
    if (newHslColor) {
      setBackgroundColor(newHslColor);
      toast({
          title: 'Sucesso!',
          description: 'A cor de fundo foi atualizada.',
      });
    } else {
       toast({
          variant: 'destructive',
          title: 'Erro!',
          description: 'Formato de cor inválido.',
      });
    }
  }

  const handleRestoreTheme = () => {
    setBackgroundColor(''); // Pass empty string to signal reset to default for current theme
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
              onValueChange={(newTheme) => {
                setTheme(newTheme);
                // When theme changes, we might need to reset the background color
                // to the default of the new theme if it's not custom.
                if(!localStorage.getItem(APP_BG_COLOR_KEY)) {
                    const isDark = newTheme === 'dark' || (newTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                    setBackgroundColor(isDark ? DEFAULT_BG_COLOR_DARK : DEFAULT_BG_COLOR_LIGHT);
                }
              }}
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
                value={localBgColorHex}
                onChange={(e) => setLocalBgColorHex(e.target.value)}
                className="p-1 h-10 w-14"
              />
              <Input
                value={localBgColorHex}
                onChange={(e) => setLocalBgColorHex(e.target.value)}
                placeholder="#f0f7f7"
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
