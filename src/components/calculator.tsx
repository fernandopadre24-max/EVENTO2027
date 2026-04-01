
"use client";

import { useState } from 'react';
import { Calculator as CalculatorIcon, Delete } from 'lucide-react';
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
  const [isOpen, setIsOpen] = useState(false);

  const handleButtonClick = (value: string) => {
    if (value === '=') {
      try {
        if (!input) return;
        let expression = input.replace(/%/g, '/100').replace(/,/g, '.').replace(/×/g, '*').replace(/÷/g, '/');
        // Usar eval é geralmente inseguro, mas aceitável para esta calculadora simples e sem rede.
        const evalResult = eval(expression);
        
        if (evalResult !== undefined && !isNaN(evalResult) && evalResult !== Infinity) {
          const formattedResult = Number(evalResult.toFixed(8)).toString().replace(/\./g, ',');
          setResult(formattedResult);
          setInput(formattedResult); 
        } else {
          setResult('Erro');
        }
      } catch (error) {
        setResult('Erro');
      }
    } else if (value === 'C') {
      setInput('');
      setResult('');
    } else if (value === 'DEL') {
      setInput(prev => prev.slice(0, -1) || '');
      setResult('');
    } else {
      if (result && result !== 'Erro') {
        if (['+', '-', '×', '÷', '%'].includes(value)) {
            setInput(result + value);
        } else {
            setInput(value);
        }
        setResult('');
      } else {
        setInput(input + value);
      }
    }
  };

  const buttons = [
    { label: 'C', value: 'C', style: 'text-red-400 bg-red-500/10 hover:bg-red-500/20 border-red-500/20' },
    { label: <Delete className="h-5 w-5 mx-auto" />, value: 'DEL', style: 'text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/20' },
    { label: '%', value: '%', style: 'text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/20' },
    { label: '÷', value: '÷', style: 'text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/20 text-2xl' },
    { label: '7', value: '7', style: 'bg-zinc-800/50 hover:bg-zinc-700/60 border-zinc-700/50' },
    { label: '8', value: '8', style: 'bg-zinc-800/50 hover:bg-zinc-700/60 border-zinc-700/50' },
    { label: '9', value: '9', style: 'bg-zinc-800/50 hover:bg-zinc-700/60 border-zinc-700/50' },
    { label: '×', value: '×', style: 'text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/20 text-2xl' },
    { label: '4', value: '4', style: 'bg-zinc-800/50 hover:bg-zinc-700/60 border-zinc-700/50' },
    { label: '5', value: '5', style: 'bg-zinc-800/50 hover:bg-zinc-700/60 border-zinc-700/50' },
    { label: '6', value: '6', style: 'bg-zinc-800/50 hover:bg-zinc-700/60 border-zinc-700/50' },
    { label: '-', value: '-', style: 'text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/20 text-2xl' },
    { label: '1', value: '1', style: 'bg-zinc-800/50 hover:bg-zinc-700/60 border-zinc-700/50' },
    { label: '2', value: '2', style: 'bg-zinc-800/50 hover:bg-zinc-700/60 border-zinc-700/50' },
    { label: '3', value: '3', style: 'bg-zinc-800/50 hover:bg-zinc-700/60 border-zinc-700/50' },
    { label: '+', value: '+', style: 'text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/20 text-2xl' },
    { label: '0', value: '0', style: 'col-span-2 bg-zinc-800/50 hover:bg-zinc-700/60 border-zinc-700/50' },
    { label: ',', value: ',', style: 'bg-zinc-800/50 hover:bg-zinc-700/60 border-zinc-700/50' },
    { label: '=', value: '=', style: 'bg-cyan-500 hover:bg-cyan-400 text-black border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)]' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="relative group border-cyan-500/30 hover:border-cyan-400/60 transition-colors">
          <CalculatorIcon className="h-5 w-5 text-cyan-400 group-hover:text-cyan-300 transition-colors" />
          <span className="sr-only">Abrir Calculadora</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xs w-full bg-zinc-950/95 backdrop-blur-xl border-zinc-800/50 shadow-2xl rounded-3xl p-6">
        <DialogHeader className="mb-2">
          <DialogTitle className="text-zinc-200 font-medium text-center">Calculadora</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex flex-col items-end justify-end h-24 p-4 border border-zinc-800/80 rounded-2xl bg-black/60 shadow-inner overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-black/20 to-transparent pointer-events-none" />
            <div className="text-sm text-zinc-500 font-mono tracking-wider break-all min-h-[20px]">{input}</div>
            <div className="text-3xl sm:text-4xl font-light text-white tracking-tight break-all">
              {result === 'Erro' ? result : (result || input || '0')}
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {buttons.map((btn, index) => (
              <button
                key={index}
                onClick={() => handleButtonClick(btn.value)}
                className={`
                  flex items-center justify-center h-[3.25rem] sm:h-14 rounded-xl border font-medium text-xl
                  transition-all duration-200 active:scale-95
                  ${btn.style}
                `}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
