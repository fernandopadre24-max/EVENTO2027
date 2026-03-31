
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart2,
  Calendar,
  DollarSign,
  Home,
  Music,
  Settings,
  Users,
  Banknote,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';


const navItems = [
  { href: '/dashboard', label: 'Painel', icon: Home },
  { href: '/events', label: 'Eventos', icon: Calendar },
  { href: '/clients', label: 'Clientes', icon: Users },
  { href: '/artists', label: 'Artistas', icon: Music },
  { href: '/purchases', label: 'Pagar', icon: DollarSign },
  { href: '/loans', label: 'Empréstimos', icon: Banknote },
  { href: '/reports', label: 'Relatórios', icon: BarChart2 },
];

export function MainNav() {
  const pathname = usePathname();

  return (
      <div className="flex w-full justify-around items-center">
        {navItems.map((item) => (
            <Button
                key={item.href}
                asChild
                variant="ghost"
                size="sm"
                className={cn(
                    "flex-col h-14 w-14 gap-1 text-muted-foreground rounded-lg",
                    pathname === item.href && "text-primary bg-primary/10"
                )}
            >
                <Link href={item.href}>
                    <item.icon className="h-5 w-5" />
                    <span className="text-xs font-medium">{item.label}</span>
                </Link>
            </Button>
        ))}
      </div>
  );
}
