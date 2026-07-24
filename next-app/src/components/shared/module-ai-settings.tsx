"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Settings, Plus, Trash2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface ModuleAISettingsProps {
  featureKey: string;
  moduleName: string;
}

export function ModuleAISettings({ featureKey, moduleName }: ModuleAISettingsProps) {
  const [config, setConfig] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      fetch("/api/settings/ai")
        .then(res => res.json())
        .then(data => {
          if (data.features && data.features[featureKey]) {
            setConfig({ ...data.features[featureKey], isLocalOverrideEnabled: data.features[featureKey].isLocalOverrideEnabled ?? false });
          } else {
            setConfig({ provider: "auto", model: "auto", apiKeys: [""], isLocalOverrideEnabled: false });
          }
        });
    }
  }, [open, featureKey]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings/ai");
      const data = await res.json();
      
      if (!data.features) data.features = {};
      data.features[featureKey] = config;

      await fetch("/api/settings/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      
      setOpen(false);
    } catch (err) {
      console.error(err);
    }
    setSaving(false);
  };

  if (!config) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2 shrink-0">
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">AI Config</span>
          </Button>
        </DialogTrigger>
        <DialogContent>Loading...</DialogContent>
      </Dialog>
    );
  }

  const updateApiKey = (idx: number, val: string) => {
    const keys = [...(config.apiKeys || [""])];
    keys[idx] = val;
    setConfig({ ...config, apiKeys: keys });
  };

  const addKey = () => {
    setConfig({ ...config, apiKeys: [...(config.apiKeys || [""]), ""] });
  };

  const removeKey = (idx: number) => {
    const keys = (config.apiKeys || [""]).filter((_: any, i: number) => i !== idx);
    setConfig({ ...config, apiKeys: keys.length ? keys : [""] });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 shrink-0">
          <Settings className="w-4 h-4" />
          <span className="hidden sm:inline">AI Config</span>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{moduleName} - AI Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex items-center justify-between border-b pb-4">
            <div className="space-y-0.5">
              <Label>Enable Local Override</Label>
              <div className="text-sm text-muted-foreground">Override global AI settings for this module.</div>
            </div>
            <Switch 
              checked={config.isLocalOverrideEnabled} 
              onCheckedChange={(c) => setConfig({ ...config, isLocalOverrideEnabled: c })} 
            />
          </div>

          {config.isLocalOverrideEnabled && (
            <>
              <div className="space-y-3">
                <Label>Provider Selection</Label>
                <Select value={config.provider} onValueChange={(v) => setConfig({ ...config, provider: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto (Smart Routing)</SelectItem>
                    <SelectItem value="openai">OpenAI</SelectItem>
                    <SelectItem value="gemini">Google Gemini</SelectItem>
                    <SelectItem value="openrouter">OpenRouter</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>Model Override</Label>
                <Select value={config.model} onValueChange={(v) => setConfig({ ...config, model: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">
                      Auto (Smart Selection) <span className="ml-2 text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-mono">Dynamic</span>
                    </SelectItem>
                    {config.provider === "openai" && (
                      <>
                        <SelectItem value="gpt-4o">
                          GPT-4o <span className="ml-2 text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-mono">Paid / Fast</span>
                        </SelectItem>
                        <SelectItem value="gpt-4o-mini">
                          GPT-4o Mini <span className="ml-2 text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-mono">Free Tier / Super Fast</span>
                        </SelectItem>
                        <SelectItem value="o1-preview">
                          o1-Preview <span className="ml-2 text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-mono">Premium / Slow</span>
                        </SelectItem>
                      </>
                    )}
                    {config.provider === "gemini" && (
                      <>
                        <SelectItem value="gemini-1.5-pro">
                          Gemini 1.5 Pro <span className="ml-2 text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-mono">Paid / Medium</span>
                        </SelectItem>
                        <SelectItem value="gemini-1.5-flash">
                          Gemini 1.5 Flash <span className="ml-2 text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-mono">Free / Super Fast</span>
                        </SelectItem>
                        <SelectItem value="gemini-2.5-flash">
                          Gemini 2.5 Flash <span className="ml-2 text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-mono">Free / Ultra Fast</span>
                        </SelectItem>
                      </>
                    )}
                    {config.provider === "openrouter" && (
                      <>
                        <SelectItem value="anthropic/claude-3.5-sonnet">
                          Claude 3.5 Sonnet <span className="ml-2 text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-mono">Paid / Fast</span>
                        </SelectItem>
                        <SelectItem value="anthropic/claude-3-haiku">
                          Claude 3 Haiku <span className="ml-2 text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-mono">Paid (Cheap) / Ultra Fast</span>
                        </SelectItem>
                        <SelectItem value="meta-llama/llama-3.1-405b-instruct">
                          Llama 3.1 405B <span className="ml-2 text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-mono">Free via OR / Fast</span>
                        </SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Local API Keys (Optional)</Label>
                  <Button variant="ghost" size="sm" onClick={addKey} className="h-6 px-2"><Plus className="w-3 h-3" /></Button>
                </div>
                {(config.apiKeys || [""]).map((k: string, i: number) => (
                  <div key={i} className="flex gap-2">
                    <Input 
                      type="password" 
                      placeholder="sk-... (Leave empty to use global)" 
                      value={k} 
                      onChange={(e) => updateApiKey(i, e.target.value)} 
                    />
                    <Button variant="ghost" size="icon" onClick={() => removeKey(i)}>
                      <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="flex justify-end pt-4">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Module Config"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
