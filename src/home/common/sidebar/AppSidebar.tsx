import { supabase } from "@/lib/supabaseClient";
import { NavLink, useNavigate } from "react-router-dom";
import { ShoppingBasket, Home, List, Settings, LogOut, Wallet } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
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
    title: "Abrechungen",
    url: "/billings",
    icon: Wallet,
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
    else setOpen(true);
  };
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  };

  const { isAdmin } = useAuth(); 

  return (
    <Sidebar className="transition-colors duration-500">
      <SidebarContent className="transition-colors duration-500">
        <SidebarGroup className="transition-colors duration-500">
          <SidebarGroupLabel>DigiCart</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="transition-colors duration-500">
             {items
                .filter((item) => !item.adminOnly || isAdmin) // 👈 filtern
                .map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} onClick={closeSidebar}>
                      <item.icon />
                      <span className="text-lg md:text-base">{item.title}</span>
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
