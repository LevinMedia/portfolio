import { VT323 } from 'next/font/google'
import localFont from 'next/font/local'
import C64SettingsApplier from '@/app/components/C64SettingsApplier'
import { C64_INLINE_THEME_VARS_JSON } from '@/lib/c64-settings'

const vt323 = VT323({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-vt323',
})

const c64ProMono = localFont({
  src: '../../../public/fonts/C64_Pro_Mono-STYLE.woff2',
  display: 'swap',
  variable: '--font-c64-pro',
  fallback: ['ui-monospace', 'monospace'],
  preload: true,
})

/** Inline apply so first paint matches saved prefs (theme table from @/lib/c64-settings). */
const C64_INLINE_INIT = `
(function(){
  var TABLE=${C64_INLINE_THEME_VARS_JSON};
  var el=document.getElementById('c64-site-root');
  if(!el)return;
  var c64Def={accent:'classic',scanlines:true,boot:'session'};
  var c64=c64Def;
  var storedMode='system';
  try{
    var p=null;
    var r=localStorage.getItem('site-c64-settings');
    if(r){p=JSON.parse(r);c64=Object.assign({},c64Def,p);}
    var a=localStorage.getItem('site-app-settings');
    if(a){
      var ap=JSON.parse(a);
      if(ap.colorMode==='light'||ap.colorMode==='dark'||ap.colorMode==='system')storedMode=ap.colorMode;
    }else if(p&&p.screenTint==='dim')storedMode='dark';
    else if(p&&p.screenTint==='bright')storedMode='light';
  }catch(e){}
  function resolveMode(m){
    if(m==='dark'||m==='light')return m;
    try{
      if(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches)return 'dark';
    }catch(e){}
    return 'light';
  }
  var colorMode=resolveMode(storedMode);
  if(c64.accent==='cyan'||c64.accent==='lightblue')c64.accent='classic';
  var accent=c64.accent in TABLE?c64.accent:'classic';
  var tint=colorMode==='dark'?'dim':'bright';
  var vars=TABLE[accent][tint];
  for(var k in vars){if(Object.prototype.hasOwnProperty.call(vars,k))el.style.setProperty(k,vars[k]);}
  el.style.setProperty('--c64-text-scale','1.05');
  el.dataset.c64Boot=c64.boot||'session';
  el.dataset.chromeTheme=colorMode;
  try{
    if(sessionStorage.getItem('c64-session-entry-path')==null){
      sessionStorage.setItem('c64-session-entry-path',location.pathname||'/');
    }
  }catch(e){}
})();
`

export default function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      {/* Start WOFF2 before first paint so @font-face doesn’t briefly use ui-monospace (swap flash). */}
      <link
        rel="preload"
        href="/fonts/C64_Pro_Mono-STYLE.woff2"
        as="font"
        type="font/woff2"
        crossOrigin="anonymous"
      />
    <div
      id="c64-site-root"
      className={`c64-site ${vt323.variable} ${c64ProMono.variable} min-h-svh w-full min-w-0`}
      suppressHydrationWarning
    >
      <script dangerouslySetInnerHTML={{ __html: C64_INLINE_INIT }} />
      <C64SettingsApplier />
      {children}
    </div>
    </>
  )
}
