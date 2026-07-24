import React from "react";
import { GeneratorLayout } from "@/components/script-prompt-generator/generator-layout";
import { AppLayout } from "@/components/app-layout";

export const metadata = {
  title: "Script Prompt Generator | YVIE",
  description: "Standalone Professional AI Prompt Engineering Application",
};

export default function ScriptPromptGeneratorPage() {
  return (
    <AppLayout>
      <GeneratorLayout />
    </AppLayout>
  );
}
