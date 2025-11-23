'use client';

interface DesktopIconProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}

export default function DesktopIcon({ icon, label, onClick }: DesktopIconProps) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 w-28 p-3 hover:bg-[rgba(0,0,128,0.15)] focus:bg-[rgba(0,0,128,0.3)] focus:outline-dotted focus:outline-1 focus:outline-white group"
    >
      <div className="w-18 h-18 flex items-center justify-center">
        {icon}
      </div>
      <span className="text-sm text-white text-center leading-tight font-bold drop-shadow-[1px_1px_1px_rgba(0,0,0,0.8)]">
        {label}
      </span>
    </button>
  );
}

