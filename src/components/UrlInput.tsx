import { useState } from "react";
import { Link2, ArrowRight, Loader2, ClipboardPaste } from "lucide-react";
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
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Link2 className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/70" />
            <Input
              type="url"
              placeholder="Paste YouTube video URL here..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="h-14 pl-12 pr-4 text-base rounded-xl border border-border bg-secondary/30 text-foreground placeholder:text-muted-foreground focus:bg-secondary/50 focus-visible:ring-1 focus-visible:ring-primary/50 transition-all shadow-inner"
              disabled={isLoading}
            />
          </div>
          <Button
            type="submit"
            size="lg"
            className="h-14 px-8 text-base font-black rounded-xl bg-gradient-to-r from-violet-600 via-primary to-indigo-600 text-white shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] transition-all hover:scale-[1.02] active:scale-[0.98] border border-white/20"
            disabled={isLoading || !url.trim() || !isValidYoutubeUrl(url)}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processing
              </>
            ) : (
              <>
                Generate
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>
        </div>
        {url && !isValidYoutubeUrl(url) && (
          <p className="mt-2 text-sm text-destructive">Please enter a valid YouTube URL</p>
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
