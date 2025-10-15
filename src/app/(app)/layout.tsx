
'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { MainNav } from '@/components/main-nav';
import { UserNav } from '@/components/user-nav';
import { Calculator } from '@/components/calculator';
import { ThemeToggle } from '@/components/theme-toggle';
import { BandMateLogo } from '@/components/icons';
import { useUser } from '@/firebase';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

const topLevelRoutes = [
  '/dashboard',
  '/events',
  '/clients',
  '/artists',
  '/finances',
  '/reports',
  '/calendar',
  '/profile',
  '/settings'
];


export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

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

  const isTopLevel = topLevelRoutes.includes(pathname);


  // If user is loaded and present, render the app layout
  return (
    <div className="flex flex-col h-screen">
       <header className="sticky top-0 z-10 flex items-center justify-between h-16 px-4 bg-background/80 backdrop-blur-sm border-b md:px-8">
          <div className="flex items-center gap-4">
            {!isTopLevel && (
              <Button variant="ghost" size="icon" onClick={() => router.back()}>
                <ArrowLeft />
              </Button>
            )}
            <Link href="/dashboard" className={cn("flex items-center gap-2", !isTopLevel && "hidden sm:flex")}>
                <BandMateLogo className="w-8 h-8 text-primary" />
                <span className="text-xl font-bold font-headline hidden sm:inline-block">
                    BandMate
                </span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Calculator />
            <ThemeToggle />
            <UserNav />
          </div>
        </header>
      <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-20">
        {children}
      </main>
      <nav className="fixed bottom-0 z-10 w-full flex items-center justify-center h-16 px-4 bg-background/80 backdrop-blur-sm border-t">
          <MainNav />
      </nav>
    </div>
  );
}
