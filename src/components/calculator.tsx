
"use client";

import { useState } from 'react';
import { Calculator as CalculatorIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export function Calculator() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState('');

  const handleButtonClick = (value: string) => {
    if (value === '=') {
      try {
        // Usar eval é geralmente inseguro, mas aceitável para esta calculadora simples e sem rede.
        const evalResult = eval(input.replace(/%/g, '/100').replace(/,/g, '.'));
        setResult(String(evalResult).replace(/\./g, ','));
      } catch (error) {
        setResult('Erro');
      }
    } else if (value === 'C') {
      setInput('');
      setResult('');
    } else {
      if (result) {
        setInput(result + value);
        setResult('');
      } else {
        setInput(input + value);
      }
    }
  };

  const buttons = [
    'C', '%', '/',
    '7', '8', '9', '*',
    '4', '5', '6', '-',
    '1', '2', '3', '+',
    '0', ',', '=',
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <CalculatorIcon className="h-5 w-5" />
          <span className="sr-only">Abrir Calculadora</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xs w-full max-w-[calc(100vw-2rem)]">
        <DialogHeader>
          <DialogTitle>Calculadora</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex flex-col items-end justify-end h-20 p-4 border rounded-lg bg-muted">
            <div className="text-sm text-muted-foreground break-all">{input}</div>
            <div className="text-3xl font-bold">{result || (input.slice(-1) === '=' ? '' : input) || '0'}</div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {buttons.map((btn) => (
              <Button
                key={btn}
                onClick={() => handleButtonClick(btn)}
                variant={
                  'C' === btn ? 'destructive' :
                  '=' === btn ? 'default' : 'outline'
                }
                className={`text-xl font-bold h-14 ${btn === '0' ? 'col-span-2' : ''}`}
              >
                {btn}
              </Button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
