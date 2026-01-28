import { supabase } from "@/lib/supabaseClient";
import { NavLink, useNavigate } from "react-router-dom";
import {
  ShoppingBasket,
  Home,
  List,
  LogOut,
  Wallet,
  Coins,
  X,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/AuthProvider";

// Menu items.
const items = [
  {
    title: "Übersicht",
    url: "/home",
    icon: Home,
  },
  {
    title: "Listen",
    url: "/lists",
    icon: List,
    adminOnly: true,
  },
  {
    title: "Produkte",
    url: "/products",
    icon: ShoppingBasket,
  },
  {
    title: "Abrechnungen",
    url: "/billings",
    icon: Wallet,
  },
  {
    title: "Schulden",
    url: "/debt",
    icon: Coins,
  },
  /* {
    title: "Einstellungen",
    url: "/home/settings",
    icon: Settings,
  },*/
];

export default function AppSidebar() {
  const navigate = useNavigate();
  const { isMobile, setOpen, setOpenMobile } = useSidebar();

  const closeSidebar = () => {
    if (isMobile) setOpenMobile(false);
    else setOpen(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  };

  const { isAdmin } = useAuth();

  return (
    <Sidebar className="transition-colors duration-500">
      <SidebarHeader className="flex flex-row items-center justify-between p-4">
        <span className="font-bold text-xl">DigiCart</span>
        <Button variant="ghost" size="icon" onClick={closeSidebar}>
          <X className="h-6 w-6 [&_svg]:!size-4" />
        </Button>
      </SidebarHeader>
      <SidebarContent className="transition-colors duration-500">
        <SidebarGroup className="transition-colors duration-500">
          <SidebarGroupContent>
            <SidebarMenu className="transition-colors duration-500">
              {items
                .filter((item) => !item.adminOnly || isAdmin) // 👈 filtern
                .map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url} onClick={closeSidebar}>
                        <item.icon />
                        <span className="text-lg md:text-base">
                          {item.title}
                        </span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              <SidebarMenuItem key={"Logout"}>
                <SidebarMenuButton asChild>
                  <a onClick={handleLogout}>
                    <LogOut />
                    <span className="text-lg md:text-base">Abmelden</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
