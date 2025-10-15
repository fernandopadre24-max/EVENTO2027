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
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/events', label: 'Events', icon: Calendar },
  { href: '/calendar', label: 'Calendar View', icon: Calendar },
  { href: '/clients', label: 'Clients', icon: Users },
  { href: '/artists', label: 'Artists', icon: Music },
  { href: '/finances', label: 'Finances', icon: DollarSign },
  { href: '/reports', label: 'Reports', icon: BarChart2 },
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
