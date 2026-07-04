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
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shadow-inner">
          {/* Icon */}
          <div className="pl-3 shrink-0">
            <Link2 className="h-4 w-4 text-muted-foreground/50" />
          </div>

          {/* Input */}
          <Input
            type="url"
            placeholder="Paste YouTube video URL here..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1 h-11 border-0 bg-transparent shadow-none focus-visible:ring-0 text-sm placeholder:text-muted-foreground/40 text-foreground px-2"
            disabled={isLoading}
          />

          {/* Button */}
          <Button
            type="submit"
            className="h-11 px-6 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0"
            disabled={isLoading || !url.trim() || !isValidYoutubeUrl(url)}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Generate
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </>
            )}
          </Button>
        </div>

        {url && !isValidYoutubeUrl(url) && (
          <p className="mt-2 text-xs text-destructive/80 pl-2">Please enter a valid YouTube URL</p>
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
