import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { useSidebarContext } from "@/context/SidebarContext";
import { cn } from "@/lib/utils";

export function AppLayout() {
    const { isCollapsed } = useSidebarContext();

    return (
        <div className="flex h-screen bg-background overflow-hidden selection:bg-primary/20">
            <Sidebar />
            <main 
                className={cn(
                    "flex-1 flex flex-col min-w-0 h-full overflow-hidden transition-all duration-300 ease-in-out",
                    isCollapsed ? "lg:ml-[68px]" : "lg:ml-[280px]"
                )}
            >
                <Outlet />
            </main>
        </div>
    );
}

