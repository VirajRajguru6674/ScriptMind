
import React, { useState, useEffect, useMemo } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Youtube, Download, Loader2, ListVideo, Check, CheckSquare, Square, MoreVertical, Settings2, DownloadCloud } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import API_BASE_URL from "@/lib/api";

interface PlaylistVideo {
    id: string;
    title: string;
    thumbnail: string;
    channelTitle: string;
}

const FALLBACK_RESOLUTIONS = [
    { value: '360p', label: '360p' },
    { value: '720p', label: '720p' },
    { value: '1080p', label: '1080p' },
    { value: 'mp3', label: 'Audio Only (MP3)' },
];

const QUALITY_ORDER = ['144p', '240p', '360p', '480p', '720p', '1080p', '1440p', '4k', '8k', 'mp3'];
const QUALITY_LABELS: Record<string, string> = { '144p': '144p', '240p': '240p', '360p': '360p', '480p': '480p', '720p': '720p', '1080p': '1080p', '1440p': '1440p', '4k': '4K (Ultra HD)', '8k': '8K', 'mp3': 'Audio Only (MP3)' };

export default function PlaylistDownloader() {
    const [url, setUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [videos, setVideos] = useState<PlaylistVideo[]>([]);
    const [selectedVideos, setSelectedVideos] = useState<string[]>([]);
    const [quality, setQuality] = useState('1080p');
    const [isDownloading, setIsDownloading] = useState<string | null>(null);
    const [videoFormats, setVideoFormats] = useState<Record<string, { value: string; label: string }[]>>({});
    const [loadingFormats, setLoadingFormats] = useState<string | null>(null);
    const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({});
    const [downloadedVideos, setDownloadedVideos] = useState<Set<string>>(new Set());
    const { toast } = useToast();

    const fetchVideoFormats = async (videoId: string) => {
        if (videoFormats[videoId]) return;
        setLoadingFormats(videoId);
        try {
            const res = await fetch(`${API_BASE_URL}/video-formats?videoId=${videoId}`);
            const data = await res.json();
            if (data.qualities?.length) {
                setVideoFormats(prev => ({ ...prev, [videoId]: data.qualities }));
            } else {
                setVideoFormats(prev => ({ ...prev, [videoId]: FALLBACK_RESOLUTIONS }));
            }
        } catch {
            setVideoFormats(prev => ({ ...prev, [videoId]: FALLBACK_RESOLUTIONS }));
        } finally {
            setLoadingFormats(null);
        }
    };

    // Fetch formats for all videos when playlist loads (throttled)
    useEffect(() => {
        if (videos.length === 0) return;
        const BATCH_SIZE = 3;
        let idx = 0;
        const runBatch = async () => {
            const batch = videos.slice(idx, idx + BATCH_SIZE);
            idx += BATCH_SIZE;
            await Promise.all(batch.map((v) => fetchVideoFormats(v.id)));
            if (idx < videos.length) runBatch();
        };
        runBatch();
    }, [videos.map((v) => v.id).join(',')]);

    // Union of qualities across all videos for bulk selector
    const playlistQualities = useMemo(() => {
        const seen = new Set<string>();
        videos.forEach((v) => {
            (videoFormats[v.id] || []).forEach((q) => seen.add(q.value));
        });
        const sorted = [...seen].sort((a, b) => QUALITY_ORDER.indexOf(a) - QUALITY_ORDER.indexOf(b));
        return sorted.map((v) => ({ value: v, label: QUALITY_LABELS[v] ?? v }));
    }, [videos, videoFormats]);

    // Sync bulk quality when playlist qualities load - use best available if current not supported
    useEffect(() => {
        if (playlistQualities.length && !playlistQualities.some((q) => q.value === quality)) {
            const videoQualities = playlistQualities.filter((q) => q.value !== 'mp3');
            const best = (videoQualities.length ? videoQualities[videoQualities.length - 1] : playlistQualities[0])?.value ?? '1080p';
            setQuality(best);
        }
    }, [playlistQualities]);

    const handleFetchPlaylist = async () => {
        if (!url) return;

        const playlistId = url.split('list=')[1]?.split('&')[0];
        if (!playlistId) {
            toast({ variant: "destructive", title: "Invalid URL", description: "Please provide a valid YouTube playlist link." });
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/playlist-info?playlistId=${playlistId}`);
            const data = await response.json();
            if (data.videos) {
                setVideos(data.videos);
                setSelectedVideos([]);
                setDownloadedVideos(new Set());
                setVideoFormats({});
                toast({ title: "Success!", description: `Found ${data.videos.length} videos in playlist.` });
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            toast({ variant: "destructive", title: "Fetch Failed", description: "Could not retrieve playlist contents." });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownload = async (videoId: string, title: string, selectedQuality?: string) => {
        const qualityToUse = selectedQuality ?? quality;
        setIsDownloading(videoId);
        setDownloadProgress((p) => ({ ...p, [videoId]: 0 }));
        try {
            const token = localStorage.getItem('token');
            const blob = await new Promise<Blob>((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('POST', `${API_BASE_URL}/download`);
                xhr.setRequestHeader('Content-Type', 'application/json');
                xhr.setRequestHeader('x-action-type', 'download');
                if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
                xhr.responseType = 'blob';
                xhr.onprogress = (e) => {
                    if (e.lengthComputable) {
                        const pct = Math.round((e.loaded / e.total) * 100);
                        setDownloadProgress((prev) => ({ ...prev, [videoId]: pct }));
                    } else {
                        setDownloadProgress((prev) => ({ ...prev, [videoId]: prev[videoId] ?? 0 }));
                    }
                };
                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) resolve(xhr.response as Blob);
                    else reject(new Error("Download failed"));
                };
                xhr.onerror = () => reject(new Error("Download failed"));
                xhr.send(JSON.stringify({ videoId, quality: qualityToUse, title }));
            });
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = `${title}.${qualityToUse === 'mp3' ? 'mp3' : 'mp4'}`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(downloadUrl);
            toast({ title: "Download complete", description: title });
            setDownloadedVideos(prev => new Set(prev).add(videoId));
        } catch (error) {
            toast({ variant: "destructive", title: "Download Error", description: `Failed to download ${title}` });
        } finally {
            setIsDownloading(null);
            setDownloadProgress((p) => {
                const next = { ...p };
                delete next[videoId];
                return next;
            });
        }
    };

    const handleBulkDownload = async () => {
        if (selectedVideos.length === 0) return;
        toast({ title: "Bulk Download", description: `Queued ${selectedVideos.length} downloads...` });

        for (const id of selectedVideos) {
            const video = videos.find(v => v.id === id);
            if (video) {
                await handleDownload(id, video.title, quality);
            }
        }
    };

    const toggleSelectAll = () => {
        if (selectedVideos.length === videos.length) {
            setSelectedVideos([]);
        } else {
            setSelectedVideos(videos.map(v => v.id));
        }
    };

    const toggleVideoSelection = (id: string) => {
        setSelectedVideos(prev =>
            prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
        );
    };

    return (
        <div className="flex h-screen bg-background overflow-hidden">
            <Sidebar />
            <main className="flex-1 flex flex-col min-w-0 lg:ml-[296px]">
                <Header />

                <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8">
                    <div className="max-w-5xl mx-auto space-y-8">
                        <div className="text-center space-y-4">
                            <div className="inline-flex p-3 bg-primary/10 rounded-2xl text-primary mb-2">
                                <Youtube className="w-8 h-8" />
                            </div>
                            <h1 className="text-4xl font-black tracking-tight mb-2">Playlist Downloader</h1>
                            <p className="text-muted-foreground text-lg">Download entire YouTube playlists in up to 8K resolution.</p>

                            <div className="flex gap-2 max-w-2xl mx-auto pt-4">
                                <Input
                                    placeholder="Paste YouTube Playlist URL here..."
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    className="h-12 px-6 rounded-2xl bg-secondary/30 border-border/50 focus-visible:ring-primary"
                                />
                                <Button
                                    onClick={handleFetchPlaylist}
                                    disabled={isLoading}
                                    className="h-12 px-8 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg"
                                >
                                    {isLoading ? <Loader2 className="animate-spin" /> : "Fetch Playlist"}
                                </Button>
                            </div>
                        </div>

                        {videos.length > 0 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex items-center justify-between bg-card border border-border/50 p-4 rounded-3xl shadow-sm backdrop-blur-md sticky top-0 z-10">
                                    <div className="flex items-center gap-4">
                                        <Button variant="ghost" onClick={toggleSelectAll} className="gap-2 text-sm">
                                            {selectedVideos.length === videos.length ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                                            {selectedVideos.length === videos.length ? "Deselect All" : "Select All"}
                                        </Button>
                                        <div className="h-6 w-[1px] bg-border/50" />
                                        <p className="text-sm font-medium text-muted-foreground">
                                            {selectedVideos.length} videos selected
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <Select
                                            value={playlistQualities.some((q) => q.value === quality) ? quality : (playlistQualities[0]?.value ?? '1080p')}
                                            onValueChange={setQuality}
                                        >
                                            <SelectTrigger className="w-[200px] h-10 rounded-xl bg-secondary/30 border-transparent">
                                                <Settings2 className="w-4 h-4 mr-2" />
                                                <SelectValue placeholder="Resolution" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {(playlistQualities.length ? playlistQualities : FALLBACK_RESOLUTIONS).map((res) => (
                                                    <SelectItem key={res.value} value={res.value}>{res.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>

                                        <Button
                                            disabled={selectedVideos.length === 0 || !!isDownloading}
                                            onClick={handleBulkDownload}
                                            className="gap-2 bg-foreground text-background hover:bg-foreground/90 rounded-xl h-10 px-6 font-bold"
                                        >
                                            <DownloadCloud className="w-4 h-4" />
                                            Bulk Download
                                        </Button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {videos.map((v) => (
                                        <Card key={v.id} className={cn(
                                            "group relative overflow-hidden rounded-2xl border transition-all duration-300",
                                            selectedVideos.includes(v.id) ? "border-primary/50 bg-primary/5 ring-1 ring-primary/20" : "border-border/50 bg-card hover:border-primary/30"
                                        )}>
                                            <CardContent className="p-3">
                                                <div className="relative aspect-video rounded-xl overflow-hidden mb-3">
                                                    <img src={v.thumbnail} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt={v.title} />
                                                    <div className="absolute top-2 left-2">
                                                        <Checkbox
                                                            checked={selectedVideos.includes(v.id)}
                                                            onCheckedChange={() => toggleVideoSelection(v.id)}
                                                            className="w-5 h-5 border-white/50 bg-black/20 backdrop-blur-md"
                                                        />
                                                    </div>
                                                    {isDownloading === v.id && (
                                                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-3 p-4">
                                                            <Loader2 className="w-8 h-8 animate-spin text-white shrink-0" />
                                                            <div className="w-full max-w-[180px] space-y-1">
                                                                <Progress value={downloadProgress[v.id] ?? 0} className="h-2" />
                                                                <p className="text-center text-sm font-medium text-white">
                                                                    {downloadProgress[v.id] ?? 0}%
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {downloadedVideos.has(v.id) && isDownloading !== v.id && (
                                                        <div className="absolute inset-0 bg-primary/20 backdrop-blur-[2px] flex items-center justify-center animate-in fade-in zoom-in duration-300">
                                                            <div className="bg-primary text-primary-foreground p-2 rounded-full shadow-lg">
                                                                <Check className="w-6 h-6 stroke-[3px]" />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <h4 className="font-bold text-sm line-clamp-2 leading-tight group-hover:text-primary transition-colors">{v.title}</h4>
                                                        {downloadedVideos.has(v.id) && (
                                                            <span className="shrink-0 flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                                                                <Check className="w-3 h-3" />
                                                                Done
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-[10px] text-muted-foreground">{v.channelTitle}</p>
                                                </div>
                                                <DropdownMenu onOpenChange={(open) => open && fetchVideoFormats(v.id)}>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="absolute bottom-2 right-2 h-8 w-8 rounded-full bg-secondary opacity-0 group-hover:opacity-100 transition-opacity"
                                                            disabled={!!isDownloading}
                                                        >
                                                            <Download className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-48">
                                                        {loadingFormats === v.id ? (
                                                            <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                                Loading qualities...
                                                            </div>
                                                        ) : (
                                                            (videoFormats[v.id] || FALLBACK_RESOLUTIONS).map((res) => (
                                                                <DropdownMenuItem
                                                                    key={res.value}
                                                                    onClick={() => handleDownload(v.id, v.title, res.value)}
                                                                >
                                                                    {res.label}
                                                                </DropdownMenuItem>
                                                            ))
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )}

                        {!videos.length && !isLoading && (
                            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground opacity-30">
                                <ListVideo className="w-20 h-20 mb-4 stroke-1" />
                                <p>Paste a playlist link and click fetch to see videos</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
