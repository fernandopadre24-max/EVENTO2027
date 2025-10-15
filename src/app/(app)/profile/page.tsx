
'use client';

import { useState, useEffect } from 'react';
import { useAuth, useUser } from '@/firebase';
import { updateProfile } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function ProfilePage() {
  const auth = useAuth();
  const { user } = useUser();
  const { toast } = useToast();
  
  const [displayName, setDisplayName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user?.displayName) {
      setDisplayName(user.displayName);
    }
  }, [user]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !auth.currentUser) return;

    setIsSaving(true);
    try {
      await updateProfile(auth.currentUser, { displayName });
      toast({
        title: 'Sucesso!',
        description: 'Seu perfil foi atualizado.',
      });
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast({
        variant: 'destructive',
        title: 'Erro!',
        description: 'Não foi possível atualizar seu perfil.',
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const userAvatar = user?.photoURL || `https://i.pravatar.cc/150?u=${user?.uid}`
  const userFallback = user?.displayName?.substring(0,2).toUpperCase() || user?.email?.substring(0,2).toUpperCase() || 'U';


  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight font-headline">
        Perfil
      </h1>
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Detalhes do Perfil</CardTitle>
          <CardDescription>Atualize suas informações pessoais aqui.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileUpdate} className="space-y-6">
            <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20">
                    <AvatarImage src={userAvatar} />
                    <AvatarFallback>{userFallback}</AvatarFallback>
                </Avatar>
                <Button type="button" variant="outline" disabled>Alterar Foto</Button>
            </div>
            <div className="space-y-2">
              <Label htmlFor="displayName">Nome</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={user?.email || ''}
                disabled
              />
            </div>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
