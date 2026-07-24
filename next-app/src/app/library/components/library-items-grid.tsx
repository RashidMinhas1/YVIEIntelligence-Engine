"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface LibraryItemsGridProps {
  section: string;
  selectedFolderId: string | null;
  onOpenItem: (item: any) => void;
}

export function LibraryItemsGrid({ section, selectedFolderId, onOpenItem }: LibraryItemsGridProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [dateFilter, setDateFilter] = useState("all_time");
  const [providerFilter, setProviderFilter] = useState("all");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const { data, isLoading } = useQuery({
    queryKey: ["library-items", section, selectedFolderId],
    queryFn: async () => {
      // Map new config IDs to legacy DB types for backward compatibility
      const legacyMapping: Record<string, string> = {
        title_format: "title",
        script_format: "script",
        hook: "hook",
        cta: "cta",
        thumbnail_format: "thumbnail",
        report: "report",
      };
      
      const dbType = legacyMapping[section] || section;
      
      let url = `/api/library/items?type=${dbType}`;
      if (selectedFolderId && selectedFolderId !== "root") {
        url += `&folderId=${selectedFolderId}`;
      }
      
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const items = data?.items || [];
  
  // Extract all unique tags
  const allTags = Array.from(new Set(items.flatMap((item: any) => item.tags || []))).sort() as string[];
  
  const filteredItems = items.filter((item: any) => {
    // 1. Search Filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchesSearch = item.title?.toLowerCase().includes(q) ||
        item.summary?.toLowerCase().includes(q) ||
        item.tags?.some((t: string) => t.toLowerCase().includes(q));
      if (!matchesSearch) return false;
    }

    // 2. Date Filter
    if (dateFilter !== "all_time") {
      const createdAt = new Date(item.createdAt);
      const now = new Date();
      if (dateFilter === "today") {
        if (createdAt.toDateString() !== now.toDateString()) return false;
      } else if (dateFilter === "last_7_days") {
        const sevenDaysAgo = new Date(now.setDate(now.getDate() - 7));
        if (createdAt < sevenDaysAgo) return false;
      } else if (dateFilter === "last_30_days") {
        const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
        if (createdAt < thirtyDaysAgo) return false;
      } else if (dateFilter === "this_month") {
        if (createdAt.getMonth() !== now.getMonth() || createdAt.getFullYear() !== now.getFullYear()) return false;
      }
    }

    // 3. Provider Filter
    if (providerFilter !== "all") {
      const itemProvider = (item.metadata?.provider || "Manual").toLowerCase();
      if (itemProvider !== providerFilter) return false;
    }

    // 4. Tags Filter
    if (selectedTags.length > 0) {
      const hasAllTags = selectedTags.every(st => item.tags?.includes(st));
      if (!hasAllTags) return false;
    }

    return true;
  });

  return (
    <div className="flex-1 flex flex-col min-h-[500px]">
      <div className="p-4 border-b border-border flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search library..." 
              className="pl-9 bg-muted/30 font-mono text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-mono border rounded-md transition-colors ${showFilters ? 'bg-primary/10 border-primary/20 text-primary' : 'text-muted-foreground border-border hover:text-foreground hover:bg-muted/30'}`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </button>
        </div>

        {showFilters && (
          <div className="flex flex-wrap items-center gap-3 p-3 bg-muted/20 border border-border/50 rounded-lg animate-in fade-in slide-in-from-top-2">
            <div className="w-[150px]">
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="h-8 font-mono text-xs">
                  <SelectValue placeholder="Date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_time">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="last_7_days">Last 7 Days</SelectItem>
                  <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                  <SelectItem value="this_month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-[150px]">
              <Select value={providerFilter} onValueChange={setProviderFilter}>
                <SelectTrigger className="h-8 font-mono text-xs">
                  <SelectValue placeholder="Provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Providers</SelectItem>
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="gemini">Gemini</SelectItem>
                  <SelectItem value="openrouter">OpenRouter</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {allTags.length > 0 && (
              <div className="w-[150px]">
                <Select 
                  value=""
                  onValueChange={(val) => {
                    if (val && !selectedTags.includes(val)) {
                      setSelectedTags([...selectedTags, val]);
                    }
                  }}
                >
                  <SelectTrigger className="h-8 font-mono text-xs">
                    <SelectValue placeholder="Filter by Tag..." />
                  </SelectTrigger>
                  <SelectContent>
                    {allTags.filter(t => !selectedTags.includes(t)).map(tag => (
                      <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {(dateFilter !== "all_time" || providerFilter !== "all" || selectedTags.length > 0) && (
              <button 
                onClick={() => {
                  setDateFilter("all_time");
                  setProviderFilter("all");
                  setSelectedTags([]);
                }}
                className="text-xs font-mono text-muted-foreground hover:text-foreground ml-auto underline"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}

        {selectedTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedTags.map(tag => (
              <Badge key={tag} variant="secondary" className="font-mono text-xs flex items-center gap-1 bg-primary/10 hover:bg-primary/20 text-primary border-primary/20">
                {tag}
                <button onClick={() => setSelectedTags(selectedTags.filter(t => t !== tag))} className="hover:text-destructive ml-1">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="text-sm font-mono text-muted-foreground text-center py-10">Loading items...</div>
        ) : filteredItems.length === 0 ? (
          <div className="text-sm font-mono text-muted-foreground text-center py-10 border border-dashed border-border rounded-lg bg-muted/10">
            No items found in this view.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredItems.map((item: any) => (
              <div 
                key={item.id} 
                onClick={() => onOpenItem(item)}
                className="group p-4 rounded-xl border border-border bg-card hover:border-primary/50 cursor-pointer transition-all hover:shadow-sm flex flex-col"
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-foreground text-base truncate pr-2 group-hover:text-primary transition-colors">{item.title}</h4>
                  <Badge variant="secondary" className="text-[10px] font-mono shrink-0">v{item.version}</Badge>
                </div>
                
                {item.summary && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
                    {item.summary}
                  </p>
                )}
                
                {/* Preview content depending on type */}
                {item.type === "title" && item.content?.template && (
                  <div className="mt-auto bg-muted/30 p-2 rounded text-xs font-mono text-muted-foreground line-clamp-1 border border-border/50">
                    {item.content.template}
                  </div>
                )}
                
                {item.type === "script" && item.content?.storytellingFramework && (
                  <div className="mt-auto bg-muted/30 p-2 rounded text-xs font-mono text-muted-foreground line-clamp-1 border border-border/50">
                    {item.content.storytellingFramework}
                  </div>
                )}
                
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50 overflow-x-auto hide-scrollbar">
                  {item.tags?.slice(0, 3).map((t: string) => (
                    <Badge key={t} variant="outline" className="text-[10px] font-mono whitespace-nowrap bg-background">
                      {t}
                    </Badge>
                  ))}
                  {item.tags?.length > 3 && (
                    <span className="text-[10px] text-muted-foreground font-mono">+{item.tags.length - 3}</span>
                  )}
                  <div className="ml-auto text-[10px] text-muted-foreground font-mono shrink-0">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
