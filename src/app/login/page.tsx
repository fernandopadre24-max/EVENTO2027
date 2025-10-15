
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser, initiateAnonymousSignIn } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BandMateLogo } from '@/components/icons';

export default function LoginPage() {
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isUserLoading, router]);

  const handleAnonymousLogin = () => {
    if (auth) {
      initiateAnonymousSignIn(auth);
    }
  };

  if (isUserLoading || user) {
    return (
        <div className="flex h-screen items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <BandMateLogo className="w-16 h-16 text-primary animate-pulse" />
                <p className="text-muted-foreground">Carregando...</p>
            </div>
        </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <BandMateLogo className="w-16 h-16 text-primary" />
          </div>
          <CardTitle className="text-2xl font-headline">Bem-vindo ao BandMate</CardTitle>
          <CardDescription>Gerencie seus eventos musicais com facilidade.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <Button onClick={handleAnonymousLogin} className="w-full">
              Entrar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
