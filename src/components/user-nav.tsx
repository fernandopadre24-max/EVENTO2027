
'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CreditCard, LogOut, Settings, User } from "lucide-react"
import { useAuth } from "@/firebase";
import { signOut } from "firebase/auth";

export function UserNav() {
  const auth = useAuth();

  const handleLogout = () => {
    if (auth) {
      signOut(auth).then(() => {
        sessionStorage.removeItem('anonymous-auth-initiated');
        // Force a reload to clear all states and re-trigger auth checks properly.
        window.location.reload();
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-full justify-start gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src="https://picsum.photos/seed/user/100/100" alt="@user" />
            <AvatarFallback>BM</AvatarFallback>
          </Avatar>
          <div className="flex flex-col space-y-1 items-start">
             <p className="text-sm font-medium leading-none">Gerente</p>
             <p className="text-xs leading-none text-muted-foreground">admin@bandmate.com</p>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">Gerente</p>
            <p className="text-xs leading-none text-muted-foreground">
              admin@bandmate.com
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem disabled>
            <User className="mr-2 h-4 w-4" />
            <span>Perfil</span>
          </DropdownMenuItem>
          <DropdownMenuItem disabled>
            <CreditCard className="mr-2 h-4 w-4" />
            <span>Faturamento</span>
          </DropdownMenuItem>
          <DropdownMenuItem disabled>
            <Settings className="mr-2 h-4 w-4" />
            <span>Configurações</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
