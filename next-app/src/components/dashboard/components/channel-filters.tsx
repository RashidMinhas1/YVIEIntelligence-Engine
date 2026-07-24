import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChannelDiscoveryFilters } from "@/lib/types/discovery";
import { Button } from "@/components/ui/button";
import { Save, RefreshCcw } from "lucide-react";

interface ChannelFiltersProps {
  filters: ChannelDiscoveryFilters;
  onChange: (filters: ChannelDiscoveryFilters) => void;
  isVisible: boolean;
}

export function ChannelFilters({ filters, onChange, isVisible }: ChannelFiltersProps) {
  if (!isVisible) return null;

  const update = (key: keyof ChannelDiscoveryFilters, value: any) => {
    onChange({ ...filters, [key]: value });
  };

  const resetFilters = () => {
    onChange({});
  };

  return (
    <Card className="w-full max-w-5xl mt-4 bg-secondary/30 border-border/50 animate-in slide-in-from-top-2 overflow-visible">
      <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b border-border/50">
        <CardTitle className="text-sm font-semibold">Enterprise Filters</CardTitle>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={resetFilters} className="h-7 text-xs px-2">
            <RefreshCcw className="w-3 h-3 mr-1" /> Reset
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-xs px-2">
            <Save className="w-3 h-3 mr-1" /> Save Filter
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-y-6 gap-x-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
        
        {/* Core Metrics */}
        <div className="col-span-full mb-1 border-b border-border/30 pb-1">
          <h4 className="text-xs font-bold text-primary tracking-wider uppercase">Basic Metrics</h4>
        </div>

        <div className="space-y-2 col-span-2 md:col-span-1">
          <Label className="text-xs text-muted-foreground">Subscribers</Label>
          <div className="flex items-center gap-1">
            <Input type="number" placeholder="Min" className="h-8 text-xs px-2" value={filters.minSubscribers || ""} onChange={(e) => update("minSubscribers", e.target.value ? parseInt(e.target.value, 10) : undefined)} />
            <span className="text-muted-foreground text-xs">-</span>
            <Input type="number" placeholder="Max" className="h-8 text-xs px-2" value={filters.maxSubscribers || ""} onChange={(e) => update("maxSubscribers", e.target.value ? parseInt(e.target.value, 10) : undefined)} />
          </div>
        </div>

        <div className="space-y-2 col-span-2 md:col-span-1">
          <Label className="text-xs text-muted-foreground">Total Views</Label>
          <div className="flex items-center gap-1">
            <Input type="number" placeholder="Min" className="h-8 text-xs px-2" value={filters.minViews || ""} onChange={(e) => update("minViews", e.target.value ? parseInt(e.target.value, 10) : undefined)} />
            <span className="text-muted-foreground text-xs">-</span>
            <Input type="number" placeholder="Max" className="h-8 text-xs px-2" value={filters.maxViews || ""} onChange={(e) => update("maxViews", e.target.value ? parseInt(e.target.value, 10) : undefined)} />
          </div>
        </div>

        <div className="space-y-2 col-span-2 md:col-span-1">
          <Label className="text-xs text-muted-foreground">Avg. Views</Label>
          <Input type="number" placeholder="Min Avg Views" className="h-8 text-xs" value={filters.minAverageViews || ""} onChange={(e) => update("minAverageViews", e.target.value ? parseInt(e.target.value, 10) : undefined)} />
        </div>

        <div className="space-y-2 col-span-2 md:col-span-1">
          <Label className="text-xs text-muted-foreground">Median Views</Label>
          <Input type="number" placeholder="Min Median" className="h-8 text-xs" value={filters.minMedianViews || ""} onChange={(e) => update("minMedianViews", e.target.value ? parseInt(e.target.value, 10) : undefined)} />
        </div>

        <div className="space-y-2 col-span-2 md:col-span-1">
          <Label className="text-xs text-muted-foreground">Total Videos</Label>
          <div className="flex items-center gap-1">
            <Input type="number" placeholder="Min" className="h-8 text-xs px-2" value={filters.minTotalVideos || ""} onChange={(e) => update("minTotalVideos", e.target.value ? parseInt(e.target.value, 10) : undefined)} />
            <span className="text-muted-foreground text-xs">-</span>
            <Input type="number" placeholder="Max" className="h-8 text-xs px-2" value={filters.maxTotalVideos || ""} onChange={(e) => update("maxTotalVideos", e.target.value ? parseInt(e.target.value, 10) : undefined)} />
          </div>
        </div>

        {/* Temporal Metrics */}
        <div className="col-span-full mt-2 mb-1 border-b border-border/30 pb-1">
          <h4 className="text-xs font-bold text-primary tracking-wider uppercase">Upload & Age</h4>
        </div>

        <div className="space-y-2 col-span-2 md:col-span-1">
          <Label className="text-xs text-muted-foreground">Last Uploaded</Label>
          <Select value={filters.lastUploadDate || "any"} onValueChange={(val) => update("lastUploadDate", val === "any" ? undefined : val)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Any" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="thisWeek">This Week</SelectItem>
              <SelectItem value="lastWeek">Last Week</SelectItem>
              <SelectItem value="lastMonth">Last Month</SelectItem>
              <SelectItem value="last3Months">Last 3 Months</SelectItem>
              <SelectItem value="last6Months">Last 6 Months</SelectItem>
              <SelectItem value="lastYear">Last Year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 col-span-2 md:col-span-1">
          <Label className="text-xs text-muted-foreground">Channel Age</Label>
          <Select value={filters.channelAge || "any"} onValueChange={(val) => update("channelAge", val === "any" ? undefined : val)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Any" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any Age</SelectItem>
              <SelectItem value="new">New Channel</SelectItem>
              <SelectItem value="30days">30 Days</SelectItem>
              <SelectItem value="90days">90 Days</SelectItem>
              <SelectItem value="6months">6 Months</SelectItem>
              <SelectItem value="1year">1 Year</SelectItem>
              <SelectItem value="2years">2 Years</SelectItem>
              <SelectItem value="5years">5 Years</SelectItem>
              <SelectItem value="10years">10+ Years</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 col-span-2 md:col-span-1">
          <Label className="text-xs text-muted-foreground">Upload Frequency</Label>
          <Select value={filters.uploadFrequency || "any"} onValueChange={(val) => update("uploadFrequency", val === "any" ? undefined : val)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Any" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any Frequency</SelectItem>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="seasonal">Seasonal</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Growth & Performance */}
        <div className="col-span-full mt-2 mb-1 border-b border-border/30 pb-1">
          <h4 className="text-xs font-bold text-primary tracking-wider uppercase">Growth & Performance</h4>
        </div>

        <div className="space-y-2 col-span-2 md:col-span-1">
          <Label className="text-xs text-muted-foreground">Growth Status</Label>
          <Select value={filters.growthStatus || "any"} onValueChange={(val) => update("growthStatus", val === "any" ? undefined : val)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Any" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any Status</SelectItem>
              <SelectItem value="Exploding">Exploding</SelectItem>
              <SelectItem value="Fast Growing">Fast Growing</SelectItem>
              <SelectItem value="Growing">Growing</SelectItem>
              <SelectItem value="Stable">Stable</SelectItem>
              <SelectItem value="Declining">Declining</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 col-span-2 md:col-span-1">
          <Label className="text-xs text-muted-foreground">Outlier Score</Label>
          <Input type="number" placeholder="Min Score (0-100)" className="h-8 text-xs" value={filters.minOutlierScore || ""} onChange={(e) => update("minOutlierScore", e.target.value ? parseInt(e.target.value, 10) : undefined)} />
        </div>

        <div className="space-y-2 col-span-2 md:col-span-1">
          <Label className="text-xs text-muted-foreground">Performance Ratio</Label>
          <Input type="number" placeholder="Min Ratio (e.g. 2.0)" className="h-8 text-xs" value={filters.minPerformanceRatio || ""} onChange={(e) => update("minPerformanceRatio", e.target.value ? parseFloat(e.target.value) : undefined)} />
        </div>

        <div className="space-y-2 col-span-2 md:col-span-1">
          <Label className="text-xs text-muted-foreground">Est. CTR (%)</Label>
          <Input type="number" placeholder="Min CTR" className="h-8 text-xs" value={filters.minCTR || ""} onChange={(e) => update("minCTR", e.target.value ? parseFloat(e.target.value) : undefined)} />
        </div>

        <div className="space-y-2 col-span-2 md:col-span-1">
          <Label className="text-xs text-muted-foreground">Engagement Rate</Label>
          <Input type="number" placeholder="Min %" className="h-8 text-xs" value={filters.minEngagementRate || ""} onChange={(e) => update("minEngagementRate", e.target.value ? parseFloat(e.target.value) : undefined)} />
        </div>

        <div className="space-y-2 col-span-2 md:col-span-1">
          <Label className="text-xs text-muted-foreground">View Velocity</Label>
          <Input type="number" placeholder="Min VPH" className="h-8 text-xs" value={filters.minViewVelocity || ""} onChange={(e) => update("minViewVelocity", e.target.value ? parseInt(e.target.value, 10) : undefined)} />
        </div>

        {/* Content & Geography */}
        <div className="col-span-full mt-2 mb-1 border-b border-border/30 pb-1">
          <h4 className="text-xs font-bold text-primary tracking-wider uppercase">Content & Geo</h4>
        </div>

        <div className="space-y-2 col-span-2 md:col-span-1">
          <Label className="text-xs text-muted-foreground">Category</Label>
          <Select value={filters.category || "any"} onValueChange={(val) => update("category", val === "any" ? undefined : val)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Any" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any Category</SelectItem>
              <SelectItem value="Entertainment">Entertainment</SelectItem>
              <SelectItem value="Education">Education</SelectItem>
              <SelectItem value="Gaming">Gaming</SelectItem>
              <SelectItem value="People & Blogs">People & Blogs</SelectItem>
              <SelectItem value="Tech">Science & Technology</SelectItem>
              <SelectItem value="Film & Animation">Film & Animation</SelectItem>
              <SelectItem value="News & Politics">News & Politics</SelectItem>
              <SelectItem value="Comedy">Comedy</SelectItem>
              <SelectItem value="Music">Music</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 col-span-2 md:col-span-1">
          <Label className="text-xs text-muted-foreground">Country</Label>
          <Select value={filters.country || "any"} onValueChange={(val) => update("country", val === "any" ? undefined : val)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Any" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any Country</SelectItem>
              <SelectItem value="US">United States</SelectItem>
              <SelectItem value="UK">United Kingdom</SelectItem>
              <SelectItem value="CA">Canada</SelectItem>
              <SelectItem value="AU">Australia</SelectItem>
              <SelectItem value="IN">India</SelectItem>
              <SelectItem value="DE">Germany</SelectItem>
              <SelectItem value="FR">France</SelectItem>
              <SelectItem value="JP">Japan</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2 col-span-2 md:col-span-1">
          <Label className="text-xs text-muted-foreground">Language</Label>
          <Select value={filters.language || "any"} onValueChange={(val) => update("language", val === "any" ? undefined : val)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Any" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any Language</SelectItem>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="es">Spanish</SelectItem>
              <SelectItem value="fr">French</SelectItem>
              <SelectItem value="de">German</SelectItem>
              <SelectItem value="hi">Hindi</SelectItem>
              <SelectItem value="ja">Japanese</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 col-span-2 md:col-span-1">
          <Label className="text-xs text-muted-foreground">Min Similarity Score</Label>
          <Input type="number" placeholder="Min Score (0-100)" className="h-8 text-xs" value={filters.minSimilarity || ""} onChange={(e) => update("minSimilarity", e.target.value ? parseInt(e.target.value, 10) : undefined)} />
        </div>

        <div className="space-y-2 col-span-2 md:col-span-1">
          <Label className="text-xs text-muted-foreground">Opportunity Score</Label>
          <Input type="number" placeholder="Min Score (0-100)" className="h-8 text-xs" value={filters.minOpportunityScore || ""} onChange={(e) => update("minOpportunityScore", e.target.value ? parseInt(e.target.value, 10) : undefined)} />
        </div>

        {/* Toggles */}
        <div className="col-span-full mt-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 items-center bg-background/50 p-3 rounded-lg">
          
          <div className="flex items-center space-x-2">
            <Switch id="verified" checked={!!filters.verifiedOnly} onCheckedChange={(val) => update("verifiedOnly", val)} />
            <Label htmlFor="verified" className="text-xs cursor-pointer text-muted-foreground whitespace-nowrap">Verified Only</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch id="monetized" checked={!!filters.monetizedOnly} onCheckedChange={(val) => update("monetizedOnly", val)} />
            <Label htmlFor="monetized" className="text-xs cursor-pointer text-muted-foreground whitespace-nowrap">Monetized</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch id="brandChannel" checked={!!filters.brandChannel} onCheckedChange={(val) => update("brandChannel", val)} />
            <Label htmlFor="brandChannel" className="text-xs cursor-pointer text-muted-foreground whitespace-nowrap">Brand Channel</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch id="faceless" checked={!!filters.facelessOnly} onCheckedChange={(val) => update("facelessOnly", val)} />
            <Label htmlFor="faceless" className="text-xs cursor-pointer text-muted-foreground whitespace-nowrap">Faceless</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch id="shortsOnly" checked={!!filters.shortsOnly} onCheckedChange={(val) => update("shortsOnly", val)} />
            <Label htmlFor="shortsOnly" className="text-xs cursor-pointer text-muted-foreground whitespace-nowrap">Shorts Only</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch id="longformOnly" checked={!!filters.longFormOnly} onCheckedChange={(val) => update("longFormOnly", val)} />
            <Label htmlFor="longformOnly" className="text-xs cursor-pointer text-muted-foreground whitespace-nowrap">Long-form Only</Label>
          </div>

        </div>

        {/* Sorting */}
        <div className="col-span-full mt-4 flex items-center justify-end gap-4 border-t border-border/30 pt-4">
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground whitespace-nowrap">Sort By</Label>
            <Select value={filters.sortBy || "similarity"} onValueChange={(val) => update("sortBy", val)}>
              <SelectTrigger className="h-8 text-xs w-[140px]">
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="similarity">Similarity</SelectItem>
                <SelectItem value="subscribers">Subscribers</SelectItem>
                <SelectItem value="views">Views</SelectItem>
                <SelectItem value="averageViews">Average Views</SelectItem>
                <SelectItem value="growth">Growth</SelectItem>
                <SelectItem value="uploadFrequency">Upload Frequency</SelectItem>
                <SelectItem value="virality">Virality</SelectItem>
                <SelectItem value="ctr">CTR</SelectItem>
                <SelectItem value="retention">Retention</SelectItem>
                <SelectItem value="engagement">Engagement</SelectItem>
                <SelectItem value="outlierScore">Outlier Score</SelectItem>
                <SelectItem value="opportunity">Opportunity</SelectItem>
                <SelectItem value="competition">Competition</SelectItem>
                <SelectItem value="difficulty">Difficulty</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground whitespace-nowrap">Order</Label>
            <Select value={filters.sortOrder || "desc"} onValueChange={(val) => update("sortOrder", val)}>
              <SelectTrigger className="h-8 text-xs w-[110px]">
                <SelectValue placeholder="Order..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Descending</SelectItem>
                <SelectItem value="asc">Ascending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
