import { useState, useEffect } from "react";
import { LogOut, User, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface UserData {
    firstName: string;
    lastName: string;
    email: string;
}

interface UserAvatarMenuProps {
    userData: UserData | null;
    onDashboard: () => void;
    onSignOut: () => void;
}

export function UserAvatarMenu({ userData, onDashboard, onSignOut }: UserAvatarMenuProps) {
    const [isOpen, setIsOpen] = useState(false);

    // Don't render if no user data
    if (!userData) return null;

    // Generate initials from name
    const getInitials = (firstName: string, lastName: string) => {
        const first = firstName?.charAt(0)?.toUpperCase() || '';
        const last = lastName?.charAt(0)?.toUpperCase() || '';

        if (first && last) {
            return first + last;
        } else if (first && firstName.length >= 2) {
            // If only one name, use first two letters
            return first + (firstName.charAt(1)?.toUpperCase() || '');
        } else {
            return first || 'U';
        }
    };

    const initials = getInitials(userData.firstName, userData.lastName);
    const fullName = `${userData.firstName} ${userData.lastName}`.trim();

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    className="relative h-10 w-10 rounded-full hover:bg-muted/50 transition-colors"
                >
                    <Avatar className="h-9 w-9 bg-primary text-primary-foreground">
                        <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-sm">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium text-sm">{fullName}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {userData.email}
                        </p>
                    </div>
                </div>

                <DropdownMenuSeparator />

                <DropdownMenuGroup>
                    <DropdownMenuItem onClick={onDashboard} className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        <span>Dashboard</span>
                    </DropdownMenuItem>
                </DropdownMenuGroup>

                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={onSignOut} className="cursor-pointer text-red-600 focus:text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign Out</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}