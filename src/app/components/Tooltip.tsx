import React, { useState, useRef, useEffect, ReactElement } from 'react';
// @ts-expect-error: No types for react-syntax-highlighter
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
// @ts-expect-error: No types for react-syntax-highlighter
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface TooltipProps {
  children: ReactElement;
  codeGenerator?: (props: Record<string, unknown>, children: React.ReactNode) => string;
  borderRadius?: number;
  showBorder?: boolean;
  borderColor?: string;
  tooltipContent?: string;
  tooltipType?: 'code' | 'text';
  fullWidth?: boolean;
}

function getDefaultCode(props: Record<string, unknown>, children: React.ReactNode) {
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
  
  // Try to determine the component name
  let componentName = 'Component';
  
  if (React.isValidElement(children)) {
    const childType = children.type;
          if (typeof childType === 'function') {
        componentName = (childType as { displayName?: string; name?: string }).displayName || (childType as { name?: string }).name || 'Component';
    } else if (typeof childType === 'string') {
      componentName = childType;
    }
  }
  
  // Convert PascalCase to kebab-case for HTML-like components
  if (componentName !== 'Component') {
    componentName = componentName
      .replace(/([A-Z])/g, '-$1')
      .toLowerCase()
      .replace(/^-/, '');
  }
  
  return `<${componentName}${propString ? ' ' + propString : ''}>`;
}

const TYPING_SPEED = 4; // ms per character

const Tooltip: React.FC<TooltipProps> = ({
  children, 
  codeGenerator = getDefaultCode,
  borderRadius = 6,
  showBorder = true,
  borderColor = 'stroke-primary',
  tooltipContent,
  tooltipType = 'code',
  fullWidth = false
}) => {
  const [show, setShow] = useState(false);
  const [anim, setAnim] = useState(false);
  const [typedLength, setTypedLength] = useState(0);
  const [isDark, setIsDark] = useState(true);
  const timeout = useRef<NodeJS.Timeout | null>(null);
  const typingInterval = useRef<NodeJS.Timeout | null>(null);

  // Detect theme changes
  useEffect(() => {
    const detectTheme = () => {
      const html = document.documentElement;
      const hasLight = html.classList.contains('light');
      const hasDark = html.classList.contains('dark');
      
      if (hasLight) {
        setIsDark(false);
      } else if (hasDark) {
        setIsDark(true);
      } else {
        // Fall back to system preference
        setIsDark(window.matchMedia('(prefers-color-scheme: dark)').matches);
      }
    };

    detectTheme();

    // Watch for class changes on the html element
    const observer = new MutationObserver(detectTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  const componentProps = (children.props ?? {}) as Record<string, unknown>;
  const code = tooltipType === 'code' 
    ? (tooltipContent || codeGenerator(componentProps, componentProps.children as React.ReactNode))
    : tooltipContent || '';

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

  return (
    <span 
      className={`relative ${fullWidth ? 'block w-full' : 'inline-block w-fit align-middle'}`}
      onMouseEnter={handleEnter} 
      onMouseLeave={handleLeave} 
      onFocus={handleEnter} 
      onBlur={handleLeave} 
      tabIndex={-1}
    >
      {/* Animated border */}
      {showBorder && anim && (
        <span className="absolute inset-0 pointer-events-none z-40">
          <svg
            className={`w-full h-full stroke-2 animate-stroke ${borderColor}`}
            fill="none"
          >
            <rect 
              x="1" 
              y="1" 
              width="calc(100% - 2px)" 
              height="calc(100% - 2px)" 
              rx={borderRadius} 
            />
          </svg>
        </span>
      )}
      
      {/* Wrapped component */}
      {children}
      
      {/* Tooltip */}
      {show && (
        <div className="absolute bottom-full left-1/2 sm:left-0 transform -translate-x-1/2 sm:translate-x-0 py-1 rounded bg-background border border-border shadow z-40 whitespace-pre-wrap animate-fade-in font-mono mb-2 max-w-[calc(100vw-2rem)] overflow-x-auto" style={{ fontSize: '10px', minWidth: 0, wordBreak: 'break-word', paddingLeft: 'var(--grid-major)', paddingRight: 'var(--grid-major)' }}>
          {tooltipType === 'code' ? (
            <SyntaxHighlighter
              language="jsx"
              style={isDark ? vscDarkPlus : vs}
              customStyle={{ 
                background: 'transparent', 
                margin: 0, 
                padding: 0, 
                fontSize: '10px', 
                minWidth: 0, 
                display: 'inline',
                border: 'none',
                outline: 'none'
              }}
              lineProps={{
                style: { 
                  border: 'none', 
                  outline: 'none',
                  margin: 0,
                  padding: 0
                }
              }}
              codeTagProps={{ 
                style: { fontFamily: 'var(--font-geist-mono, monospace)' } 
              }}
              PreTag="span"
              wrapLines={false}
              showLineNumbers={false}
            >
              {code.slice(0, typedLength)}
              {typedLength === code.length && <span className="blinking-cursor">|</span>}
            </SyntaxHighlighter>
          ) : (
            <span className="text-foreground">
              {code.slice(0, typedLength)}
              {typedLength === code.length && <span className="blinking-cursor">|</span>}
            </span>
          )}
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

export default Tooltip; 