'use client';

import { useState, useEffect } from 'react';
import Window from './Window';
import { useWindowManager } from '../context/WindowManagerContext';

interface SelectedWork {
  id: string;
  title: string;
  subtitle?: string;
  slug: string;
  display_order: number;
}

interface SelectedWorksWindowProps {
  onClose: () => void;
  onOpenWork: (slug: string, title: string) => void;
}

export default function SelectedWorksWindow({ onClose, onOpenWork }: SelectedWorksWindowProps) {
  const [works, setWorks] = useState<SelectedWork[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const { windows } = useWindowManager();

  useEffect(() => {
    const fetchWorks = async () => {
      try {
        const response = await fetch('/api/selected-works');
        if (response.ok) {
          const data = await response.json();
          console.log('Selected works data:', data);
          setWorks(data);
        }
      } catch (err) {
        console.error('Failed to fetch selected works:', err);
      } finally {
        setLoading(false);
      }
    };

    void fetchWorks();
  }, []);

  // Calculate cascaded position based on number of open windows
  const windowWidth = 600;
  const windowHeight = 400;
  const cascadeOffset = 40;
  
  // Count windows to determine cascade level (subtract 1 for this window itself)
  const windowCount = windows.length;
  const cascadeLevel = windowCount > 0 ? windowCount - 1 : 0;
  
  // Start from a base position and cascade
  const baseX = typeof window !== 'undefined' ? (window.innerWidth - windowWidth) / 2 : 100;
  const baseY = typeof window !== 'undefined' ? (window.innerHeight - windowHeight) / 2 : 100;
  
  const defaultX = baseX + (cascadeLevel * cascadeOffset);
  const defaultY = baseY + (cascadeLevel * cascadeOffset);

  return (
    <Window
      id="selected-works"
      title="Selected Works"
      defaultWidth={windowWidth}
      defaultHeight={windowHeight}
      defaultX={defaultX}
      defaultY={defaultY}
      onClose={onClose}
      draggable={true}
      resizable={true}
    >
      <div className="h-full flex flex-col bg-white">
        {/* List Header */}
        <div className="flex border-b border-[#808080] bg-[#c0c0c0] text-xs font-bold">
          <div className="flex-1 px-2 py-1 border-r border-[#808080]">Name</div>
          <div className="w-32 px-2 py-1 border-r border-[#808080]">Type</div>
          <div className="w-32 px-2 py-1">Modified</div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto bg-white">
          {loading ? (
            <div className="p-4 text-sm text-[#111]">Loading...</div>
          ) : works.length === 0 ? (
            <div className="p-4 text-sm text-[#111]">No works found.</div>
          ) : (
            works.map((work, index) => (
              <div
                key={work.id}
                className={`flex items-center px-1 py-0.5 text-sm cursor-pointer text-[#111] ${
                  selectedIndex === index 
                    ? 'bg-[#000080]/20' 
                    : 'hover:bg-[#e0e0e0]'
                }`}
                onClick={() => setSelectedIndex(index)}
                onDoubleClick={() => {
                  // Open the work detail window
                  console.log('Double-clicked work:', work);
                  onOpenWork(work.slug, work.title);
                }}
              >
                <div className="flex-1 px-1 flex items-center gap-2">
                  {/* File icon */}
                  <svg width="16" height="16" viewBox="0 0 16 16" className="flex-shrink-0">
                    <rect x="2" y="1" width="10" height="14" fill="#ffffff" stroke="#000" />
                    <path d="M8 1 L12 1 L12 5 L8 5 Z" fill="#e0e0e0" stroke="#000" />
                    <line x1="4" y1="7" x2="10" y2="7" stroke="#000" />
                    <line x1="4" y1="9" x2="10" y2="9" stroke="#000" />
                    <line x1="4" y1="11" x2="8" y2="11" stroke="#000" />
                  </svg>
                  <span className="truncate">{work.title}</span>
                </div>
                <div className="w-32 px-1 truncate">Project</div>
                <div className="w-32 px-1 truncate">-</div>
              </div>
            ))
          )}
        </div>

        {/* Status Bar */}
        <div className="border-t border-[#808080] bg-[#c0c0c0] px-2 py-1 text-xs text-[#111]">
          {works.length} object(s)
        </div>
      </div>
    </Window>
  );
}

