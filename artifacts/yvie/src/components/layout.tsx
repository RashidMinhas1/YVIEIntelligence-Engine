import { FC, ReactNode } from "react";
import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Activity, LayoutDashboard, Search, FileText, Type, History, PlaySquare } from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/competitors", label: "Competitors", icon: Search },
  { href: "/analyze-titles", label: "Analyze Titles", icon: Type },
  { href: "/generate-titles", label: "Generate Titles", icon: FileText },
  { href: "/analyze-script", label: "Analyze Script", icon: Activity },
  { href: "/generate-script", label: "Generate Script", icon: PlaySquare },
  { href: "/history", label: "History", icon: History },
];

export const Layout: FC<LayoutProps> = ({ children }) => {
  const [location] = useLocation();

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
        <Sidebar className="border-r border-border">
          <SidebarHeader className="h-16 flex items-center px-4 border-b border-border">
            <h1 className="text-xl font-bold tracking-tight text-primary">YVIE</h1>
            <span className="ml-2 text-xs text-muted-foreground uppercase tracking-wider font-mono">System</span>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu className="mt-4 gap-1 px-2">
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.href}
                    className="font-medium text-sm transition-colors data-[active=true]:bg-primary/10 data-[active=true]:text-primary"
                  >
                    <Link href={item.href} className="flex items-center gap-3">
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-4 border-t border-border">
            <div className="text-xs text-muted-foreground font-mono">
              STATUS: ONLINE
            </div>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          <header className="h-16 flex items-center px-6 border-b border-border bg-background/95 backdrop-blur z-10 sticky top-0 shrink-0">
            <SidebarTrigger className="mr-4" />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{navItems.find(i => i.href === location)?.label || "Dashboard"}</span>
            </div>
          </header>
          <div className="flex-1 overflow-auto p-6 scroll-smooth">
            <div className="max-w-6xl mx-auto space-y-6">
              {children}
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};
