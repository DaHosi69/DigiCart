import { Outlet } from "react-router-dom";
import {
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import AppSidebar from "@/home/common/sidebar/AppSidebar";

function AutoHideTrigger() {
  const { state } = useSidebar();
  return (
    <div className={state === "expanded" ? "hidden" : "block"}>
      <SidebarTrigger className="w-10 h-10 [&_svg]:!size-8" />
    </div>
  );
}

export default function Layout() {
  return (
    <SidebarProvider defaultOpen={false}>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main
          className="flex-1 bg-gradient-to-t from-white to-gray-500
           dark:bg-gradient-to-t dark:from-zinc-900 dark:to-zinc-700
           transition-colors duration-500"
        >
          <div className="p-2">
            <AutoHideTrigger />
          </div>
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
