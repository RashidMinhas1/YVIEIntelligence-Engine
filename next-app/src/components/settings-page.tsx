"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Bot, Brain, Sparkles, AlertTriangle, RefreshCcw } from "lucide-react";
import { AIProviderCard } from "@/components/settings/ai-provider-card";
import { AIDiagnostics } from "@/components/settings/ai-diagnostics";

const INITIAL_PROVIDERS = {
  openai: { apiKey: "", baseUrl: "", model: "" },
  gemini: { apiKey: "", baseUrl: "", model: "" },
  openrouter: { apiKey: "", baseUrl: "", model: "" }
};

export default function SettingsPage() {
  const [activeProvider, setActiveProvider] = useState("openai");
  const [providers, setProviders] = useState<any>(INITIAL_PROVIDERS);
  const [originalProviders, setOriginalProviders] = useState<any>(INITIAL_PROVIDERS);
  const [originalActive, setOriginalActive] = useState("openai");
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ [key: string]: string }>({});
  
  const hasUnsavedChanges = activeProvider !== originalActive || JSON.stringify(providers) !== JSON.stringify(originalProviders);

  useEffect(() => {
    fetch("/api/settings/ai")
      .then(r => r.json())
      .then(data => {
        if (data.activeProvider) {
          setActiveProvider(data.activeProvider);
          setOriginalActive(data.activeProvider);
        }
        if (data.providers) {
          const loaded = {
            openai: { ...INITIAL_PROVIDERS.openai, ...data.providers.openai },
            gemini: { ...INITIAL_PROVIDERS.gemini, ...data.providers.gemini },
            openrouter: { ...INITIAL_PROVIDERS.openrouter, ...data.providers.openrouter }
          };
          setProviders(loaded);
          setOriginalProviders(loaded);
        }
      });
  }, []);

  const handleChange = (provider: string, field: string, value: string) => {
    setProviders((prev: any) => ({
      ...prev,
      [provider]: { ...prev[provider], [field]: value }
    }));
  };

  const handleTest = async (provider: string) => {
    setTesting(true);
    setStatus({ ...status, [provider]: "Testing connection..." });
    try {
      const res = await fetch("/api/settings/ai/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, config: providers[provider] })
      });
      const data = await res.json();
      if (data.success) {
        setStatus({ ...status, [provider]: "✅ Connection Successful" });
      } else {
        setStatus({ ...status, [provider]: "❌ " + data.error });
      }
    } catch (err: any) {
      setStatus({ ...status, [provider]: "❌ " + err.message });
    }
    setTesting(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch("/api/settings/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activeProvider, providers })
      });
      alert("Settings saved successfully!");
    } catch (err: any) {
      alert("Failed to save settings.");
    }
    setSaving(false);
  };

  const handleReset = () => {
    setActiveProvider(originalActive);
    setProviders(JSON.parse(JSON.stringify(originalProviders)));
    setStatus({});
  };

  const getProviderIcon = (key: string) => {
    switch (key) {
      case "openai": return <Brain className="w-5 h-5 text-emerald-500" />;
      case "gemini": return <Sparkles className="w-5 h-5 text-blue-500" />;
      case "openrouter": return <Bot className="w-5 h-5 text-purple-500" />;
      default: return <Bot className="w-5 h-5" />;
    }
  };

  const renderProvider = (key: string, name: string) => {
    return (
      <AIProviderCard
        key={key}
        providerKey={key}
        name={name}
        config={providers[key]}
        isActive={activeProvider === key}
        testing={testing}
        statusMsg={status[key] || ""}
        onChange={(field, value) => handleChange(key, field, value)}
        onTest={() => handleTest(key)}
      />
    );
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">AI Settings</h2>
        <p className="text-muted-foreground text-sm mt-1 font-mono">Configure AI providers and override default environment variables</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Provider</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={activeProvider} onValueChange={setActiveProvider}>
            <SelectTrigger>
              <SelectValue placeholder="Select active AI provider" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="openai">OpenAI</SelectItem>
              <SelectItem value="gemini">Gemini</SelectItem>
              <SelectItem value="openrouter">OpenRouter</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {renderProvider("openai", "OpenAI")}
      {renderProvider("gemini", "Gemini")}
      {renderProvider("openrouter", "OpenRouter")}

      {hasUnsavedChanges && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-medium text-amber-500">Unsaved Changes</h4>
            <p className="text-sm text-amber-500/80">You have modified your settings. Don't forget to save your changes before leaving this page.</p>
          </div>
        </div>
      )}

      <AIDiagnostics onSelectModel={(provider, model) => {
        setActiveProvider(provider);
        handleChange(provider, "model", model);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }} />

      <div className="flex items-center justify-between pt-4 border-t border-border">
        <Button variant="ghost" onClick={handleReset} disabled={saving || !hasUnsavedChanges} className="text-muted-foreground">
          <RefreshCcw className="w-4 h-4 mr-2" />
          Reset Changes
        </Button>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleReset} disabled={saving || !hasUnsavedChanges}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !hasUnsavedChanges} className="min-w-[120px]">
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>
    </div>
  );
}
