import React, { createContext, useContext, useState, ReactNode } from "react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useLocation } from "react-router-dom";

interface VideoInfo {
    id: string;
    title: string;
    channelTitle: string;
    thumbnail: string;
    description: string;
    hasCaptions?: boolean;
    url?: string;
}

interface NotesContextType {
    videoInfo: VideoInfo | null;
    notes: string;
    isLoadingVideo: boolean;
    isLoadingNotes: boolean;
    processVideo: (url: string) => Promise<void>;
    loadHistoryItem: (item: any) => void;
    reset: () => void;
    setVideoInfo: (info: VideoInfo | null) => void;
    setNotes: (notes: string) => void;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

const API_BASE_URL = 'http://localhost:3001/api';

export const NotesProvider = ({ children }: { children: ReactNode }) => {
    const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
    const [notes, setNotes] = useState("");
    const [isLoadingVideo, setIsLoadingVideo] = useState(false);
    const [isLoadingNotes, setIsLoadingNotes] = useState(false);
    const { toast } = useToast();
    const navigate = useNavigate();
    const location = useLocation();

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

    const processVideo = async (url: string) => {
        const videoId = extractVideoId(url);
        if (!videoId) {
            toast({ variant: "destructive", title: "Invalid URL", description: "Please enter a valid YouTube URL" });
            return;
        }

        setIsLoadingVideo(true);
        setIsLoadingNotes(true);
        setVideoInfo(null);
        setNotes("");

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Please login to generate notes');
            }

            const headers: HeadersInit = { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'x-action-type': 'notes'
            };

            console.log('Sending request to:', `${API_BASE_URL}/process-video`);
            console.log('Video ID:', videoId);

            const response = await fetch(`${API_BASE_URL}/process-video`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ videoId })
            }).catch((fetchError) => {
                console.error('Fetch error:', fetchError);
                throw new Error(`Network error: ${fetchError.message}. Please check if the server is running on port 3001.`);
            });

            if (!response.ok) {
                let errorMessage = 'Failed to process video';
                try {
                    const err = await response.json();
                    errorMessage = err.error || errorMessage;
                } catch (parseError) {
                    errorMessage = `Server error: ${response.status} ${response.statusText}`;
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();
            // Store the original URL with the video info
            setVideoInfo({ ...data.video, url: url });
            setNotes(data.notes);

            if (location.pathname !== "/") {
                navigate("/");
            }

            toast({ title: "Notes generated!", description: "Saved to your history." });
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message,
            });
        } finally {
            setIsLoadingVideo(false);
            setIsLoadingNotes(false);
        }
    };

    const loadHistoryItem = (item: any) => {
        const videoUrl = item.video_url || item.videoUrl || `https://www.youtube.com/watch?v=${item.videoId || item.video_id}`;
        setVideoInfo({
            id: item.videoId || item.video_id,
            title: item.title,
            channelTitle: item.channel_title || "",
            thumbnail: item.thumbnail,
            description: item.description || "",
            hasCaptions: true,
            url: videoUrl
        });
        setNotes(item.notes);

        if (location.pathname !== "/") {
            navigate("/");
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const reset = () => {
        setVideoInfo(null);
        setNotes("");
        if (location.pathname !== "/") {
            navigate("/");
        }
    };

    return (
        <NotesContext.Provider value={{
            videoInfo,
            notes,
            isLoadingVideo,
            isLoadingNotes,
            processVideo,
            loadHistoryItem,
            reset,
            setVideoInfo,
            setNotes
        }}>
            {children}
        </NotesContext.Provider>
    );
};

export const useNotes = () => {
    const context = useContext(NotesContext);
    if (context === undefined) {
        throw new Error("useNotes must be used within a NotesProvider");
    }
    return context;
};
