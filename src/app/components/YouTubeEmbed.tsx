import { youtubeEmbedUrl, youtubeWatchUrl } from '@/lib/youtube'

type YouTubeEmbedProps = {
  videoId: string
  title?: string
}

/** Responsive 16:9 YouTube player for featured work / field note content. */
export default function YouTubeEmbed({ videoId, title = 'YouTube video' }: YouTubeEmbedProps) {
  const src = youtubeEmbedUrl(videoId)
  const watchUrl = youtubeWatchUrl(videoId)

  return (
    <div className="youtube-embed">
      <iframe
        className="youtube-embed__frame"
        src={src}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
      />
      <a
        href={watchUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="youtube-embed__fallback sr-only"
      >
        Watch on YouTube
      </a>
    </div>
  )
}
