"use client";

import React, { useState } from "react";
import { AIMemoryProfile } from "@/lib/types/knowledge-object";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrainCircuit, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AiMemoryProfileEditor({
  profile,
  onChange
}: {
  profile: AIMemoryProfile;
  onChange: (p: AIMemoryProfile) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  function handleChange(key: keyof AIMemoryProfile, value: string) {
    onChange({ ...profile, [key]: value });
  }

  return (
    <div className="border border-border bg-background rounded-md overflow-hidden">
      <Button 
        variant="ghost" 
        className="w-full justify-between p-3 h-auto rounded-none bg-muted/5 hover:bg-muted/10 border-b border-border"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="font-bold font-mono text-xs uppercase flex items-center gap-2 text-primary">
          <BrainCircuit className="w-4 h-4" /> AI Memory Profile
        </span>
        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </Button>

      {isOpen && (
        <div className="p-4 grid grid-cols-2 gap-4">
          {Object.entries(profile).map(([key, value]) => (
            <div key={key} className="space-y-1.5">
              <Label className="text-[10px] font-mono uppercase text-muted-foreground">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </Label>
              <Input 
                value={value} 
                onChange={e => handleChange(key as keyof AIMemoryProfile, e.target.value)}
                className="text-xs h-7"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
