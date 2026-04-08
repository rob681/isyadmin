"use client";

import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useSidebar } from "./sidebar-context";
import { Sheet } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ArrowLeftRight,
  FileText,
  FileCheck,
  CreditCard,
  RefreshCw,
  Bell,
  Settings,
  LogOut,
  Menu,
  Sun,
  Moon,
  Plus,
} from "lucide-react";
import { useTheme } from "next-themes";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/cuentas", label: "Mis cuentas", icon: CreditCard },
  { href: "/movimientos", label: "Movimientos", icon: ArrowLeftRight },
  { href: "/facturas", label: "Facturas", icon: FileCheck },
  { href: "/estados-cuenta", label: "Estados de cuenta", icon: FileText },
  { href: "/recurrentes", label: "Recurrentes", icon: RefreshCw },
  { href: "/alertas", label: "Alertas", icon: Bell },
];

const CONFIG_ITEMS = [
  { href: "/configuracion", label: "Configuración", icon: Settings },
];

function SidebarContent() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const { closeMobile } = useSidebar();
  const { theme, setTheme } = useTheme();

  const navigate = (href: string) => {
    router.push(href);
    closeMobile();
  };

  const user = session?.user as any;

  return (
    <div className="flex flex-col h-full bg-[hsl(var(--sidebar))]">
      {/* Logo */}
      <div className="p-6 pb-4">
        <h1 className="text-xl font-bold gradient-text font-display">IsyAdmin</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Tu dinero, claro y simple</p>
      </div>

      {/* Quick action */}
      <div className="px-4 mb-4">
        <button
          type="button"
          onClick={() => navigate("/movimientos/nuevo")}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl gradient-primary text-white text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" />
          Agregar movimiento
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <button
              key={item.href}
              type="button"
              onClick={() => navigate(item.href)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <item.icon className="h-4.5 w-4.5" />
              {item.label}
              {item.href === "/alertas" && (
                <AlertBadge />
              )}
            </button>
          );
        })}

        <div className="h-px bg-border my-3" />

        {CONFIG_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <button
              key={item.href}
              type="button"
              onClick={() => navigate(item.href)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <item.icon className="h-4.5 w-4.5" />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t space-y-3">
        {/* Theme toggle */}
        <button
          type="button"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {theme === "dark" ? "Modo claro" : "Modo oscuro"}
        </button>

        {/* User info */}
        {user && (
          <div className="flex items-center gap-3 px-3">
            <div className="h-8 w-8 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold">
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-muted-foreground hover:text-foreground transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function AlertBadge() {
  // This will use tRPC to show unread count - for now static placeholder
  return null;
}

export function Sidebar() {
  const { isMobileOpen, closeMobile } = useSidebar();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-[260px] md:flex-col md:fixed md:inset-y-0 border-r bg-[hsl(var(--sidebar))]">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={isMobileOpen} onOpenChange={closeMobile} side="left">
        <SidebarContent />
      </Sheet>
    </>
  );
}

export function MobileHeader() {
  const { openMobile } = useSidebar();

  return (
    <header className="md:hidden sticky top-0 z-40 flex items-center justify-between h-14 px-4 border-b bg-background/95 backdrop-blur-sm">
      <button type="button" onClick={openMobile} className="p-2 -ml-2">
        <Menu className="h-5 w-5" />
      </button>
      <h1 className="text-lg font-bold gradient-text font-display">IsyAdmin</h1>
      <div className="w-9" /> {/* Spacer for centering */}
    </header>
  );
}
