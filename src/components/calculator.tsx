
"use client";

import { useState } from 'react';
import { Calculator as CalculatorIcon, ArrowRight } from 'lucide-react';
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
  const [memory, setMemory] = useState<number>(0);

  const evaluateExpression = (expr: string) => {
    try {
      let expression = expr.replace(/%/g, '*0.01').replace(/,/g, '.').replace(/×/g, '*').replace(/÷/g, '/');
      // eslint-disable-next-line no-eval
      const evalResult = eval(expression);
      if (evalResult !== undefined && !isNaN(evalResult) && evalResult !== Infinity) {
        return Number(evalResult.toFixed(8));
      }
      return null;
    } catch {
      return null;
    }
  };

  const calculate = () => {
    if (!input) return;
    const res = evaluateExpression(input);
    if (res !== null) {
      const formattedResult = res.toString().replace(/\./g, ',');
      setResult(formattedResult);
      setInput(formattedResult);
    } else {
      setResult('Erro');
    }
  };

  const handleButtonClick = (value: string) => {
    if (value === '=') {
      calculate();
    } else if (value === 'AC') {
      setInput('');
      setResult('');
    } else if (value === 'OFF') {
      setIsOpen(false);
    } else if (value === 'DEL') {
      setInput(prev => prev.slice(0, -1) || '');
      setResult('');
    } else if (value === 'MC') {
      setMemory(0);
    } else if (value === 'MR') {
      if (memory !== 0) {
        setInput(input + memory.toString().replace(/\./g, ','));
      }
    } else if (value === 'M+') {
      const currentVal = result ? evaluateExpression(result) : evaluateExpression(input);
      if (currentVal !== null) setMemory(memory + currentVal);
    } else if (value === 'M-') {
      const currentVal = result ? evaluateExpression(result) : evaluateExpression(input);
      if (currentVal !== null) setMemory(memory - currentVal);
    } else if (value === '√') {
       const currentVal = result ? evaluateExpression(result) : evaluateExpression(input);
       if (currentVal !== null && currentVal >= 0) {
         const root = Math.sqrt(currentVal);
         const formatted = Number(root.toFixed(8)).toString().replace(/\./g, ',');
         setResult(formatted);
         setInput(formatted);
       } else {
         setResult('Erro');
       }
    } else if (['MU', 'GT'].includes(value)) {
       // Placeholder
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

  const topButtons = [
    { label: 'AC', value: 'AC', style: 'bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-bold px-3 py-1.5 shadow-[0_2px_0_rgba(30,58,138,0.8)] active:shadow-none active:translate-y-[2px] border border-blue-900' },
    { label: <ArrowRight className="w-3 h-3" />, value: 'DEL', style: 'bg-[#9ca3af] hover:bg-[#828a96] text-zinc-900 rounded-full text-xs px-3 py-1.5 shadow-[0_2px_0_rgba(107,114,128,0.8)] active:shadow-none active:translate-y-[2px] border border-gray-600 flex items-center justify-center' },
    { label: 'MU', value: 'MU', style: 'bg-[#9ca3af] hover:bg-[#828a96] text-zinc-900 rounded-full text-[10px] sm:text-xs font-bold px-2 py-1.5 shadow-[0_2px_0_rgba(107,114,128,0.8)] active:shadow-none active:translate-y-[2px] border border-gray-600' },
    { label: 'GT', value: 'GT', style: 'bg-[#9ca3af] hover:bg-[#828a96] text-zinc-900 rounded-full text-[10px] sm:text-xs font-bold px-2 py-1.5 shadow-[0_2px_0_rgba(107,114,128,0.8)] active:shadow-none active:translate-y-[2px] border border-gray-600' },
    { label: '%', value: '%', style: 'bg-[#9ca3af] hover:bg-[#828a96] text-zinc-900 rounded-full text-xs font-bold px-3 py-1.5 shadow-[0_2px_0_rgba(107,114,128,0.8)] active:shadow-none active:translate-y-[2px] border border-gray-600' },
    { label: '√', value: '√', style: 'bg-[#9ca3af] hover:bg-[#828a96] text-zinc-900 rounded-full text-xs font-bold px-3 py-1.5 shadow-[0_2px_0_rgba(107,114,128,0.8)] active:shadow-none active:translate-y-[2px] border border-gray-600' },
    { label: 'OFF', value: 'OFF', style: 'bg-blue-600 hover:bg-blue-700 text-white rounded-full text-[10px] sm:text-xs font-bold px-2 py-1.5 shadow-[0_2px_0_rgba(30,58,138,0.8)] active:shadow-none active:translate-y-[2px] border border-blue-900' },
  ];

  const mainButtonStyle = "rounded-lg sm:rounded-xl font-bold text-xl sm:text-2xl shadow-[0_4px_0_rgba(0,0,0,0.4)] active:shadow-none active:translate-y-[4px] transition-all flex items-center justify-center border border-zinc-800/80 active:border-transparent select-none";
  const numStyle = `${mainButtonStyle} bg-zinc-900 hover:bg-zinc-800 text-zinc-100`;
  const opStyle = `${mainButtonStyle} bg-zinc-600 hover:bg-zinc-500 text-zinc-100`;

  const mainButtons = [
    { label: '7', value: '7', col: '', row: '', style: numStyle },
    { label: '8', value: '8', col: '', row: '', style: numStyle },
    { label: '9', value: '9', col: '', row: '', style: numStyle },
    { label: '÷', value: '÷', col: '', row: '', style: opStyle },
    { label: 'MC', value: 'MC', col: '', row: '', style: `${opStyle} !text-sm` },
    
    { label: '4', value: '4', col: '', row: '', style: numStyle },
    { label: '5', value: '5', col: '', row: '', style: numStyle },
    { label: '6', value: '6', col: '', row: '', style: numStyle },
    { label: '×', value: '×', col: '', row: '', style: opStyle },
    { label: 'MR', value: 'MR', col: '', row: '', style: `${opStyle} !text-sm` },
    
    { label: '1', value: '1', col: '', row: '', style: numStyle },
    { label: '2', value: '2', col: '', row: '', style: numStyle },
    { label: '3', value: '3', col: '', row: '', style: numStyle },
    { label: '-', value: '-', col: '', row: '', style: opStyle },
    { label: 'M-', value: 'M-', col: '', row: '', style: `${opStyle} !text-sm` },
    
    { label: '0', value: '0', col: '', row: '', style: numStyle },
    { label: '00', value: '00', col: '', row: '', style: `${numStyle} !text-lg` },
    { label: '.', value: ',', col: '', row: '', style: numStyle },
    { label: '+', value: '+', col: '', row: 'row-span-2', style: `${opStyle} !text-3xl` },
    { label: 'M+', value: 'M+', col: '', row: '', style: `${opStyle} !text-sm` },
    
    { label: '=', value: '=', col: 'col-start-5', row: '', style: opStyle },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="relative group border-cyan-500/30 hover:border-cyan-400/60 transition-colors">
          <CalculatorIcon className="h-5 w-5 text-cyan-400 group-hover:text-cyan-300 transition-colors" />
          <span className="sr-only">Abrir Calculadora</span>
        </Button>
      </DialogTrigger>
      
      {/* Calculadora container casing */}
      <DialogContent className="sm:max-w-md w-[95vw] border-2 border-zinc-400/80 shadow-[0_10px_40px_rgba(0,0,0,0.5),inset_0_|2px_4px_rgba(255,255,255,0.8)] rounded-[2rem] p-4 sm:p-6 bg-gradient-to-br from-[#f0f0f0] via-[#d4d4d4] to-[#a3a3a3] overflow-hidden !outline-none">
        
        {/* Header Brands */}
        <div className="flex justify-between items-center px-1 mb-1 text-zinc-800 tracking-wide drop-shadow-sm select-none">
          <div className="font-extrabold text-base sm:text-xl flex items-center gap-1">
            <span className="border-b-2 border-zinc-800 pb-[1px]">MB</span>tech
          </div>
          <div className="font-semibold text-xs sm:text-sm">MB54303</div>
        </div>

        {/* Screen LCD */}
        <div className="relative p-1.5 sm:p-2.5 rounded-lg bg-[#b5b8a6] shadow-[inset_0_4px_10px_rgba(0,0,0,0.3)] border border-zinc-500/50 mb-1">
          {memory !== 0 && (
            <div className="absolute top-2 left-3 text-[10px] font-bold text-black/60">M</div>
          )}
          <div className="flex flex-col items-end justify-end min-h-[4rem] sm:min-h-[5rem] font-mono text-black overflow-hidden relative">
            <div className="text-xs sm:text-sm text-black/50 tracking-wider break-all min-h-[16px]">
              {input}
            </div>
            <div className="text-4xl sm:text-5xl font-medium tracking-tighter break-all">
              {result === 'Erro' ? result : (result || input || '0')}
            </div>
          </div>
        </div>
        
        {/* Sub label */}
        <div className="text-center text-zinc-600 italic font-semibold text-[10px] sm:text-xs mb-4 pb-2 border-b border-zinc-400/50 drop-shadow-sm select-none">
          Electronic Calculator
        </div>

        {/* Top small buttons row */}
        <div className="flex justify-between items-center mb-4 gap-1 sm:gap-1.5 px-0.5 sm:px-1">
          {topButtons.map((btn, index) => (
            <button
              key={index}
              onClick={() => handleButtonClick(btn.value)}
              className={btn.style}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-5 gap-2 sm:gap-3 auto-rows-[3rem] sm:auto-rows-[3.5rem] px-0.5 sm:px-1 mb-2">
          {mainButtons.map((btn, index) => (
            <button
              key={index}
              onClick={() => handleButtonClick(btn.value)}
              className={`${btn.col} ${btn.row} ${btn.style}`}
            >
              {btn.label}
            </button>
          ))}
        </div>

      </DialogContent>
    </Dialog>
  );
}
