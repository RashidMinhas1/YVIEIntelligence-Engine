"use client";

import React, { useState } from "react";
import { KnowledgeObject, AssemblySelection, KnowledgeCategory, CategoryPriority } from "@/lib/types/knowledge-object";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Info } from "lucide-react";
import { Input } from "@/components/ui/input";

const CATEGORIES: KnowledgeCategory[] = [
  "Hooks", "Tones", "Story Structures", "Story Arcs", "Retention", 
  "CTAs", "Prompts", "Transitions", "Vocabulary", "Psychology", 
  "Frameworks", "Narration", "Introductions", "Endings", 
  "Open Loops", "Curiosity Loops", "Pattern Interrupts"
];

export function CategorySelector({
  knowledgeObjects,
  selections,
  onSelectionChange,
  onPreviewRequest
}: {
  knowledgeObjects: KnowledgeObject[];
  selections: AssemblySelection[];
  onSelectionChange: (s: AssemblySelection[]) => void;
  onPreviewRequest: (o: KnowledgeObject) => void;
}) {
  const [search, setSearch] = useState("");

  const filteredObjects = knowledgeObjects.filter(o => o.title.toLowerCase().includes(search.toLowerCase()) || o.metadata?.tags?.some((t: string) => t.toLowerCase().includes(search.toLowerCase())));

  function handleSelect(obj: KnowledgeObject, priority: CategoryPriority) {
    // If it's a single-select category, remove existing. For now, let's treat all as multi-select but user usually selects one.
    const exists = selections.find(s => s.knowledgeObjectId === obj.id);
    if (exists) {
      onSelectionChange(selections.filter(s => s.knowledgeObjectId !== obj.id));
    } else {
      onSelectionChange([...selections, { categoryId: obj.category, knowledgeObjectId: obj.id, priority }]);
    }
  }

  function handlePriorityChange(objId: string, priority: CategoryPriority) {
    onSelectionChange(selections.map(s => s.knowledgeObjectId === objId ? { ...s, priority } : s));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Search className="w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder="Search knowledge base by title or tag..." 
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="text-xs h-8"
        />
      </div>

      <div className="space-y-6">
        {CATEGORIES.map(category => {
          const items = filteredObjects.filter(o => o.category === category);
          if (items.length === 0) return null;

          return (
            <div key={category} className="space-y-2 border border-border bg-background rounded-md p-3">
              <div className="flex justify-between items-center border-b border-border pb-2">
                <h3 className="text-xs font-bold font-mono uppercase text-primary">{category}</h3>
                <Badge variant="secondary" className="text-[10px]">{items.length} items</Badge>
              </div>
              <div className="space-y-2 pt-1">
                {items.map(item => {
                  const selection = selections.find(s => s.knowledgeObjectId === item.id);
                  const isSelected = !!selection;

                  return (
                    <div key={item.id} className={`flex items-center justify-between p-2 rounded-md border text-xs transition-colors ${isSelected ? "border-primary bg-primary/5" : "border-transparent hover:bg-muted/50"}`}>
                      <div className="flex items-center gap-2 flex-1 overflow-hidden">
                        <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0" onClick={() => onPreviewRequest(item)}>
                          <Info className="w-3 h-3 text-muted-foreground" />
                        </Button>
                        <div 
                          className="font-medium truncate cursor-pointer flex-1"
                          onClick={() => handleSelect(item, "Medium")}
                        >
                          {item.title}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 shrink-0">
                        {isSelected && (
                          <Select 
                            value={selection.priority} 
                            onValueChange={(v) => handlePriorityChange(item.id, v as CategoryPriority)}
                          >
                            <SelectTrigger className="h-6 w-[80px] text-[10px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Highest">Highest</SelectItem>
                              <SelectItem value="High">High</SelectItem>
                              <SelectItem value="Medium">Medium</SelectItem>
                              <SelectItem value="Low">Low</SelectItem>
                              <SelectItem value="Lowest">Lowest</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                        <Button 
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          className="h-6 text-[10px] px-2"
                          onClick={() => handleSelect(item, "Medium")}
                        >
                          {isSelected ? "Selected" : "Add"}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
