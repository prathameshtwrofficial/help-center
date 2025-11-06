import { Outlet } from "react-router-dom";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Navbar } from "@/components/common/Navbar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

export default function AdminLayout() {
  return (
    <div className="min-h-screen flex flex-col w-full bg-background">
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AdminSidebar />
          <SidebarInset className="flex-1 overflow-auto">
            <Navbar />
            <main className="flex-1 p-6 bg-background mt-16">
              <Outlet />
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}