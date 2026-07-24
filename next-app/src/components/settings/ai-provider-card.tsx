"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bot, Brain, Sparkles, Server, Plus, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { ModelBrowser } from "./model-browser";

interface AIProviderCardProps {
  providerKey: string;
  name: string;
  config: any;
  isActive: boolean;
  testing: boolean;
  statusMsg: string;
  onChange: (field: string, value: any) => void;
  onTest: () => void;
}

export function AIProviderCard({
  providerKey,
  name,
  config,
  isActive,
  testing,
  statusMsg,
  onChange,
  onTest
}: AIProviderCardProps) {
  
  const getProviderIcon = (key: string) => {
    switch (key) {
      case "openai": return <Brain className="w-5 h-5 text-emerald-500" />;
      case "gemini": return <Sparkles className="w-5 h-5 text-blue-500" />;
      case "openrouter": return <Server className="w-5 h-5 text-purple-500" />;
      default: return <Bot className="w-5 h-5" />;
    }
  };

  const apiKeys = config.apiKeys || (config.apiKey ? [config.apiKey] : [""]);

  const updateApiKey = (index: number, val: string) => {
    const newKeys = [...apiKeys];
    newKeys[index] = val;
    onChange("apiKeys", newKeys);
  };

  const addApiKey = () => {
    onChange("apiKeys", [...apiKeys, ""]);
  };

  const removeApiKey = (index: number) => {
    const newKeys = apiKeys.filter((_: string, i: number) => i !== index);
    if (newKeys.length === 0) newKeys.push("");
    onChange("apiKeys", newKeys);
  };

  return (
    <Card className={`mb-6 border-2 transition-colors ${isActive ? "border-primary/50" : "border-border"}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-3">
          {getProviderIcon(providerKey)}
          <CardTitle>{name}</CardTitle>
          <Badge variant="outline" className="ml-2 font-mono text-[10px]">{apiKeys.filter((k: string) => k.length > 0).length} Keys Active</Badge>
        </div>
        <div className="flex items-center gap-3">
          {isActive && <Badge variant="default" className="bg-primary/20 text-primary hover:bg-primary/30">Default Provider</Badge>}
          <div className="flex items-center gap-2">
            <Switch 
              checked={config.isEnabled !== false} 
              onCheckedChange={(c) => onChange("isEnabled", c)} 
            />
            <span className="text-sm font-medium text-muted-foreground">{config.isEnabled !== false ? "Enabled" : "Disabled"}</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <Label>API Keys (Round Robin / Failover)</Label>
              <Button type="button" variant="ghost" size="sm" onClick={addApiKey} className="h-6 px-2 text-xs">
                <Plus className="w-3 h-3 mr-1" /> Add Key
              </Button>
            </div>
            {apiKeys.map((keyStr: string, idx: number) => (
              <div key={idx} className="flex gap-2">
                <Input 
                  type="password" 
                  value={keyStr} 
                  onChange={(e) => updateApiKey(idx, e.target.value)} 
                  placeholder={`sk-... (Key ${idx + 1})`} 
                />
                <Button type="button" variant="ghost" size="icon" onClick={() => removeApiKey(idx)} className="shrink-0 text-muted-foreground hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <p className="text-xs text-muted-foreground mt-1">Keys are securely encrypted. System automatically load-balances and drops failing keys.</p>
          </div>
          
          <div>
            <Label>Default Model</Label>
            <div className="flex gap-2 mt-1">
              <Input 
                value={config.model || ""} 
                onChange={(e) => onChange("model", e.target.value)} 
                placeholder={`Leave blank to use default`} 
                className="flex-1"
              />
              <ModelBrowser providerKey={providerKey} config={config} onSelect={(m) => onChange("model", m)} />
            </div>
          </div>

          {providerKey !== "gemini" && (
            <div>
              <Label>Base URL</Label>
              <Input 
                value={config.baseUrl || ""} 
                onChange={(e) => onChange("baseUrl", e.target.value)} 
                placeholder={`Leave blank to use standard URL`}
                className="mt-1"
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex flex-col">
            <span className={`text-sm font-medium ${statusMsg.includes('❌') ? 'text-destructive' : 'text-emerald-500'}`}>
              {statusMsg}
            </span>
            <span className="text-xs text-muted-foreground">Tests the first valid API key.</span>
          </div>
          <Button variant="secondary" onClick={onTest} disabled={testing}>
            {testing ? "Testing..." : "Test Connection"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
