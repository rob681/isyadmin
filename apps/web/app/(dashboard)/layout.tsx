import { SidebarProvider } from "@/components/layout/sidebar-context";
import { Sidebar, MobileHeader } from "@/components/layout/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="min-h-screen">
        <Sidebar />
        <MobileHeader />
        <main className="md:pl-[260px]">
          <div className="max-w-5xl mx-auto p-4 md:p-8">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
