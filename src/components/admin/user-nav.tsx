"use client";

import Image from "next/image";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";
import { PlaceHolderImages } from "@/lib/placeholder-images";

export function UserNav() {
  const userAvatar = PlaceHolderImages.find(
    (img) => img.id === "user-avatar-1"
  );
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleLogout = async () => {
    setIsDropdownOpen(false);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="rounded-full border-2 border-transparent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        {userAvatar && (
          <Image
            src={userAvatar.imageUrl}
            width={36}
            height={36}
            alt="User Avatar"
            className="rounded-full"
            data-ai-hint={userAvatar.imageHint}
          />
        )}
        <span className="sr-only">Toggle user menu</span>
      </button>
      {isDropdownOpen && (
        <div
          className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-card py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="user-menu-button"
          tabIndex={-1}
        >
          <button
            onClick={handleLogout}
            className="flex items-center w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted"
            role="menuitem"
            tabIndex={-1}
            id="user-menu-item-1"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </button>
        </div>
      )}
    </div>
  );
}
