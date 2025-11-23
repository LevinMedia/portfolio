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

  return (
    <Window
      id={`work-${slug}`}
      title={title}
      defaultWidth={windowWidth}
      defaultHeight={windowHeight}
      defaultX={defaultX}
      defaultY={defaultY}
      onClose={onClose}
      draggable={true}
      resizable={true}
    >
      {loading ? (
        <div className="h-full overflow-y-auto overflow-x-hidden bg-white p-4">
          <div className="text-sm text-[#111]">Loading...</div>
        </div>
      ) : error ? (
        <div className="h-full overflow-y-auto overflow-x-hidden bg-white p-4">
          <div className="text-sm text-red-600">{error}</div>
        </div>
      ) : work ? (
        <div className="h-full overflow-y-auto overflow-x-hidden bg-white">
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
                  <div key={index} className="work-detail-content text-sm @[600px]:text-base text-[#111] leading-relaxed">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeRaw]}
                      components={{
                        h1: ({ children }) => <h1 className="text-2xl @[600px]:text-3xl font-bold text-[#111] mb-4 mt-6">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-xl @[600px]:text-2xl font-bold text-[#111] mb-3 mt-5">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-lg @[600px]:text-xl font-bold text-[#111] mb-3 mt-4">{children}</h3>,
                        h4: ({ children }) => <h4 className="text-base @[600px]:text-lg font-bold text-[#111] mb-2 mt-3">{children}</h4>,
                        h5: ({ children }) => <h5 className="text-sm @[600px]:text-base font-bold text-[#111] mb-2 mt-3">{children}</h5>,
                        h6: ({ children }) => <h6 className="text-xs @[600px]:text-sm font-bold text-[#111] mb-2 mt-2">{children}</h6>,
                        p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc mb-4 space-y-2" style={{ paddingLeft: '1.5rem' }}>{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal mb-4 space-y-2" style={{ paddingLeft: '1.5rem' }}>{children}</ol>,
                        li: ({ children }) => <li>{children}</li>,
                        blockquote: ({ children }) => <blockquote className="border-l-4 border-[#808080] pl-4 italic text-[#666] my-4">{children}</blockquote>,
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
                          <code className="bg-[#f0f0f0] px-1 py-0.5 border border-[#ccc] text-xs font-mono">
                            {children}
                          </code>
                        ),
                        pre: ({ children }) => (
                          <pre className="bg-[#f0f0f0] p-4 border-2 border-[#808080] overflow-x-auto my-4">
                            {children}
                          </pre>
                        ),
                        a: ({ href, children }) => (
                          <a href={href} target="_blank" rel="noopener noreferrer" className="text-[#0000ff] underline hover:text-[#800080] visited:text-[#800080]">
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
              <div className="mx-auto text-xs text-[#666] border-t-2 border-[#808080] pt-2 mt-4" style={{ maxWidth: '768px' }}>
                Published: {new Date(work.published_at).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="h-full overflow-y-auto overflow-x-hidden bg-white p-4">
          <div className="text-sm text-[#111]">Work not found</div>
        </div>
      )}
    </Window>
  );
}

