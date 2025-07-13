import React, { useState, useRef, useEffect } from 'react';
// @ts-expect-error: No types for react-syntax-highlighter
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
// @ts-expect-error: No types for react-syntax-highlighter
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface ButtonTooltipProps {
  children: React.ReactElement;
}

function getButtonCode(props: any, children: React.ReactNode) {
  const propOrder = [
    'style', 'color', 'size', 'disabled', 'className', 'iconLeft', 'iconRight', 'type', 'onClick'
  ];
  const entries = Object.entries(props)
    .filter(([key, value]) =>
      value !== undefined &&
      key !== 'children' &&
      key !== 'ref' &&
      key !== 'forwardedAs' &&
      typeof value !== 'function'
    )
    .sort(([a], [b]) => propOrder.indexOf(a) - propOrder.indexOf(b));
  const propString = entries
    .map(([key, value]) => {
      if (typeof value === 'string') {
        return `${key}="${value}"`;
      } else if (typeof value === 'boolean') {
        return value ? key : '';
      } else if (React.isValidElement(value)) {
        return `${key}={<... />}`;
      }
      return '';
    })
    .filter(Boolean)
    .join(' ');
  return `<Button${propString ? ' ' + propString : ''}>`;
}

const TYPING_SPEED = 18; // ms per character

const ButtonTooltip: React.FC<ButtonTooltipProps> = ({ children }) => {
  const [show, setShow] = useState(false);
  const [anim, setAnim] = useState(false);
  const [typedLength, setTypedLength] = useState(0);
  const timeout = useRef<NodeJS.Timeout | null>(null);
  const typingInterval = useRef<NodeJS.Timeout | null>(null);

  const buttonProps = (children.props ?? {}) as Record<string, any>;
  const code = getButtonCode(buttonProps, buttonProps.children);

  useEffect(() => {
    if (show) {
      setTypedLength(0);
      typingInterval.current = setInterval(() => {
        setTypedLength((len) => {
          if (len < code.length) {
            return len + 1;
          } else {
            if (typingInterval.current) clearInterval(typingInterval.current);
            return len;
          }
        });
      }, TYPING_SPEED);
      return () => {
        if (typingInterval.current) clearInterval(typingInterval.current);
      };
    } else {
      setTypedLength(0);
      if (typingInterval.current) clearInterval(typingInterval.current);
    }
  }, [show, code]);

  const handleEnter = () => {
    setAnim(true);
    timeout.current = setTimeout(() => {
      setShow(true);
    }, 350);
  };
  const handleLeave = () => {
    setAnim(false);
    setShow(false);
    if (timeout.current) clearTimeout(timeout.current);
    if (typingInterval.current) clearInterval(typingInterval.current);
  };

  // Match SVG border radius to Button's border radius
  let rx = 6;
  if (buttonProps.size === 'large') rx = 8;

  return (
    <span className="relative inline-block w-fit align-middle" onMouseEnter={handleEnter} onMouseLeave={handleLeave} onFocus={handleEnter} onBlur={handleLeave} tabIndex={-1}>
      {/* Only show SVG border on hover/focus */}
      {anim && (
        <span className="absolute inset-0 pointer-events-none z-10">
          <svg
            className="w-full h-full stroke-2 stroke-primary animate-stroke"
            fill="none"
          >
            <rect x="1" y="1" width="calc(100% - 2px)" height="calc(100% - 2px)" rx={rx} />
          </svg>
        </span>
      )}
      {children}
      {show && (
        <div className="absolute -top-8 left-0 px-3 py-1 rounded bg-background border border-border shadow z-20 whitespace-nowrap animate-fade-in font-mono" style={{ fontSize: '10px', minWidth: 0 }}>
          <SyntaxHighlighter
            language="jsx"
            style={vscDarkPlus}
            customStyle={{ background: 'transparent', margin: 0, padding: 0, fontSize: '10px', minWidth: 0, display: 'inline' }}
            codeTagProps={{ style: { fontFamily: 'var(--font-geist-mono, monospace)' } }}
            PreTag="span"
            wrapLines={false}
            showLineNumbers={false}
          >
            {code.slice(0, typedLength)}
            {typedLength === code.length && <span className="blinking-cursor">|</span>}
          </SyntaxHighlighter>
        </div>
      )}
      <style jsx>{`
        .blinking-cursor {
          display: inline-block;
          width: 1ch;
          color: var(--foreground);
          vertical-align: baseline;
        }
        @keyframes stroke {
          0% { stroke-dasharray: 0 400; }
          100% { stroke-dasharray: 400 0; }
        }
        .animate-stroke rect {
          stroke-dasharray: 400 0;
          stroke-dashoffset: 0;
          animation: stroke 0.35s cubic-bezier(.4,0,.2,1) forwards;
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(8px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </span>
  );
};

export default ButtonTooltip; 