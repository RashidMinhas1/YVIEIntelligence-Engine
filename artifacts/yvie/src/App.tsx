import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import Wizard from "@/pages/wizard";
import History from "@/pages/history";
import { Link, useLocation } from "wouter";
import { Wand2, History as HistoryIcon } from "lucide-react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30000 },
  },
});

function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top nav bar */}
      <header className="h-14 border-b border-border bg-card flex items-center px-6 gap-6 shrink-0 sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-primary flex items-center justify-center">
            <span className="text-xs font-black text-primary-foreground">Y</span>
          </div>
          <span className="font-black text-base tracking-tight">YVIE</span>
          <span className="text-xs text-muted-foreground font-mono ml-1">Intelligence Engine</span>
        </div>
        <nav className="flex items-center gap-1 ml-auto">
          <Link
            href="/"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${location === "/" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
          >
            <Wand2 className="h-3.5 w-3.5" />
            Wizard
          </Link>
          <Link
            href="/history"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${location === "/history" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
          >
            <HistoryIcon className="h-3.5 w-3.5" />
            History
          </Link>
        </nav>
      </header>

      <main className="flex-1 p-6 overflow-auto">
        {children}
      </main>
    </div>
  );
}

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Wizard} />
        <Route path="/history" component={History} />
        <Route path="/dashboard"><Redirect to="/" /></Route>
        <Route path="/competitors"><Redirect to="/" /></Route>
        <Route path="/analyze-titles"><Redirect to="/" /></Route>
        <Route path="/generate-titles"><Redirect to="/" /></Route>
        <Route path="/analyze-script"><Redirect to="/" /></Route>
        <Route path="/generate-script"><Redirect to="/" /></Route>
        <Route><Redirect to="/" /></Route>
      </Switch>
    </Layout>
  );
}

function App() {
  useEffect(() => {
    document.documentElement.classList.remove("dark");
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
