"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { KnowledgeCategoryConfig } from "@/lib/config/knowledge-categories";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Folder, Star, Clock, Sparkles, ChevronDown, Check, Info, FileText, Loader2, Bot, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface KnowledgePickerProps {
  category: KnowledgeCategoryConfig;
  selectedItemId: string | null;
  topic?: string;
  onSelect: (item: any) => void;
  onPreview: (item: any) => void;
}

export function KnowledgePicker({ category, topic, selectedItemId, onSelect, onPreview }: KnowledgePickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [aiSuggestion, setAiSuggestion] = useState<any | null>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const generateSuggestion = async () => {
    if (!topic) {
      toast.error("Please enter a Script Topic first!");
      return;
    }
    setIsGeneratingAI(true);
    try {
      const res = await fetch("/api/scripts/assemble/ai-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, categoryId: category.id })
      });
      const data = await res.json();
      if (data.suggestion) {
        setAiSuggestion(data.suggestion);
        toast.success("AI suggestion generated!");
      } else {
        toast.error("Failed to generate suggestion.");
      }
    } catch (e) {
      toast.error("Error generating suggestion.");
    }
    setIsGeneratingAI(false);
  };

  // Map config IDs to DB legacy types
  const legacyMapping: Record<string, string> = {
    title_format: "title",
    script_format: "script",
    hook: "hook",
    cta: "cta",
    thumbnail_format: "thumbnail",
    report: "report",
  };
  const dbType = legacyMapping[category.id] || category.id;

  const { data: itemsData, isLoading: itemsLoading } = useQuery({
    queryKey: ["library-items", dbType],
    queryFn: async () => {
      const res = await fetch(`/api/library/items?type=${dbType}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const { data: foldersData } = useQuery({
    queryKey: ["library-folders", category.id],
    queryFn: async () => {
      const res = await fetch(`/api/library/folders?section=${category.id}`);
      if (!res.ok) throw new Error("Failed to fetch folders");
      return res.json();
    },
  });

  const items = itemsData?.items || [];
  const folders = foldersData?.folders || [];

  const filteredItems = useMemo(() => {
    return items.filter((item: any) => {
      if (activeFolder && activeFolder !== "all") {
        if (activeFolder === "root" && item.folderId && item.folderId !== "root") return false;
        if (activeFolder !== "root" && item.folderId !== activeFolder) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        return item.title?.toLowerCase().includes(q) || item.metadata?.tags?.some((t:string) => t.toLowerCase().includes(q));
      }
      return true;
    });
  }, [items, activeFolder, search]);

  const selectedItem = items.find((i: any) => i.id === selectedItemId);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          role="combobox" 
          aria-expanded={open} 
          className="w-full justify-between font-mono text-left bg-background h-10 border-border"
        >
          <div className="flex items-center gap-2 truncate">
            <category.icon className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="truncate">
              {selectedItem ? selectedItem.title : `Select ${category.label}...`}
            </span>
          </div>
          <ChevronDown className="w-4 h-4 opacity-50 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <div className="flex flex-col h-[400px]">
          <div className="p-2 border-b border-border flex items-center gap-2">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder={`Search ${category.label}...`} 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-8 text-xs font-mono border-none focus-visible:ring-0 px-0 shadow-none"
            />
          </div>

          <Tabs defaultValue="all" className="flex-1 flex flex-col overflow-hidden">
            <div className="px-2 pt-2">
              <TabsList className="w-full grid grid-cols-4 h-8 bg-muted/30">
                <TabsTrigger value="all" className="text-[10px] font-mono"><FileText className="w-3 h-3 mr-1" /> All</TabsTrigger>
                <TabsTrigger value="folders" className="text-[10px] font-mono"><Folder className="w-3 h-3 mr-1" /> Folders</TabsTrigger>
                <TabsTrigger value="favorites" className="text-[10px] font-mono"><Star className="w-3 h-3 mr-1" /> Favs</TabsTrigger>
                <TabsTrigger value="ai" className="text-[10px] font-mono text-primary"><Sparkles className="w-3 h-3 mr-1" /> AI</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="all" className="flex-1 overflow-hidden m-0 mt-2">
              <ScrollArea className="h-full">
                <div className="p-2 space-y-1">
                  {itemsLoading ? (
                    <div className="p-4 text-center text-xs text-muted-foreground font-mono">Loading...</div>
                  ) : filteredItems.length === 0 ? (
                    <div className="p-4 text-center text-xs text-muted-foreground font-mono">No items found.</div>
                  ) : (
                    filteredItems.map((item: any) => (
                      <div 
                        key={item.id} 
                        className={`flex items-center justify-between p-2 rounded-md text-xs transition-colors cursor-pointer group ${
                          selectedItemId === item.id ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted text-foreground"
                        }`}
                        onClick={() => {
                          onSelect(item);
                          setOpen(false);
                        }}
                      >
                        <span className="font-mono truncate flex-1">{item.title}</span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="w-6 h-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              onPreview(item);
                            }}
                          >
                            <Info className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                          </Button>
                          {selectedItemId === item.id && <Check className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="folders" className="flex-1 overflow-hidden m-0 mt-2 flex">
              <div className="w-1/3 border-r border-border p-2 space-y-1">
                <div 
                  className={`px-2 py-1.5 rounded-md text-xs font-mono cursor-pointer ${!activeFolder || activeFolder === "all" ? "bg-primary/10 text-primary" : "hover:bg-muted text-muted-foreground"}`}
                  onClick={() => setActiveFolder("all")}
                >
                  All Folders
                </div>
                <div 
                  className={`px-2 py-1.5 rounded-md text-xs font-mono cursor-pointer ${activeFolder === "root" ? "bg-primary/10 text-primary" : "hover:bg-muted text-muted-foreground"}`}
                  onClick={() => setActiveFolder("root")}
                >
                  Root
                </div>
                {folders.map((f:any) => (
                  <div 
                    key={f.id}
                    className={`px-2 py-1.5 rounded-md text-xs font-mono truncate cursor-pointer ${activeFolder === f.id ? "bg-primary/10 text-primary" : "hover:bg-muted text-muted-foreground"}`}
                    onClick={() => setActiveFolder(f.id)}
                  >
                    {f.name}
                  </div>
                ))}
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {filteredItems.map((item: any) => (
                  <div 
                    key={item.id} 
                    className={`px-2 py-1.5 rounded-md text-xs transition-colors cursor-pointer truncate ${
                      selectedItemId === item.id ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted text-foreground"
                    }`}
                    onClick={() => {
                      onSelect(item);
                      setOpen(false);
                    }}
                  >
                    <span className="font-mono">{item.title}</span>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="favorites" className="flex-1 overflow-hidden m-0 mt-2">
              <ScrollArea className="h-full">
                <div className="p-2 space-y-1">
                  {itemsLoading ? (
                    <div className="p-4 text-center text-xs text-muted-foreground font-mono">Loading...</div>
                  ) : filteredItems.filter((i: any) => i.isFavorite).length === 0 ? (
                    <div className="p-4 text-center text-xs text-muted-foreground font-mono">No favorites yet.</div>
                  ) : (
                    filteredItems.filter((i: any) => i.isFavorite).map((item: any) => (
                      <div 
                        key={item.id} 
                        className={`flex items-center justify-between p-2 rounded-md text-xs transition-colors cursor-pointer group ${
                          selectedItemId === item.id ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted text-foreground"
                        }`}
                        onClick={() => {
                          onSelect(item);
                          setOpen(false);
                        }}
                      >
                        <span className="font-mono truncate flex-1">{item.title}</span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="w-6 h-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              onPreview(item);
                            }}
                          >
                            <Info className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                          </Button>
                          {selectedItemId === item.id && <Check className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="ai" className="flex-1 overflow-hidden m-0 mt-2">
              <ScrollArea className="h-full">
                <div className="p-2 space-y-3">
                  {!aiSuggestion && !isGeneratingAI && (
                    <div className="p-4 text-center space-y-2">
                      <p className="text-xs text-muted-foreground font-mono mb-2">
                        Get a custom {category.label.toLowerCase()} tailored to your Script Topic.
                      </p>
                      <Button onClick={generateSuggestion} className="w-full text-xs font-mono" size="sm">
                        <Sparkles className="w-3 h-3 mr-2" />
                        Auto Recommend
                      </Button>
                    </div>
                  )}

                  {isGeneratingAI && (
                    <div className="p-6 text-center flex flex-col items-center justify-center space-y-2">
                      <Loader2 className="w-5 h-5 text-primary animate-spin" />
                      <p className="text-xs text-muted-foreground font-mono">Analyzing topic & generating...</p>
                    </div>
                  )}

                  {aiSuggestion && (
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-bold font-mono text-primary uppercase px-1">✨ Custom Suggestion</h4>
                      <div 
                        key={aiSuggestion.id} 
                        className={`flex flex-col gap-2 p-3 rounded-md text-xs transition-colors cursor-pointer border border-primary/20 bg-primary/5 hover:bg-primary/10`}
                        onClick={() => {
                          onSelect(aiSuggestion);
                          setOpen(false);
                        }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-mono font-bold text-primary">{aiSuggestion.title}</span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="w-6 h-6 p-0 shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              onPreview(aiSuggestion);
                            }}
                          >
                            <Info className="w-3.5 h-3.5 text-primary" />
                          </Button>
                        </div>
                        <p className="text-muted-foreground line-clamp-2">
                          {Object.values(aiSuggestion.content)[0] as string}
                        </p>
                      </div>
                      
                      <div className="flex justify-center pt-2">
                        <Button variant="ghost" size="sm" onClick={generateSuggestion} className="text-[10px] font-mono text-muted-foreground">
                          <RefreshCcw className="w-3 h-3 mr-1" /> Try Again
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t border-border mt-4">
                    <h4 className="text-[10px] font-bold font-mono text-muted-foreground uppercase px-1 mb-2">Library Recommendations</h4>
                    {itemsLoading ? (
                      <div className="p-4 text-center text-xs text-muted-foreground font-mono">Loading...</div>
                    ) : filteredItems.length === 0 ? (
                      <div className="p-4 text-center text-xs text-muted-foreground font-mono">No recommendations.</div>
                    ) : (
                      filteredItems.slice(0, 5).map((item: any) => (
                        <div 
                          key={item.id} 
                          className={`flex items-center justify-between p-2 rounded-md text-xs transition-colors cursor-pointer group ${
                            selectedItemId === item.id ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted text-foreground"
                          }`}
                          onClick={() => {
                            onSelect(item);
                            setOpen(false);
                          }}
                        >
                          <div className="flex items-center gap-2 overflow-hidden flex-1">
                            <Bot className="w-3 h-3 text-muted-foreground shrink-0" />
                            <span className="font-mono truncate">{item.title}</span>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="w-6 h-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                onPreview(item);
                              }}
                            >
                              <Info className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                            </Button>
                            {selectedItemId === item.id && <Check className="w-3.5 h-3.5" />}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

          </Tabs>
        </div>
      </PopoverContent>
    </Popover>
  );
}
