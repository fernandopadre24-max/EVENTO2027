
'use client';

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { MainNav } from '@/components/main-nav';
import { UserNav } from '@/components/user-nav';
import { Calculator } from '@/components/calculator';
import { ThemeToggle } from '@/components/theme-toggle';
import { BandMateLogo } from '@/components/icons';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FirebaseClientProvider } from '@/firebase';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <FirebaseClientProvider>
      <SidebarProvider>
        <Sidebar side="left" variant="sidebar" collapsible="icon">
          <SidebarHeader className="p-4">
            <Button variant="ghost" className="h-10 w-full justify-start gap-2 px-2" asChild>
              <Link href="/dashboard">
                <BandMateLogo className="w-8 h-8 text-primary" />
                <span className="text-xl font-bold font-headline group-data-[collapsible=icon]:hidden">
                  BandMate
                </span>
              </Link>
            </Button>
          </SidebarHeader>
          <SidebarContent className="p-2">
            <MainNav />
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
          <header className="sticky top-0 z-10 flex items-center justify-between h-16 px-4 bg-background/80 backdrop-blur-sm border-b md:px-8">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="md:hidden" />
            </div>
            <div className="flex items-center gap-4">
              <Calculator />
              <ThemeToggle />
              <UserNav />
            </div>
          </header>
          <main className="min-h-[calc(100vh-4rem)] p-4 md:p-8">
              {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </FirebaseClientProvider>
  );
}
