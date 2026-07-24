import { memo } from "react";
import { Channel, SimilarChannel } from "@/lib/types/discovery";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bookmark, Pin, BarChart2, FileText, ShieldAlert, Globe, Video, Eye, Calendar, Activity, Zap } from "lucide-react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";

interface ChannelCardProps {
  channel: Channel | SimilarChannel;
  onSave?: (id: string) => void;
  onPin?: (id: string) => void;
  onCompare?: (id: string) => void;
  onOpenReport?: (id: string) => void;
}

function formatNumber(num: number): string {
  if (num >= 1e6) return (num / 1e6).toFixed(1) + "M";
  if (num >= 1e3) return (num / 1e3).toFixed(1) + "K";
  return num.toString();
}

export const ChannelCard = memo(function ChannelCard({ channel, onSave, onPin, onCompare, onOpenReport }: ChannelCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow bg-card/50 backdrop-blur-sm border-border/50">
      {/* Banner */}
      <div className="h-24 w-full bg-secondary/50 relative">
        {channel.bannerUrl ? (
          <Image src={channel.bannerUrl} alt="Banner" fill className="object-cover opacity-80" unoptimized />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-primary/20 to-primary/5" />
        )}
      </div>

      <CardContent className="p-5 pt-0 relative">
        {/* Profile Image */}
        <div className="absolute -top-10 left-5 w-20 h-20 rounded-full border-4 border-background overflow-hidden bg-secondary">
          <Image src={channel.thumbnailUrl} alt={channel.title} fill className="object-cover" unoptimized />
        </div>

        {/* Header Actions */}
        <div className="flex justify-end pt-3 gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => onPin?.(channel.id)} title="Pin Channel">
            <Pin className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => onSave?.(channel.id)} title="Save to Session">
            <Bookmark className="h-4 w-4" />
          </Button>
        </div>

        {/* Title & Handle */}
        <div className="mt-2">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold truncate" title={channel.title}>{channel.title}</h3>
                {channel.verified && <ShieldAlert className="w-3 h-3 text-blue-500" />}
                {channel.monetized && <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-500 border-green-500/20">Monetized</Badge>}
              </div>
              <p className="text-sm text-muted-foreground font-medium">{channel.handle}</p>
            </div>
            {channel.similarityScore !== undefined && (
              <div className="flex flex-col items-end shrink-0">
                <div className="flex items-center gap-1 font-bold text-primary" title="Similarity Score">
                  <Zap className="w-4 h-4" />
                  <span>{channel.similarityScore}%</span>
                </div>
                {channel.confidenceScore && (
                  <Badge variant="outline" className="text-[10px] mt-1 bg-primary/10 border-primary/20" title="Confidence Score">
                    {channel.confidenceScore}% Conf.
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="text-sm mt-3 line-clamp-2 text-muted-foreground/80 min-h-[40px]">
          {channel.description || "No description available."}
        </p>

        {/* Primary Metrics Grid */}
        <div className="grid grid-cols-3 gap-4 mt-5 p-4 bg-secondary/20 rounded-lg">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground uppercase font-semibold">Subscribers</span>
            <span className="text-lg font-bold text-foreground">{formatNumber(channel.subscriberCount)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground uppercase font-semibold">Total Views</span>
            <span className="text-lg font-bold text-foreground">{formatNumber(channel.viewCount)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground uppercase font-semibold">Videos</span>
            <span className="text-lg font-bold text-foreground">{formatNumber(channel.videoCount)}</span>
          </div>
        </div>

        {/* Secondary Details */}
        <div className="mt-4 grid grid-cols-2 gap-y-2 text-xs text-muted-foreground/90">
          <div className="flex items-center gap-2" title="Country"><Globe className="w-3.5 h-3.5" /> {channel.country || "Unknown"}</div>
          <div className="flex items-center gap-2" title="Language"><FileText className="w-3.5 h-3.5" /> {channel.language || "Unknown"}</div>
          
          <div className="flex items-center gap-2" title="Created"><Calendar className="w-3.5 h-3.5" /> {new Date(channel.publishedAt).toLocaleDateString()}</div>
          <div className="flex items-center gap-2" title="Last Upload"><Video className="w-3.5 h-3.5" /> {channel.lastUploadAt ? formatDistanceToNow(new Date(channel.lastUploadAt)) + " ago" : "Unknown"}</div>
          
          <div className="flex items-center gap-2" title="Upload Frequency"><Activity className="w-3.5 h-3.5" /> {channel.uploadFrequency || "Unknown frequency"}</div>
          <div className="flex items-center gap-2" title="Growth Status"><BarChart2 className="w-3.5 h-3.5" /> {channel.growthStatus || "Stable"}</div>
        </div>

        {/* Enterprise Metrics Row */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30 text-xs">
          {channel.performanceRatio !== undefined && (
             <div className="flex flex-col">
               <span className="text-muted-foreground">Perf. Ratio</span>
               <span className="font-bold text-foreground">{channel.performanceRatio}x</span>
             </div>
          )}
          {channel.outlierScore !== undefined && (
             <div className="flex flex-col text-right">
               <span className="text-muted-foreground">Outlier Score</span>
               <span className="font-bold text-orange-500">{channel.outlierScore}/100</span>
             </div>
          )}
        </div>

        {/* Evidence */}
        {channel.evidence && channel.evidence.length > 0 && (
          <div className="mt-3 p-2 bg-primary/5 rounded border border-primary/10 text-[10px] text-muted-foreground">
            <span className="font-semibold block mb-1">Match Evidence:</span>
            <ul className="list-disc pl-4 space-y-0.5">
              {channel.evidence.map((ev, idx) => (
                <li key={idx}>{ev}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Tags / Niche */}
        <div className="flex flex-wrap gap-1.5 mt-4">
          {channel.primaryNiche && <Badge variant="default" className="text-[10px]">{channel.primaryNiche}</Badge>}
          {channel.subNiche && <Badge variant="secondary" className="text-[10px] bg-secondary/60">{channel.subNiche}</Badge>}
          {channel.viewerIntent && <Badge variant="outline" className="text-[10px]">{channel.viewerIntent}</Badge>}
          {channel.niche && channel.niche.map((tag) => (
            tag !== channel.primaryNiche && tag !== channel.subNiche && (
              <Badge key={tag} variant="secondary" className="text-[10px] bg-secondary/30 text-muted-foreground">{tag}</Badge>
            )
          ))}
        </div>

        {/* Action Footer */}
        <div className="flex gap-3 mt-6 pt-5 border-t border-border/50">
          <Button variant="outline" className="flex-1 text-xs" onClick={() => onCompare?.(channel.id)}>
            <BarChart2 className="w-4 h-4 mr-2" />
            Compare
          </Button>
          <Button className="flex-1 text-xs bg-primary/90 hover:bg-primary text-primary-foreground" onClick={() => onOpenReport?.(channel.id)}>
            <FileText className="w-4 h-4 mr-2" />
            Intelligence
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});
