
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart2,
  DollarSign,
  Home,
  Music,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Painel', icon: Home },
  { href: '/events', label: 'Eventos', icon: Users },
  { href: '/clients', label: 'Clientes', icon: Users },
  { href: '/artists', label: 'Artistas', icon: Music },
  { href: '/finances', label: 'Finanças', icon: DollarSign },
  { href: '/reports', label: 'Relatórios', icon: BarChart2 },
];

export function MainNav() {
  const pathname = usePathname();

  return (
    <TooltipProvider>
      <div className="flex w-full justify-around items-center">
        {navItems.map((item) => (
            <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                    <Button
                        asChild
                        variant="ghost"
                        size="icon"
                        className={cn("h-12 w-12 flex flex-col gap-1 text-muted-foreground", pathname.startsWith(item.href) && "text-primary bg-primary/10")}
                    >
                        <Link href={item.href}>
                        <item.icon className="h-5 w-5" />
                        <span className="text-xs">{item.label}</span>
                        </Link>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{item.label}</p>
                </TooltipContent>
            </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
