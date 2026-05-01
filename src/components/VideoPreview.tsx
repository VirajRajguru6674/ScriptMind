interface VideoInfo {
  id: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
  description: string;
  url?: string;
}

interface VideoPreviewProps {
  video: VideoInfo | null;
  isLoading: boolean;
}

export function VideoPreview({ video, isLoading }: VideoPreviewProps) {
  if (isLoading) {
    return (
      <div className="animate-pulse rounded-xl border border-border bg-card p-4">
        <div className="aspect-video w-full rounded-lg bg-muted" />
        <div className="mt-4 space-y-2">
          <div className="h-6 w-3/4 rounded bg-muted" />
          <div className="h-4 w-1/2 rounded bg-muted" />
        </div>
      </div>
    );
  }

  if (!video) return null;

  return (
    <div className="group relative w-full aspect-video bg-black/50 overflow-hidden cursor-pointer">
      <div className="absolute inset-0 z-0">
        <img
          src={video.thumbnail}
          alt={video.title}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-90 group-hover:opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
      </div>

      <a
        href={`https://www.youtube.com/watch?v=${video.id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute inset-0 z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-90 group-hover:scale-100"
      >
        <div className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-full font-semibold shadow-lg transition-colors">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M8 5v14l11-7z" />
          </svg>
          Watch on YouTube
        </div>
      </a>
    </div>
  );
}
