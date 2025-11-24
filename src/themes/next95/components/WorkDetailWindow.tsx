'use client';

import { useState, useEffect } from 'react';
import Window from './Window';
import { useWindowManager } from '../context/WindowManagerContext';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import VideoPlayer from '@/app/components/VideoPlayer';

interface WorkDetail {
  id: string;
  title: string;
  slug: string;
  content: string;
  feature_image_url?: string;
  thumbnail_crop?: any;
  display_order: number;
  published_at: string;
}

interface WorkDetailWindowProps {
  slug: string;
  title: string;
  onClose: () => void;
}

// Helper function to parse content and extract video embeds
function parseContentWithVideos(content: string) {
  const videoRegex = /!video\[([^\]]*)\]\(([^)]+)\)/g;
  const parts: Array<{ type: 'markdown' | 'video'; content: string; alt?: string }> = [];
  let lastIndex = 0;
  let match;

  while ((match = videoRegex.exec(content)) !== null) {
    // Add markdown content before the video
    if (match.index > lastIndex) {
      parts.push({
        type: 'markdown',
        content: content.substring(lastIndex, match.index)
      });
    }

    // Add video
    parts.push({
      type: 'video',
      content: match[2], // URL
      alt: match[1] // Alt text
    });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining markdown content
  if (lastIndex < content.length) {
    parts.push({
      type: 'markdown',
      content: content.substring(lastIndex)
    });
  }

  return parts.length > 0 ? parts : [{ type: 'markdown', content }];
}

