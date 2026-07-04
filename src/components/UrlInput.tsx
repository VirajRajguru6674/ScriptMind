import { useState } from "react";
import { Link2, ArrowRight, Loader2, ClipboardPaste, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface UrlInputProps {
  onSubmit: (url: string, manualTranscript?: string) => void;
  isLoading: boolean;
}

export function UrlInput({ onSubmit, isLoading }: UrlInputProps) {
  const [url, setUrl] = useState("");
  const [manualTranscript, setManualTranscript] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onSubmit(url.trim());
    }
  };

  const handleManualSubmit = () => {
    if (url.trim() && manualTranscript.trim()) {
      onSubmit(url.trim(), manualTranscript.trim());
      setIsDialogOpen(false);
      setManualTranscript("");
    }
  };

  const isValidYoutubeUrl = (url: string) => {
    const pattern = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/).+/;
    return pattern.test(url);
  };

  return (
    <div className="w-full space-y-3">
      <form onSubmit={handleSubmit} className="w-full">
        <div className="relative w-full flex items-center bg-card border border-border rounded-full p-1.5 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all shadow-md pl-4">
          <Link2 className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            type="url"
            placeholder="Paste YouTube link here..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1 h-11 bg-transparent border-0 text-sm text-foreground placeholder:text-muted-foreground/75 focus:outline-none pl-3 pr-2 w-full min-w-0"
            disabled={isLoading}
          />
          <Button
            type="submit"
            className="h-11 px-6 rounded-full bg-foreground text-background font-bold text-sm shrink-0 transition-all duration-200 hover:bg-foreground/90 hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
            disabled={isLoading || !url.trim() || !isValidYoutubeUrl(url)}
          >
            {isLoading ? (
              <><Loader2 className="h-4 w-4 animate-spin" />Processing</>
            ) : (
              <><Zap className="h-4 w-4 fill-current" />Generate</>
            )}
          </Button>
        </div>

        {url && !isValidYoutubeUrl(url) && (
          <p className="mt-1.5 text-xs text-destructive/80 pl-1">Please enter a valid YouTube URL</p>
        )}
      </form>


      <div className="flex items-center justify-center gap-2">
        <span className="text-sm text-muted-foreground">Auto-fetch not working?</span>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="link" size="sm" className="h-auto p-0 text-primary">
              <ClipboardPaste className="mr-1 h-4 w-4" />
              Paste transcript manually
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Paste Transcript Manually</DialogTitle>
              <DialogDescription>
                Copy the transcript from YouTube (click "..." below video → "Show transcript") and paste it here.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  YouTube URL
                </label>
                <Input
                  type="url"
                  placeholder="https://youtube.com/watch?v=..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="h-12"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  Transcript
                </label>
                <Textarea
                  placeholder="Paste the full transcript here..."
                  value={manualTranscript}
                  onChange={(e) => setManualTranscript(e.target.value)}
                  className="min-h-[200px] resize-none"
                />
              </div>
              <Button
                onClick={handleManualSubmit}
                className="w-full"
                disabled={!url.trim() || !manualTranscript.trim() || !isValidYoutubeUrl(url)}
              >
                Generate Notes from Transcript
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
