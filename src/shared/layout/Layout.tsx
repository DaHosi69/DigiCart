import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AppSidebar from "@/home/common/sidebar/AppSidebar";

export default function Layout() {
  return (
    <SidebarProvider defaultOpen={false}>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 bg-gradient-to-t from-white to-gray-500
           dark:bg-gradient-to-t dark:from-zinc-900 dark:to-zinc-700
           transition-colors duration-500"
>
          <div className="p-2">
            <SidebarTrigger />
          </div>
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
