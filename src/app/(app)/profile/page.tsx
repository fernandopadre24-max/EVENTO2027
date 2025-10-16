
'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth, useUser } from '@/firebase';
import { updateProfile } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Camera, Upload, Loader2 } from 'lucide-react';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import { useFirebaseApp } from '@/firebase';

export default function ProfilePage() {
  const auth = useAuth();
  const { user } = useUser();
  const firebaseApp = useFirebaseApp();
  const storage = getStorage(firebaseApp);
  const { toast } = useToast();
  
  const [displayName, setDisplayName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [isCameraOpen, setCameraOpen] = useState(false);
  const [isUploadOpen, setUploadOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (user?.displayName) {
      setDisplayName(user.displayName);
    }
  }, [user]);

  useEffect(() => {
    if (isCameraOpen) {
      const getCameraPermission = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (error) {
          console.error('Error accessing camera:', error);
          toast({
            variant: 'destructive',
            title: 'Acesso à Câmera Negado',
            description: 'Por favor, habilite as permissões da câmera nas configurações do seu navegador.',
          });
          setCameraOpen(false);
        }
      };
      getCameraPermission();
    } else {
        // Stop camera stream when dialog closes
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
    }
  }, [isCameraOpen, toast]);

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

  const uploadProfilePicture = async (dataUrl: string) => {
    if (!user || !auth.currentUser) return;
    setIsUploading(true);

    const storageRef = ref(storage, `profile-pictures/${user.uid}`);
    
    try {
      await uploadString(storageRef, dataUrl, 'data_url');
      const downloadURL = await getDownloadURL(storageRef);
      await updateProfile(auth.currentUser, { photoURL: downloadURL });
      
      toast({
        title: 'Sucesso!',
        description: 'Sua foto de perfil foi atualizada.',
      });
    } catch (error) {
        console.error("Upload failed", error);
        toast({
            variant: "destructive",
            title: "Erro no Upload",
            description: "Não foi possível salvar sua nova foto de perfil.",
        });
    } finally {
        setIsUploading(false);
        setCameraOpen(false);
        setUploadOpen(false);
    }
  };

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        const context = canvas.getContext('2d');
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        
        const dataUrl = canvas.toDataURL('image/jpeg');
        uploadProfilePicture(dataUrl);
    }
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        if (dataUrl) {
          uploadProfilePicture(dataUrl);
        }
      };
      reader.readAsDataURL(file);
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
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button type="button" variant="outline">Alterar Foto</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => setCameraOpen(true)}>
                            <Camera className="mr-2 h-4 w-4" />
                            Tirar Foto
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setUploadOpen(true)}>
                            <Upload className="mr-2 h-4 w-4" />
                            Fazer Upload
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
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

        {/* Camera Dialog */}
        <Dialog open={isCameraOpen} onOpenChange={setCameraOpen}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Tirar Foto</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col items-center gap-4">
                    <video ref={videoRef} className="w-full aspect-video rounded-md bg-muted" autoPlay muted />
                    <canvas ref={canvasRef} className="hidden"></canvas>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="ghost">Cancelar</Button>
                    </DialogClose>
                    <Button onClick={handleCapture} disabled={isUploading}>
                        {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Camera className="mr-2 h-4 w-4" />}
                        Capturar e Salvar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        {/* Upload Dialog */}
        <Dialog open={isUploadOpen} onOpenChange={setUploadOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Fazer Upload da Imagem</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col items-center justify-center gap-4 p-8 border-2 border-dashed rounded-lg">
                     <Upload className="h-12 w-12 text-muted-foreground" />
                    <p className="text-muted-foreground text-center">Arraste e solte um arquivo ou clique abaixo</p>
                    <Button asChild variant="outline">
                        <label htmlFor="file-upload">
                            Selecionar Arquivo
                            <input id="file-upload" type="file" accept="image/*" className="sr-only" onChange={handleFileChange} disabled={isUploading} />
                        </label>
                    </Button>
                    {isUploading && (
                        <div className='flex items-center gap-2 mt-4'>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <p className='text-sm text-muted-foreground'>Enviando...</p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    </div>
  );
}

    
