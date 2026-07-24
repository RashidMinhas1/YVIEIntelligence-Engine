import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, SlidersHorizontal, Loader2 } from "lucide-react";
import { useState } from "react";

interface ChannelSearchBarProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
  onToggleFilters?: () => void;
}

export function ChannelSearchBar({ onSearch, isLoading, onToggleFilters }: ChannelSearchBarProps) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 w-full max-w-3xl">
      <div className="relative flex-1">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted-foreground">
          <Search className="h-5 w-5" />
        </div>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by channel name, niche, keywords, or URL..."
          className="pl-10 h-12 text-base bg-card border-border/50 shadow-sm"
        />
      </div>
      <Button type="submit" size="lg" className="h-12 px-8" disabled={isLoading}>
        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Search"}
      </Button>
      <Button 
        type="button" 
        variant="outline" 
        size="icon" 
        className="h-12 w-12 border-border/50 bg-card shrink-0"
        onClick={onToggleFilters}
        title="Advanced Filters"
      >
        <SlidersHorizontal className="h-5 w-5 text-muted-foreground" />
      </Button>
    </form>
  );
}
