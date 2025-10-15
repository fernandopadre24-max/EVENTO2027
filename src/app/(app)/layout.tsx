
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MainNav } from '@/components/main-nav';
import { UserNav } from '@/components/user-nav';
import { Calculator } from '@/components/calculator';
import { ThemeToggle } from '@/components/theme-toggle';
import { BandMateLogo } from '@/components/icons';
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
    <div className="flex flex-col h-screen">
       <header className="sticky top-0 z-10 flex items-center justify-between h-16 px-4 bg-background/80 backdrop-blur-sm border-b md:px-8">
          <div className="flex items-center gap-4">
            <BandMateLogo className="w-8 h-8 text-primary" />
             <span className="text-xl font-bold font-headline hidden sm:inline-block">
                BandMate
              </span>
          </div>
          <div className="flex items-center gap-4">
            <Calculator />
            <ThemeToggle />
            <UserNav />
          </div>
        </header>
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        {children}
      </main>
      <nav className="sticky bottom-0 z-10 flex items-center justify-center h-16 px-4 bg-background/80 backdrop-blur-sm border-t md:px-8">
          <MainNav />
      </nav>
    </div>
  );
}