export default function WorkDetailWindow({ slug, title, onClose }: WorkDetailWindowProps) {
  const [work, setWork] = useState<WorkDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { windows } = useWindowManager();

  useEffect(() => {
    const fetchWork = async () => {
      try {
        const response = await fetch(`/api/selected-works/${slug}`);
        if (response.ok) {
          const data = await response.json();
          console.log('Work content sample:', data.content?.substring(0, 300));
          setWork(data);
        } else {
          setError('Failed to load work');
        }
      } catch (err) {
        console.error('Failed to fetch work:', err);
        setError('Failed to load work');
      } finally {
        setLoading(false);
      }
    };

    void fetchWork();
  }, [slug]);

  // Calculate cascaded position based on number of open windows
  const cascadeOffset = 40;
  const cascadeLevel = windows.length > 0 ? windows.length - 1 : 0;
  
  // Calculate window size with max 1000px width and fill height with padding
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 768;
  const taskbarHeight = 56;
  const verticalPadding = 40; // 20px top + 20px bottom
  
  const windowWidth = Math.min(1000, viewportWidth - 40); // Max 1000px or fill with 20px padding
  const windowHeight = viewportHeight - taskbarHeight - verticalPadding; // Fill height minus taskbar and padding
  
  const baseX = typeof window !== 'undefined' ? Math.max(20, (viewportWidth - windowWidth) / 2) : 100;
  const baseY = 20; // Start 20px from top
  
  const defaultX = baseX + (cascadeLevel * cascadeOffset);
  const defaultY = baseY + (cascadeLevel * cascadeOffset);

  const displayTitle = work?.title ?? title;

  return (
    <Window
      id={`work-${slug}`}
      slug={`selected-works/${slug}`}
      title={displayTitle}
      icon={
        <svg width="16" height="16" viewBox="0 0 16 16" className="flex-shrink-0">
          <rect x="2" y="1" width="10" height="14" fill="#ffffff" stroke="#000" />
          <path d="M8 1 L12 1 L12 5 L8 5 Z" fill="#e0e0e0" stroke="#000" />
          <line x1="4" y1="7" x2="10" y2="7" stroke="#000" />
          <line x1="4" y1="9" x2="10" y2="9" stroke="#000" />
          <line x1="4" y1="11" x2="8" y2="11" stroke="#000" />
        </svg>
      }
      defaultWidth={windowWidth}
      defaultHeight={windowHeight}
      defaultX={defaultX}
      defaultY={defaultY}
      onClose={onClose}
      draggable={true}
      resizable={true}
    >
      {loading ? (
        <div 
          className="h-full overflow-y-auto overflow-x-hidden p-4"
          style={{
            backgroundColor: 'var(--win95-content-bg, #ffffff)',
            color: 'var(--win95-content-text, #000000)'
          }}
        >
          <div className="text-sm">Loading...</div>
        </div>
      ) : error ? (
        <div 
          className="h-full overflow-y-auto overflow-x-hidden p-4"
          style={{
            backgroundColor: 'var(--win95-content-bg, #ffffff)',
            color: 'var(--win95-content-text, #000000)'
          }}
        >
          <div className="text-sm text-red-600">{error}</div>
        </div>
      ) : work ? (
        <div 
          className="h-full overflow-y-auto overflow-x-hidden"
          style={{
            backgroundColor: 'var(--win95-content-bg, #ffffff)',
            color: 'var(--win95-content-text, #000000)'
          }}
        >
          {/* Feature Image with Title Overlay - flush under header */}
          {work.feature_image_url && (
            <div className="relative w-full" style={{ height: '40vh', minHeight: '250px' }}>
              <Image 
                src={work.feature_image_url} 
                alt={work.title}
                fill
                className="object-cover"
                style={{ objectFit: 'cover' }}
                sizes="700px"
                priority
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
              {/* Title overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h1 className="text-2xl font-bold text-white" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                  {work.title}
                </h1>
              </div>
            </div>
          )}

          <div className="p-4">
            {/* Content - max-width 768px for text, 900px for images/videos */}
            <div className="mx-auto work-content-wrapper @container" style={{ maxWidth: '768px' }}>
              {parseContentWithVideos(work.content).map((part, index) => {
                if (part.type === 'video') {
                  return (
                    <div key={index} className="my-6 work-detail-video">
                      <VideoPlayer src={part.content} />
                    </div>
                  );
                }
                
                return (
                  <div key={index} className="work-detail-content text-sm @[600px]:text-base leading-relaxed">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeRaw]}
                      components={{
                        h1: ({ children }) => <h1 className="text-2xl @[600px]:text-3xl font-bold mb-4 mt-6" style={{ color: 'var(--win95-content-text, #111)' }}>{children}</h1>,
                        h2: ({ children }) => <h2 className="text-xl @[600px]:text-2xl font-bold mb-3 mt-5" style={{ color: 'var(--win95-content-text, #111)' }}>{children}</h2>,
                        h3: ({ children }) => <h3 className="text-lg @[600px]:text-xl font-bold mb-3 mt-4" style={{ color: 'var(--win95-content-text, #111)' }}>{children}</h3>,
                        h4: ({ children }) => <h4 className="text-base @[600px]:text-lg font-bold mb-2 mt-3" style={{ color: 'var(--win95-content-text, #111)' }}>{children}</h4>,
                        h5: ({ children }) => <h5 className="text-sm @[600px]:text-base font-bold mb-2 mt-3" style={{ color: 'var(--win95-content-text, #111)' }}>{children}</h5>,
                        h6: ({ children }) => <h6 className="text-xs @[600px]:text-sm font-bold mb-2 mt-2" style={{ color: 'var(--win95-content-text, #111)' }}>{children}</h6>,
                        p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc mb-4 space-y-2" style={{ paddingLeft: '1.5rem' }}>{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal mb-4 space-y-2" style={{ paddingLeft: '1.5rem' }}>{children}</ol>,
                        li: ({ children }) => <li>{children}</li>,
                        blockquote: ({ children }) => <blockquote className="border-l-4 pl-4 italic my-4" style={{ borderColor: 'var(--win95-border-mid, #808080)', color: 'var(--win95-content-text, #666)' }}>{children}</blockquote>,
                        img: ({ src, alt }) => {
                          if (!src) return null;
                          return (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img 
                              src={src} 
                              alt={alt || ''} 
                              className="work-detail-img"
                              loading="lazy"
                            />
                          );
                        },
                        strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                        em: ({ children }) => <em className="italic">{children}</em>,
                        code: ({ children }) => (
                          <code 
                            className="px-1 py-0.5 border text-xs font-mono"
                            style={{
                              backgroundColor: 'var(--win95-button-face, #f0f0f0)',
                              borderColor: 'var(--win95-border-mid, #ccc)',
                              color: 'var(--win95-text, #000)'
                            }}
                          >
                            {children}
                          </code>
                        ),
                        pre: ({ children }) => (
                          <pre 
                            className="p-4 border-2 overflow-x-auto my-4"
                            style={{
                              backgroundColor: 'var(--win95-button-face, #f0f0f0)',
                              borderColor: 'var(--win95-border-mid, #808080)',
                              color: 'var(--win95-text, #000)'
                            }}
                          >
                            {children}
                          </pre>
                        ),
                        a: ({ href, children }) => (
                          <a 
                            href={href} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="underline"
                            style={{ color: 'var(--next95-primary, #0000ff)' }}
                            onMouseEnter={(e) => e.currentTarget.style.color = getComputedStyle(document.documentElement).getPropertyValue('--next95-secondary').trim() || '#ff00ff'}
                            onMouseLeave={(e) => e.currentTarget.style.color = getComputedStyle(document.documentElement).getPropertyValue('--next95-primary').trim() || '#0000ff'}
                          >
                            {children}
                          </a>
                        ),
                        hr: () => <hr className="border-none border-t-2 border-[#808080] my-6" />
                      }}
                    >
                      {part.content}
                    </ReactMarkdown>
                  </div>
                );
              })}
            </div>
            <style jsx global>{`
              .work-content-wrapper {
                font-family: 'MS Sans Serif', system-ui, sans-serif;
                container-type: inline-size;
              }
              .work-detail-img {
                max-width: 900px !important;
                width: 100% !important;
                height: auto !important;
                margin: 1.5rem auto !important;
                border: none !important;
                display: block !important;
                position: relative !important;
                left: 50% !important;
                transform: translateX(-50%) !important;
              }
              .work-detail-video {
                max-width: 900px !important;
                width: 100% !important;
                margin: 1.5rem auto !important;
                position: relative !important;
                left: 50% !important;
                transform: translateX(-50%) !important;
              }
            `}</style>

            {/* Published Date */}
            {work.published_at && (
              <div 
                className="mx-auto text-xs border-t-2 pt-2 mt-4" 
                style={{ 
                  maxWidth: '768px',
                  color: 'var(--win95-content-text, #666)',
                  borderColor: 'var(--win95-border-mid, #808080)'
                }}
              >
                Published: {new Date(work.published_at).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div 
          className="h-full overflow-y-auto overflow-x-hidden p-4"
          style={{
            backgroundColor: 'var(--win95-content-bg, #ffffff)',
            color: 'var(--win95-content-text, #000000)'
          }}
        >
          <div className="text-sm">Work not found</div>
        </div>
      )}
    </Window>
  );
}

