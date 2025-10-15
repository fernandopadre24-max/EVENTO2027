'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart2,
  Calendar,
  DollarSign,
  Home,
  Music,
  Users,
} from 'lucide-react';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';

const navItems = [
  { href: '/dashboard', label: 'Painel', icon: Home },
  { href: '/events', label: 'Eventos', icon: Calendar },
  { href: '/calendar', label: 'Calendário', icon: Calendar },
  { href: '/clients', label: 'Clientes', icon: Users },
  { href: '/artists', label: 'Artistas', icon: Music },
  { href: '/finances', label: 'Finanças', icon: DollarSign },
  { href: '/reports', label: 'Relatórios', icon: BarChart2 },
];

export function MainNav() {
  const pathname = usePathname();

  return (
    <SidebarMenu>
      {navItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <SidebarMenuButton
            asChild
            isActive={pathname === item.href}
            tooltip={item.label}
          >
            <Link href={item.href}>
              <item.icon />
              <span>{item.label}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
