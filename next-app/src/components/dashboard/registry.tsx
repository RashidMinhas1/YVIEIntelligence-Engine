import { ComponentType } from "react";
import { LucideIcon, LayoutDashboard, Search, Users, Activity, FileText, Languages } from "lucide-react";
import dynamic from "next/dynamic";
import DashboardOverview from "@/components/dashboard-page-content"; 

export type DashboardModuleId = 
  | "overview" 
  | "discovery" 
  | "similar" 
  | "outliers" 
  | "reports"
  | "translation";

export interface DashboardModuleManifest {
  id: DashboardModuleId;
  title: string;
  icon: LucideIcon;
  order: number;
  category: "CORE" | "RESEARCH" | "INTELLIGENCE";
  permissions: string[];
  featureFlags: string[];
  lazyLoader: () => Promise<any>;
}

// Map the manifest to a usable component format
export const MODULE_MANIFEST: DashboardModuleManifest[] = [
  {
    id: "overview",
    title: "Overview",
    icon: LayoutDashboard,
    order: 0,
    category: "CORE",
    permissions: [],
    featureFlags: [],
    lazyLoader: async () => ({ default: DashboardOverview }),
  },
  {
    id: "discovery",
    title: "Channel Discovery",
    icon: Search,
    order: 1,
    category: "RESEARCH",
    permissions: [],
    featureFlags: [],
    lazyLoader: () => import("./modules/channel-discovery"),
  },
  {
    id: "similar",
    title: "Similar Channels",
    icon: Users,
    order: 2,
    category: "RESEARCH",
    permissions: [],
    featureFlags: [],
    lazyLoader: () => import("./modules/similar-channels"),
  },
  {
    id: "outliers",
    title: "Outlier Detection",
    icon: Activity,
    order: 3,
    category: "INTELLIGENCE",
    permissions: [],
    featureFlags: [],
    lazyLoader: () => import("./modules/outlier-detection"),
  },
  {
    id: "reports",
    title: "Intelligence Reports",
    icon: FileText,
    order: 4,
    category: "INTELLIGENCE",
    permissions: [],
    featureFlags: [],
    lazyLoader: () => import("./modules/reports"),
  },
  {
    id: "translation",
    title: "Translation Engine",
    icon: Languages,
    order: 10,
    category: "INTELLIGENCE",
    permissions: [],
    featureFlags: [],
    lazyLoader: () => import("./modules/translation-engine"),
  }
];

export const getRegisteredModules = () => {
  return MODULE_MANIFEST.sort((a, b) => a.order - b.order).map(manifest => ({
    ...manifest,
    component: dynamic(manifest.lazyLoader, { ssr: false })
  }));
};
