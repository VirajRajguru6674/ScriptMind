import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";

export function AppLayout() {
    return (
        <div className="flex h-screen bg-background overflow-hidden selection:bg-primary/20">
            <Sidebar />
            <main className="flex-1 flex flex-col min-w-0 lg:ml-[280px] h-full overflow-hidden">
                <Outlet />
            </main>
        </div>
    );
}
