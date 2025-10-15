
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { useUser } from '@/firebase';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    // If loading is finished and there's no user, redirect to login
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  // While loading, you can show a loader or null
  if (isUserLoading || !user) {
    return (
        <div className="flex h-screen items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <BandMateLogo className="w-16 h-16 text-primary animate-pulse" />
                <p className="text-muted-foreground">Carregando...</p>
            </div>
        </div>
    );
  }

  // If user is loaded and present, render the app layout
  return (
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
  );
}
