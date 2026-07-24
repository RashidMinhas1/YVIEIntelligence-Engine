"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, Loader2 } from "lucide-react";

interface AIModel {
  id: string;
  name: string;
  provider: string;
  contextWindow?: number;
  inputPrice?: number;
  outputPrice?: number;
  isFree?: boolean;
  health?: {
    successRate: number;
    avgResponseTimeMs: number | null;
    timeoutCount: number;
    isHealthy: boolean;
  };
}

export function ModelBrowser({ providerKey, config, onSelect }: { providerKey: string, config: any, onSelect: (model: string) => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [models, setModels] = useState<AIModel[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const fetchModels = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/settings/ai/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: providerKey, config })
      });
      const data = await res.json();
      if (data.success) {
        // Sort models: Free first, then alphabetically
        const sorted = data.models.sort((a: AIModel, b: AIModel) => {
          if (a.isFree && !b.isFree) return -1;
          if (!a.isFree && b.isFree) return 1;
          return a.id.localeCompare(b.id);
        });
        setModels(sorted);
      } else {
        setError(data.error || "Failed to fetch models");
      }
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && models.length === 0) {
      fetchModels();
    }
  };

  const filteredModels = models.filter(m => m.id.toLowerCase().includes(search.toLowerCase()) || m.name.toLowerCase().includes(search.toLowerCase()));

  const getHealthBadge = (h: AIModel["health"]) => {
    if (!h) return null;
    if (!h.isHealthy) return <Badge variant="destructive" className="text-[10px]">🔴 Offline</Badge>;
    if (h.avgResponseTimeMs === null) return null;
    const s = h.avgResponseTimeMs / 1000;
    if (s < 7) return <Badge className="bg-emerald-500/20 text-emerald-500 text-[10px]">🟢 Fast ({s.toFixed(1)}s)</Badge>;
    if (s <= 10) return <Badge className="bg-amber-500/20 text-amber-500 text-[10px]">🟡 Medium ({s.toFixed(1)}s)</Badge>;
    return <Badge className="bg-rose-500/20 text-rose-500 text-[10px]">🔴 Slow ({s.toFixed(1)}s)</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">Browse Models</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Select {providerKey} Model</DialogTitle>
        </DialogHeader>
        
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search models..." 
            className="pl-8" 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-2">
          {loading && (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
          {!loading && !error && filteredModels.length === 0 && (
            <p className="text-sm text-muted-foreground text-center p-8">No models found.</p>
          )}
          {!loading && filteredModels.map(m => (
            <div 
              key={m.id} 
              className={`flex items-center justify-between p-3 border rounded-md hover:border-primary/50 cursor-pointer transition-colors ${m.health?.isHealthy === false ? 'opacity-50' : ''}`}
              onClick={() => { if(m.health?.isHealthy !== false) { onSelect(m.id); setOpen(false); } }}
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm">{m.name || m.id}</p>
                  {getHealthBadge(m.health)}
                  {m.health?.successRate !== undefined && m.health.successRate < 1 && (
                     <span className="text-xs text-muted-foreground">{(m.health.successRate * 100).toFixed(0)}% Success</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{m.id}</p>
                <div className="flex gap-2 mt-1">
                  {m.contextWindow && <Badge variant="outline" className="text-[10px]">{Math.round(m.contextWindow/1000)}k Context</Badge>}
                  {m.isFree && <Badge className="bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30 text-[10px]">Free</Badge>}
                </div>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                {!m.isFree && m.inputPrice !== undefined && m.outputPrice !== undefined && (
                  <>
                    <p>In: ${(m.inputPrice * 1000000).toFixed(2)}/M</p>
                    <p>Out: ${(m.outputPrice * 1000000).toFixed(2)}/M</p>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
