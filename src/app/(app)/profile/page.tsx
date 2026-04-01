
'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth, useUser, useFirebase } from '@/firebase';
import { updateProfile } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Camera, Upload, Loader2, Pencil, User, Mail, CheckCircle2 } from 'lucide-react';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';

export default function ProfilePage() {
  const auth = useAuth();
  const { user } = useUser();
  const { services } = useFirebase();
  const storage = services.storage;
  const { toast } = useToast();

  const [displayName, setDisplayName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [isCameraOpen, setCameraOpen] = useState(false);
  const [isUploadOpen, setUploadOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user?.displayName) setDisplayName(user.displayName);
  }, [user]);

  // Camera stream management
  useEffect(() => {
    if (isCameraOpen) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
        .then((stream) => {
          if (videoRef.current) videoRef.current.srcObject = stream;
        })
        .catch(() => {
          toast({ variant: 'destructive', title: 'Câmera não disponível', description: 'Verifique as permissões do navegador.' });
          setCameraOpen(false);
        });
    } else {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
        videoRef.current.srcObject = null;
      }
    }
  }, [isCameraOpen, toast]);

  const uploadPhoto = async (dataUrl: string) => {
    if (!user || !auth.currentUser) return;
    setIsUploading(true);
    try {
      const storageRef = ref(storage, `profile-pictures/${user.uid}`);
      await uploadString(storageRef, dataUrl, 'data_url');
      const downloadURL = await getDownloadURL(storageRef);
      await updateProfile(auth.currentUser, { photoURL: downloadURL });
      toast({ title: '✅ Foto atualizada!', description: 'Sua foto de perfil foi salva com sucesso.' });
      setUploadOpen(false);
      setCameraOpen(false);
      setPreviewUrl(null);
    } catch (error) {
      console.error('Upload error:', error);
      toast({ variant: 'destructive', title: 'Erro no upload', description: 'Não foi possível salvar a foto. Tente novamente.' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    uploadPhoto(canvas.toDataURL('image/jpeg', 0.9));
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({ variant: 'destructive', title: 'Arquivo inválido', description: 'Por favor selecione uma imagem.' });
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setPreviewUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !auth.currentUser) return;
    setIsSaving(true);
    try {
      await updateProfile(auth.currentUser, { displayName });
      setSaveSuccess(true);
      toast({ title: '✅ Perfil atualizado!', description: 'Seu nome foi salvo.' });
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      toast({ variant: 'destructive', title: 'Erro!', description: 'Não foi possível atualizar seu perfil.' });
    } finally {
      setIsSaving(false);
    }
  };

  const userAvatar = user?.photoURL || `https://i.pravatar.cc/150?u=${user?.uid}`;
  const userFallback = user?.displayName?.substring(0, 2).toUpperCase() || user?.email?.substring(0, 2).toUpperCase() || 'U';

  return (
    <div className="space-y-8 max-w-2xl">
      <h1 className="text-3xl font-bold tracking-tight font-headline">Perfil</h1>

      {/* Foto de Perfil */}
      <Card>
        <CardHeader>
          <CardTitle>Foto de Perfil</CardTitle>
          <CardDescription>Clique na foto ou escolha uma opção para atualizar.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Avatar clicável */}
            <div className="relative group cursor-pointer" onClick={() => setUploadOpen(true)}>
              <Avatar className="h-28 w-28 border-4 border-border shadow-lg">
                <AvatarImage src={userAvatar} alt="Foto de perfil" />
                <AvatarFallback className="text-2xl font-bold">{userFallback}</AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Pencil className="h-6 w-6 text-white" />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">Escolha como deseja alterar sua foto:</p>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => setUploadOpen(true)}>
                  <Upload className="mr-2 h-4 w-4" />
                  Enviar Arquivo
                </Button>
                <Button variant="outline" onClick={() => setCameraOpen(true)}>
                  <Camera className="mr-2 h-4 w-4" />
                  Usar Câmera
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">JPG, PNG ou GIF. Máximo 5MB.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informações Pessoais */}
      <Card>
        <CardHeader>
          <CardTitle>Informações Pessoais</CardTitle>
          <CardDescription>Atualize seu nome de exibição.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName" className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" /> Nome
              </Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Seu nome"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" /> Email
              </Label>
              <Input id="email" type="email" value={user?.email || ''} disabled className="opacity-60" />
              <p className="text-xs text-muted-foreground">O email não pode ser alterado aqui.</p>
            </div>
            <Button type="submit" disabled={isSaving} className="w-full sm:w-auto">
              {isSaving ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</>
              ) : saveSuccess ? (
                <><CheckCircle2 className="mr-2 h-4 w-4 text-emerald-400" /> Salvo!</>
              ) : (
                'Salvar Alterações'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Dialog: Upload de arquivo */}
      <Dialog open={isUploadOpen} onOpenChange={(open) => { setUploadOpen(open); if (!open) setPreviewUrl(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enviar Foto de Perfil</DialogTitle>
          </DialogHeader>

          {previewUrl ? (
            <div className="flex flex-col items-center gap-4">
              <img src={previewUrl} alt="Preview" className="h-40 w-40 rounded-full object-cover border-4 border-primary/30 shadow-lg" />
              <p className="text-sm text-muted-foreground">Esta será sua nova foto de perfil.</p>
            </div>
          ) : (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center gap-4 p-10 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                dragOver ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50 hover:bg-muted/50'
              }`}
            >
              <Upload className="h-10 w-10 text-muted-foreground" />
              <div className="text-center">
                <p className="text-sm font-medium">Arraste uma imagem aqui</p>
                <p className="text-xs text-muted-foreground mt-1">ou clique para selecionar</p>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="sr-only" onChange={handleFileChange} />
            </div>
          )}

          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="ghost" onClick={() => setPreviewUrl(null)}>Cancelar</Button>
            </DialogClose>
            {previewUrl && (
              <Button onClick={() => uploadPhoto(previewUrl!)} disabled={isUploading}>
                {isUploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enviando...</> : 'Confirmar Foto'}
              </Button>
            )}
            {!previewUrl && (
              <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                Selecionar Arquivo
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Câmera */}
      <Dialog open={isCameraOpen} onOpenChange={setCameraOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" /> Tirar Foto
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4">
            <video ref={videoRef} className="w-full aspect-video rounded-lg bg-muted" autoPlay muted playsInline />
            <canvas ref={canvasRef} className="hidden" />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Cancelar</Button>
            </DialogClose>
            <Button onClick={handleCapture} disabled={isUploading}>
              {isUploading
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</>
                : <><Camera className="mr-2 h-4 w-4" />Capturar e Salvar</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
