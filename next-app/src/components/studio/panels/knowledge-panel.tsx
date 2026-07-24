"use client";

import React, { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { KNOWLEDGE_CATEGORIES } from "@/lib/config/knowledge-categories";

interface KnowledgePanelProps {
  libraryItems: any[];
  onInsert: (content: string, type: string) => void;
}

export function KnowledgePanel({ libraryItems, onInsert }: KnowledgePanelProps) {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="flex flex-col h-full border-r bg-muted/10">
      <div className="p-4 border-b">
        <h2 className="font-semibold mb-2 text-sm uppercase tracking-wider text-muted-foreground">Knowledge & Assets</h2>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search library..." 
            className="pl-8 bg-background"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <ScrollArea className="flex-1 p-2">
        <Accordion type="multiple" className="w-full">
          {KNOWLEDGE_CATEGORIES.map(category => {
            const items = libraryItems.filter(item => item.type === category.id);
            if (items.length === 0 && !searchTerm) return null;
            
            return (
              <AccordionItem value={category.id} key={category.id} className="border-b-0">
                <AccordionTrigger className="hover:no-underline py-2 px-2 rounded hover:bg-muted/50 text-sm">
                  {category.label} ({items.length})
                </AccordionTrigger>
                <AccordionContent className="pb-1 px-1">
                  {items.map(item => (
                    <div 
                      key={item.id} 
                      className="group flex flex-col p-2 mb-1 rounded-md border bg-card text-card-foreground shadow-sm hover:border-primary/50 cursor-pointer transition-all"
                      onClick={() => {
                        const contentToInsert = item.content?.text || item.content?.content || item.title;
                        onInsert(contentToInsert, category.label);
                      }}
                    >
                      <span className="font-medium text-xs">{item.title}</span>
                      {item.summary && <span className="text-[10px] text-muted-foreground truncate">{item.summary}</span>}
                    </div>
                  ))}
                  {items.length === 0 && (
                    <div className="text-xs text-muted-foreground p-2">No items found.</div>
                  )}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </ScrollArea>
    </div>
  );
}
