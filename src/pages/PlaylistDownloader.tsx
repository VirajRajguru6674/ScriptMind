
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

const BULK_QUALITIES = [
    { value: '360p', label: '360p' },
    { value: '720p', label: '720p' },
    { value: '1080p', label: '1080p' },
    { value: '1440p', label: '1440p' },
    { value: '4k', label: '4K (Ultra HD)' },
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
    const [allowedQualities, setAllowedQualities] = useState<{ value: string; label: string }[]>(FALLBACK_RESOLUTIONS);
    const { toast } = useToast();

    useEffect(() => {
        const fetchAllowedQualities = async () => {
            try {
                const token = localStorage.getItem('token');
                const headers: Record<string, string> = {
                    'Content-Type': 'application/json'
                };
                if (token) {
                    headers['Authorization'] = `Bearer ${token}`;
                }
                const res = await fetch(`${API_BASE_URL}/allowed-qualities`, { headers });
                const data = await res.json();
                if (data.qualities?.length) {
                    setAllowedQualities(data.qualities);
                }
            } catch (err) {
                console.error("Failed to load allowed qualities", err);
            }
        };
        fetchAllowedQualities();
    }, []);

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
                xhr.onload = async () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        resolve(xhr.response as Blob);
                    } else {
                        try {
                            const text = await xhr.response.text();
                            const errorData = JSON.parse(text);
                            reject(new Error(errorData.error || "Download failed"));
                        } catch (e) {
                            reject(new Error("Download failed"));
                        }
                    }
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
        } catch (error: any) {
            toast({ 
                variant: "destructive", 
                title: "Download Error", 
                description: error.message || `Failed to download ${title}` 
            });
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

                <div className="flex-1 overflow-y-auto p-4 md:py-8 md:pr-8 md:pl-0 space-y-8">
                    <div className="max-w-6xl space-y-8 pb-12">
                        {/* Title, Subtitle, and Input aligned directly on page */}
                        <div className="space-y-4 text-left">
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-2.5">
                                    <div className="flex p-2 bg-gradient-to-tr from-primary to-purple-600 rounded-xl text-white shadow-md shadow-primary/10">
                                        <Youtube className="w-5 h-5" />
                                    </div>
                                    <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
                                        Playlist Downloader
                                    </h1>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 max-w-3xl pt-2 w-full">
                                <Input
                                    placeholder="Paste YouTube Playlist URL here..."
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    className="h-11 px-5 rounded-xl bg-secondary/20 border-border/50 focus-visible:ring-primary backdrop-blur-md text-xs sm:text-sm"
                                />
                                <Button
                                    onClick={handleFetchPlaylist}
                                    disabled={isLoading}
                                    className="h-11 px-6 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-extrabold text-xs sm:text-sm shadow-md shadow-primary/10 transition-all duration-300 shrink-0"
                                >
                                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Fetch Playlist"}
                                </Button>
                            </div>
                        </div>

                        {videos.length > 0 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {/* Responsive Control Toolbar */}
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card/70 border border-border/50 p-4 sm:p-5 rounded-3xl shadow-lg backdrop-blur-md sticky top-4 z-10">
                                    <div className="flex items-center justify-between sm:justify-start gap-4">
                                        <Button variant="ghost" onClick={toggleSelectAll} className="gap-2 text-sm font-semibold rounded-xl hover:bg-secondary/50 px-3">
                                            {selectedVideos.length === videos.length ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4" />}
                                            {selectedVideos.length === videos.length ? "Deselect All" : "Select All"}
                                        </Button>
                                        <div className="hidden sm:block h-6 w-[1px] bg-border/50" />
                                        <p className="text-xs sm:text-sm font-bold text-primary bg-primary/10 px-3 py-1 rounded-xl">
                                            {selectedVideos.length} Selected
                                        </p>
                                    </div>

                                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                                        <Select
                                            value={quality}
                                            onValueChange={setQuality}
                                        >
                                            <SelectTrigger className="w-full sm:w-[200px] h-11 rounded-xl bg-secondary/35 border-transparent font-semibold">
                                                <Settings2 className="w-4 h-4 mr-2 text-muted-foreground" />
                                                <SelectValue placeholder="Resolution" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-border/50">
                                                {allowedQualities.map((res) => (
                                                    <SelectItem key={res.value} value={res.value} className="font-semibold text-xs">{res.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>

                                        <Button
                                            disabled={selectedVideos.length === 0 || !!isDownloading}
                                            onClick={handleBulkDownload}
                                            className="w-full sm:w-auto gap-2 bg-foreground text-background hover:bg-foreground/90 rounded-xl h-11 px-6 font-extrabold transition-all duration-300 shadow-md"
                                        >
                                            <DownloadCloud className="w-4 h-4" />
                                            Bulk Download
                                        </Button>
                                    </div>
                                </div>

                                {/* Responsive Card Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {videos.map((v) => (
                                        <Card key={v.id} className={cn(
                                            "group relative flex flex-col overflow-hidden rounded-3xl border bg-card hover:shadow-2xl hover:shadow-primary/5 hover:border-primary/20 hover:-translate-y-1 transition-all duration-300",
                                            selectedVideos.includes(v.id) ? "border-primary/50 bg-primary/5 ring-1 ring-primary/20" : "border-border/50 hover:bg-card/90"
                                        )}>
                                            <CardContent className="p-0 flex flex-col h-full">
                                                {/* Thumbnail Container */}
                                                <div className="relative aspect-video w-full overflow-hidden bg-secondary">
                                                    <img src={v.thumbnail} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt={v.title} />
                                                    
                                                    {/* Checkbox overlay always visible */}
                                                    <div className="absolute top-3 left-3 z-20">
                                                        <Checkbox
                                                            checked={selectedVideos.includes(v.id)}
                                                            onCheckedChange={() => toggleVideoSelection(v.id)}
                                                            className="w-5.5 h-5.5 rounded-lg border-white/50 bg-black/40 backdrop-blur-md data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                                        />
                                                    </div>
                                                    
                                                    {/* Progress Spinner overlay */}
                                                    {isDownloading === v.id && (
                                                        <div className="absolute inset-0 z-30 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center gap-3 p-4">
                                                            <Loader2 className="w-9 h-9 animate-spin text-primary" />
                                                            <div className="w-full max-w-[140px] space-y-1 text-center">
                                                                <Progress value={downloadProgress[v.id] ?? 0} className="h-1.5 bg-white/20" />
                                                                <p className="text-xs font-bold text-white tracking-wider">
                                                                    {downloadProgress[v.id] ?? 0}%
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}
                                                    
                                                    {/* Checkmark overlay for done */}
                                                    {downloadedVideos.has(v.id) && isDownloading !== v.id && (
                                                        <div className="absolute inset-0 z-25 bg-primary/25 backdrop-blur-[1px] flex items-center justify-center animate-in fade-in zoom-in duration-300">
                                                            <div className="bg-primary text-primary-foreground p-2.5 rounded-full shadow-xl shadow-primary/20">
                                                                <Check className="w-6 h-6 stroke-[3px]" />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Details & Actions Block */}
                                                <div className="p-4 flex flex-col justify-between flex-1 min-h-[140px]">
                                                    <div className="space-y-1.5">
                                                        <h4 className="font-extrabold text-sm line-clamp-2 leading-snug group-hover:text-primary transition-colors text-card-foreground">
                                                            {v.title}
                                                        </h4>
                                                        <p className="text-[11px] font-medium text-muted-foreground">{v.channelTitle}</p>
                                                    </div>

                                                    <div className="flex items-center justify-between pt-4 border-t border-border/30 mt-auto">
                                                        {downloadedVideos.has(v.id) ? (
                                                            <span className="flex items-center gap-1 text-[10px] font-black text-primary bg-primary/10 px-2 py-1 rounded-lg uppercase tracking-wider">
                                                                <Check className="w-3.5 h-3.5" />
                                                                Done
                                                            </span>
                                                        ) : (
                                                            <span className="text-[11px] text-muted-foreground font-semibold">Ready</span>
                                                        )}

                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button
                                                                    variant="secondary"
                                                                    size="sm"
                                                                    className="h-8 gap-1.5 px-3 rounded-lg bg-secondary/50 hover:bg-primary hover:text-primary-foreground transition-all duration-300 font-extrabold text-xs shadow-sm hover:shadow-md"
                                                                    disabled={!!isDownloading}
                                                                >
                                                                    <Download className="w-3.5 h-3.5" />
                                                                    Download
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="w-48 rounded-xl p-1.5 shadow-xl border-border/50">
                                                                {allowedQualities.map((res) => (
                                                                    <DropdownMenuItem
                                                                        key={res.value}
                                                                        onClick={() => handleDownload(v.id, v.title, res.value)}
                                                                        className="rounded-lg font-bold text-xs py-2 cursor-pointer focus:bg-primary focus:text-primary-foreground transition-colors"
                                                                    >
                                                                        {res.label}
                                                                    </DropdownMenuItem>
                                                                ))}
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )}

                        {!videos.length && !isLoading && (
                            <div className="relative rounded-3xl border border-dashed border-border/60 bg-card/10 backdrop-blur-sm p-16 text-center max-w-xl mx-auto space-y-4 animate-in fade-in duration-500">
                                <div className="inline-flex p-4 bg-secondary/40 rounded-2xl text-muted-foreground mb-2">
                                    <ListVideo className="w-12 h-12 stroke-1" />
                                </div>
                                <h3 className="font-extrabold text-lg tracking-tight">No Playlist Loaded</h3>
                                <p className="text-muted-foreground text-sm max-w-xs mx-auto">Enter a valid YouTube playlist URL above and click Fetch to retrieve videos.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
