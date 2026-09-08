
import React, { useState, useEffect, useMemo } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { NotificationPanel } from '@/components/NotificationPanel';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { 
    Youtube, 
    Download, 
    Loader2, 
    ListVideo, 
    Check, 
    CheckSquare, 
    Square, 
    Settings2, 
    Link2, 
    Archive, 
    Sparkles, 
    Search, 
    X, 
    PlaySquare, 
    Layers, 
    CheckCircle,
    SlidersHorizontal
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
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

export default function PlaylistDownloader() {
    const [url, setUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [videos, setVideos] = useState<PlaylistVideo[]>([]);
    const [selectedVideos, setSelectedVideos] = useState<string[]>([]);
    const [quality, setQuality] = useState('1080p');
    const [searchQuery, setSearchQuery] = useState('');
    const [isDownloading, setIsDownloading] = useState<string | null>(null);
    const [isZipDownloading, setIsZipDownloading] = useState(false);
    const [zipProgress, setZipProgress] = useState(0);
    const [zipStatusMessage, setZipStatusMessage] = useState('');
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
            if (data.videos && data.videos.length > 0) {
                setVideos(data.videos);
                // Select all by default so user can directly click download, but allow 1-click select/deselect
                setSelectedVideos(data.videos.map((v: PlaylistVideo) => v.id));
                setDownloadedVideos(new Set());
                setSearchQuery('');
                toast({ title: "Playlist Loaded!", description: `Found ${data.videos.length} videos from ${data.videos[0]?.channelTitle || 'playlist'}.` });
            } else {
                throw new Error(data.error || "No videos found in this playlist.");
            }
        } catch (error: any) {
            toast({ variant: "destructive", title: "Fetch Failed", description: error.message || "Could not retrieve playlist contents." });
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

    // Bulk ZIP Archive Downloader
    const handleBulkZipDownload = async () => {
        if (selectedVideos.length === 0) {
            toast({ variant: "destructive", title: "No Videos Selected", description: "Please click on the video cards you want to download." });
            return;
        }

        const selectedItems = videos
            .filter(v => selectedVideos.includes(v.id))
            .map(v => ({ videoId: v.id, title: v.title }));

        const playlistTitle = videos[0]?.channelTitle ? `${videos[0].channelTitle}_Playlist` : 'Playlist_Videos';
        const cleanZipName = playlistTitle.replace(/[^a-z0-9_\-\s]/gi, '_').trim() || 'Playlist_Videos';

        setIsZipDownloading(true);
        setZipProgress(5);
        setZipStatusMessage(`Packaging ${selectedItems.length} videos into ZIP...`);

        try {
            const token = localStorage.getItem('token');
            const blob = await new Promise<Blob>((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('POST', `${API_BASE_URL}/download-zip`);
                xhr.setRequestHeader('Content-Type', 'application/json');
                xhr.setRequestHeader('x-action-type', 'download');
                if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
                xhr.responseType = 'blob';

                xhr.onprogress = (e) => {
                    if (e.lengthComputable && e.total > 0) {
                        const pct = Math.round((e.loaded / e.total) * 100);
                        setZipProgress(pct);
                        setZipStatusMessage(`Downloading ZIP archive (${pct}%)...`);
                    } else {
                        setZipProgress((prev) => Math.min(prev + 8, 85));
                        setZipStatusMessage(`Streaming ${selectedItems.length} videos into single ZIP folder...`);
                    }
                };

                xhr.onload = async () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        setZipProgress(100);
                        setZipStatusMessage('ZIP ready! Saving file to your computer...');
                        resolve(xhr.response as Blob);
                    } else {
                        try {
                            const text = await xhr.response.text();
                            const errorData = JSON.parse(text);
                            reject(new Error(errorData.error || "ZIP download failed"));
                        } catch (e) {
                            reject(new Error("ZIP download failed"));
                        }
                    }
                };

                xhr.onerror = () => reject(new Error("Network error during ZIP download"));
                xhr.send(JSON.stringify({
                    items: selectedItems,
                    quality,
                    zipName: cleanZipName
                }));
            });

            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = `${cleanZipName}_${quality}.zip`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(downloadUrl);

            toast({
                title: "🎉 ZIP Download Complete!",
                description: `Successfully downloaded ${selectedItems.length} videos in ${cleanZipName}_${quality}.zip`
            });

            // Mark all selected videos as downloaded
            setDownloadedVideos(prev => {
                const next = new Set(prev);
                selectedVideos.forEach(id => next.add(id));
                return next;
            });

        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Bulk ZIP Error",
                description: error.message || "Failed to create bulk ZIP download."
            });
        } finally {
            setIsZipDownloading(false);
            setZipProgress(0);
            setZipStatusMessage('');
        }
    };

    // Selection Handlers
    const isAllSelected = videos.length > 0 && selectedVideos.length === videos.length;
    const isNoneSelected = selectedVideos.length === 0;

    const handleToggleSelectAll = () => {
        if (isAllSelected) {
            setSelectedVideos([]);
        } else {
            setSelectedVideos(videos.map(v => v.id));
        }
    };

    const handleClearSelection = () => {
        setSelectedVideos([]);
    };

    const handleSelectFirstN = (count: number) => {
        const ids = videos.slice(0, count).map(v => v.id);
        setSelectedVideos(ids);
    };

    const toggleVideoSelection = (id: string) => {
        setSelectedVideos(prev =>
            prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
        );
    };

    // Filtered videos for search
    const filteredVideos = useMemo(() => {
        if (!searchQuery.trim()) return videos;
        const query = searchQuery.toLowerCase().trim();
        return videos.filter(v => 
            v.title.toLowerCase().includes(query) || 
            v.channelTitle.toLowerCase().includes(query)
        );
    }, [videos, searchQuery]);

    const handleSelectAllFiltered = () => {
        const filteredIds = filteredVideos.map(v => v.id);
        const allFilteredSelected = filteredIds.every(id => selectedVideos.includes(id));
        
        if (allFilteredSelected) {
            // Deselect filtered
            setSelectedVideos(prev => prev.filter(id => !filteredIds.includes(id)));
        } else {
            // Add all filtered
            setSelectedVideos(prev => Array.from(new Set([...prev, ...filteredIds])));
        }
    };

    return (
        <div className="flex h-screen bg-background overflow-hidden selection:bg-primary/20">
            <Sidebar />
            <main className="flex-1 flex flex-col min-w-0 lg:ml-[280px]">
                {/* Header */}
                <header className="sticky top-0 z-50 w-full border-b border-sidebar-border/50 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
                    <div className="flex h-16 items-center justify-between px-4 sm:px-8">
                        <div className="flex items-center gap-3 pl-12 lg:pl-0">
                            <div className="size-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm shadow-primary/10">
                                <Youtube className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-base sm:text-lg font-black tracking-tight text-foreground flex items-center gap-2">
                                    Playlist Downloader
                                    <span className="text-[10px] font-black uppercase tracking-wider bg-primary/15 text-primary px-2.5 py-0.5 rounded-full border border-primary/25 flex items-center gap-1">
                                        <Archive className="w-3 h-3" />
                                        Bulk ZIP
                                    </span>
                                </h1>
                            </div>
                        </div>
                        {/* Right side controls */}
                        <div className="flex items-center gap-2">
                            <NotificationPanel />
                            <ThemeToggle />
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
                    <div className="max-w-7xl mx-auto space-y-5 pb-16">
                        
                        {/* Compact URL Input Bar */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                            <div className="relative flex-1 group">
                                <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors duration-200 z-10 pointer-events-none" />
                                <Input
                                    placeholder="Paste YouTube Playlist URL (e.g. https://www.youtube.com/playlist?list=...)"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleFetchPlaylist()}
                                    className="h-11 pl-11 pr-10 rounded-xl bg-card/60 hover:bg-card/90 border-border/80 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 text-xs sm:text-sm w-full transition-all duration-200 shadow-sm"
                                />
                                {url && (
                                    <button
                                        onClick={() => setUrl('')}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded-full transition-colors"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                            <Button
                                onClick={handleFetchPlaylist}
                                disabled={isLoading || isZipDownloading || !url.trim()}
                                className="h-11 px-6 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs sm:text-sm shadow-sm hover:shadow transition-all duration-200 shrink-0 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Loading...
                                    </>
                                ) : (
                                    <>
                                        <PlaySquare className="w-4 h-4" />
                                        Fetch Playlist
                                    </>
                                )}
                            </Button>
                        </div>

                        {/* ZIP Packaging Active Banner */}
                        {isZipDownloading && (
                            <div className="bg-gradient-to-r from-primary/15 via-purple-500/10 to-primary/15 border border-primary/40 p-4 sm:p-5 rounded-2xl shadow-xl backdrop-blur-xl space-y-3 animate-in fade-in slide-in-from-top-4 duration-300">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="size-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary animate-pulse shadow-sm">
                                            <Archive className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-black text-xs sm:text-sm text-foreground flex items-center gap-2">
                                                Packaging {selectedVideos.length} Videos into ZIP
                                                <span className="text-[10px] bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-extrabold shadow-sm">
                                                    {quality.toUpperCase()}
                                                </span>
                                            </h4>
                                            <p className="text-[11px] text-muted-foreground font-medium mt-0.5">
                                                {zipStatusMessage || 'Downloading and streaming files into one compressed folder...'}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-black text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-lg shrink-0">
                                        {zipProgress > 0 ? `${zipProgress}%` : "Packaging..."}
                                    </span>
                                </div>
                                <Progress value={zipProgress > 0 ? zipProgress : undefined} className="h-2 bg-primary/20 rounded-full" />
                                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                                    <span className="flex items-center gap-1.5">
                                        <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
                                        All videos will be saved into one single ZIP folder on your computer.
                                    </span>
                                    <span className="font-semibold">{selectedVideos.length} selected</span>
                                </div>
                            </div>
                        )}

                        {/* Playlist Content & Controls */}
                        {videos.length > 0 && (
                            <div className="space-y-5 animate-in fade-in duration-500">
                                
                                {/* Sticky Control Toolbar */}
                                <div className="sticky top-20 z-40 rounded-2xl border border-border/80 bg-card/90 p-3 sm:p-4 shadow-xl backdrop-blur-2xl transition-all duration-200">
                                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                                        
                                        {/* Left: Quick Select Controls */}
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleToggleSelectAll}
                                                disabled={isZipDownloading}
                                                className="h-9 px-3.5 rounded-xl border-border/80 hover:border-primary/50 hover:bg-primary/10 text-xs font-bold gap-2 transition-all duration-200"
                                            >
                                                {isAllSelected ? (
                                                    <>
                                                        <CheckSquare className="w-4 h-4 text-primary" />
                                                        <span>Deselect All</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Square className="w-4 h-4 text-muted-foreground" />
                                                        <span>Select All ({videos.length})</span>
                                                    </>
                                                )}
                                            </Button>

                                            {!isNoneSelected && !isAllSelected && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={handleClearSelection}
                                                    disabled={isZipDownloading}
                                                    className="h-9 px-3 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary/60 gap-1.5"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                    Clear ({selectedVideos.length})
                                                </Button>
                                            )}

                                            {videos.length > 10 && (
                                                <div className="hidden sm:flex items-center gap-1 pl-1 border-l border-border/60">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleSelectFirstN(5)}
                                                        disabled={isZipDownloading}
                                                        className="h-7 px-2 rounded-lg text-[11px] font-bold text-muted-foreground hover:text-primary hover:bg-primary/10"
                                                    >
                                                        First 5
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleSelectFirstN(10)}
                                                        disabled={isZipDownloading}
                                                        className="h-7 px-2 rounded-lg text-[11px] font-bold text-muted-foreground hover:text-primary hover:bg-primary/10"
                                                    >
                                                        First 10
                                                    </Button>
                                                </div>
                                            )}

                                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-primary/10 border border-primary/20 text-xs font-bold text-primary">
                                                <Layers className="w-3.5 h-3.5" />
                                                <span>{selectedVideos.length} / {videos.length} selected</span>
                                            </div>
                                        </div>

                                        {/* Right: Search + Resolution + Grand Download ZIP CTA */}
                                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                                            {/* Search in playlist */}
                                            <div className="relative min-w-[170px] sm:w-[200px]">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                                                <Input
                                                    placeholder="Filter videos..."
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    className="h-9 pl-8 pr-7 text-xs rounded-xl bg-background/70 border-border/80 focus-visible:ring-1 focus-visible:ring-primary"
                                                />
                                                {searchQuery && (
                                                    <button 
                                                        onClick={() => setSearchQuery('')}
                                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                )}
                                            </div>

                                            {/* Resolution dropdown */}
                                            <Select
                                                value={quality}
                                                onValueChange={setQuality}
                                                disabled={isZipDownloading}
                                            >
                                                <SelectTrigger className="h-9 min-w-[120px] rounded-xl bg-background/70 border-border/80 text-xs font-bold focus:ring-1 focus:ring-primary">
                                                    <Settings2 className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                                                    <SelectValue placeholder="Quality" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl border-border/80 shadow-2xl">
                                                    {allowedQualities.map((res) => (
                                                        <SelectItem key={res.value} value={res.value} className="text-xs font-semibold py-2">
                                                            {res.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>

                                            {/* Download ZIP Button */}
                                            <Button
                                                disabled={selectedVideos.length === 0 || !!isDownloading || isZipDownloading}
                                                onClick={handleBulkZipDownload}
                                                className="h-9 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs shadow-sm hover:shadow transition-all duration-200 gap-1.5 shrink-0 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40"
                                            >
                                                {isZipDownloading ? (
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                ) : (
                                                    <Archive className="w-3.5 h-3.5" />
                                                )}
                                                {isZipDownloading
                                                    ? `Packaging (${selectedVideos.length})...`
                                                    : selectedVideos.length > 0
                                                        ? `Download ZIP (${selectedVideos.length})`
                                                        : "Select Videos for ZIP"}
                                            </Button>
                                        </div>

                                    </div>
                                </div>

                                {/* Results Counter when Filtered */}
                                {searchQuery && (
                                    <div className="flex items-center justify-between text-xs text-muted-foreground px-2">
                                        <p>
                                            Showing <span className="font-bold text-foreground">{filteredVideos.length}</span> matching "{searchQuery}"
                                        </p>
                                        {filteredVideos.length > 0 && (
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                onClick={handleSelectAllFiltered}
                                                className="h-7 text-xs font-semibold text-primary hover:bg-primary/10"
                                            >
                                                Toggle Filtered Results
                                            </Button>
                                        )}
                                    </div>
                                )}

                                {/* Card Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                                    {filteredVideos.map((v) => {
                                        const isSelected = selectedVideos.includes(v.id);
                                        const isDone = downloadedVideos.has(v.id);
                                        const isCurrentDownloading = isDownloading === v.id;
                                        // Original index in overall playlist
                                        const originalIndex = videos.findIndex(item => item.id === v.id) + 1;

                                        return (
                                            <Card
                                                key={v.id}
                                                onClick={() => !isZipDownloading && toggleVideoSelection(v.id)}
                                                className={cn(
                                                    "group relative flex flex-col overflow-hidden rounded-2xl border cursor-pointer transition-all duration-300 select-none",
                                                    isSelected
                                                        ? "border-primary/80 ring-2 ring-primary/40 bg-gradient-to-b from-primary/[0.08] to-card shadow-xl shadow-primary/10 -translate-y-0.5"
                                                        : "border-border/70 bg-card/60 hover:bg-card hover:border-primary/40 hover:shadow-lg hover:-translate-y-0.5"
                                                )}
                                            >
                                                <CardContent className="p-0 flex flex-col h-full">
                                                    
                                                    {/* Thumbnail Container */}
                                                    <div className="relative aspect-video w-full overflow-hidden bg-muted/40">
                                                        <img 
                                                            src={v.thumbnail} 
                                                            className={cn(
                                                                "w-full h-full object-cover transition-transform duration-500 group-hover:scale-105",
                                                                isSelected && "brightness-95"
                                                            )} 
                                                            alt={v.title} 
                                                            loading="lazy"
                                                        />

                                                        {/* Video Index Pill (Bottom-Left duration style so it NEVER covers thumbnail text) */}
                                                        <div className="absolute bottom-2 left-2 z-10">
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-black/75 backdrop-blur-md text-white/90 border border-white/10 shadow-sm">
                                                                #{originalIndex}
                                                            </span>
                                                        </div>

                                                        {/* Selection Checkbox Badge (Top-Right, clean glass aesthetic) */}
                                                        <div className="absolute top-2 right-2 z-20">
                                                            <div className={cn(
                                                                "size-6 rounded-full flex items-center justify-center transition-all duration-200 backdrop-blur-md border shadow-md",
                                                                isSelected 
                                                                    ? "bg-primary border-primary text-primary-foreground scale-105 shadow-primary/30" 
                                                                    : "bg-black/50 border-white/30 text-white/40 group-hover:text-white/80 group-hover:border-white/60 group-hover:scale-105"
                                                            )}>
                                                                <Check className={cn(
                                                                    "w-3.5 h-3.5 stroke-[3px] transition-transform duration-200",
                                                                    isSelected ? "scale-100 opacity-100" : "scale-75 opacity-0 group-hover:opacity-60"
                                                                )} />
                                                            </div>
                                                        </div>

                                                        {/* Progress Overlay when single downloading */}
                                                        {isCurrentDownloading && (
                                                            <div className="absolute inset-0 z-30 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2.5 p-4">
                                                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                                                <div className="w-full max-w-[130px] space-y-1 text-center">
                                                                    <Progress value={downloadProgress[v.id] ?? 0} className="h-1.5 bg-white/20" />
                                                                    <p className="text-[11px] font-extrabold text-white tracking-wider">
                                                                        {downloadProgress[v.id] ?? 0}%
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Checkmark overlay for completed video */}
                                                        {isDone && !isCurrentDownloading && (
                                                            <div className="absolute bottom-2 right-2 z-10 flex items-center gap-1 bg-emerald-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-md shadow-md">
                                                                <CheckCircle className="w-3 h-3" />
                                                                Saved
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Video Details & Actions */}
                                                    <div className="p-3.5 flex flex-col justify-between flex-1 gap-2.5">
                                                        <div className="space-y-1">
                                                            <h4 
                                                                title={v.title}
                                                                className={cn(
                                                                    "font-bold text-xs sm:text-sm line-clamp-2 leading-snug transition-colors",
                                                                    isSelected ? "text-primary font-extrabold" : "text-card-foreground group-hover:text-primary"
                                                                )}
                                                            >
                                                                {v.title}
                                                            </h4>
                                                            <p className="text-[11px] font-medium text-muted-foreground line-clamp-1">
                                                                {v.channelTitle}
                                                            </p>
                                                        </div>

                                                        {/* Footer action bar */}
                                                        <div 
                                                            className="flex items-center justify-between pt-2 border-t border-border/40 mt-auto"
                                                            onClick={(e) => e.stopPropagation()} // Prevent card selection when interacting with download
                                                        >
                                                            <span className={cn(
                                                                "text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider transition-colors",
                                                                isSelected 
                                                                    ? "bg-primary/15 text-primary border border-primary/20" 
                                                                    : "bg-secondary/60 text-muted-foreground"
                                                            )}>
                                                                {isSelected ? "Selected" : "Click to select"}
                                                            </span>

                                                            {/* Single video download dropdown */}
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="h-7 px-2.5 rounded-lg text-xs font-bold gap-1 text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                                                                        disabled={!!isDownloading || isZipDownloading}
                                                                        onClick={(e) => e.stopPropagation()}
                                                                    >
                                                                        <Download className="w-3 h-3 text-primary" />
                                                                        <span>Download</span>
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end" className="w-44 rounded-xl p-1 shadow-2xl border-border/80">
                                                                    {allowedQualities.map((res) => (
                                                                        <DropdownMenuItem
                                                                            key={res.value}
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleDownload(v.id, v.title, res.value);
                                                                            }}
                                                                            className="rounded-lg font-semibold text-xs py-1.5 cursor-pointer focus:bg-primary focus:text-primary-foreground transition-colors"
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
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Empty State */}
                        {!videos.length && !isLoading && (
                            <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-500 space-y-4 rounded-3xl border border-dashed border-border/80 bg-card/20 p-8">
                                <div className="size-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-inner">
                                    <ListVideo className="w-8 h-8 stroke-[1.5]" />
                                </div>
                                <div className="space-y-1.5 max-w-sm">
                                    <h3 className="font-extrabold text-base text-foreground">Ready to download your playlist</h3>
                                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                        Paste any YouTube playlist URL into the box above and click <span className="text-primary font-bold">Fetch Playlist</span> to download individual videos or the full series in a single ZIP file.
                                    </p>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </main>
        </div>
    );
}

