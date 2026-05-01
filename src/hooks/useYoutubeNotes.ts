import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface VideoInfo {
  id: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
  description: string;
  hasCaptions?: boolean;
}

const API_BASE_URL = 'http://localhost:3001/api';

export function useYoutubeNotes() {
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [notes, setNotes] = useState("");
  const { toast } = useToast();

  const extractVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const processVideo = async (
    url: string,
    manualTranscript?: string
  ): Promise<{ video: VideoInfo; notes: string } | null> => {
    const videoId = extractVideoId(url);
    if (!videoId) {
      toast({ variant: "destructive", title: "Invalid URL", description: "Please enter a valid YouTube URL" });
      return null;
    }

    setIsLoadingVideo(true);
    setIsLoadingNotes(true);
    setVideoInfo(null);
    setNotes("");

    try {
      const response = await fetch(`${API_BASE_URL}/process-video`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId, manualTranscript })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to process video');
      }

      const data = await response.json();
      console.log('API Response:', data);
      console.log('Video Info:', data.video);
      console.log('Notes:', data.notes);

      setVideoInfo(data.video);
      setNotes(data.notes);

      toast({ title: "Notes generated!", description: "Saved to your MySQL database." });
      return { video: data.video, notes: data.notes };
    } catch (error: any) {
      console.error('Error processing video:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
      return null;
    } finally {
      console.log('Setting loading states to false');
      setIsLoadingVideo(false);
      setIsLoadingNotes(false);
    }
  };

  const reset = () => {
    setVideoInfo(null);
    setNotes("");
  };

  return {
    isLoadingVideo,
    isLoadingNotes,
    videoInfo,
    notes,
    processVideo,
    setVideoInfo,
    setNotes,
    reset,
  };
}
