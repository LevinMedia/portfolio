import { VT323 } from 'next/font/google'
import C64SettingsApplier from '@/app/components/C64SettingsApplier'
import { C64_INLINE_THEME_VARS_JSON } from '@/lib/c64-settings'

const vt323 = VT323({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-vt323',
})

/** Inline apply so first paint matches saved prefs (theme table from @/lib/c64-settings). */
const C64_INLINE_INIT = `
(function(){
  var TABLE=${C64_INLINE_THEME_VARS_JSON};
  var el=document.getElementById('c64-site-root');
  if(!el)return;
  var def={accent:'classic',screenTint:'default',scanlines:false,boot:'session'};
  var s=def;
  try{var r=localStorage.getItem('site-c64-settings');if(r)s=Object.assign({},def,JSON.parse(r));}catch(e){}
  if(s.accent==='cyan'||s.accent==='lightblue')s.accent='classic';
  var accent=s.accent in TABLE?s.accent:'classic';
  var tint=s.screenTint in TABLE[accent]?s.screenTint:'default';
  var vars=TABLE[accent][tint];
  for(var k in vars){if(Object.prototype.hasOwnProperty.call(vars,k))el.style.setProperty(k,vars[k]);}
  el.style.setProperty('--c64-text-scale','1.05');
  el.dataset.c64Scanlines=s.scanlines?'on':'off';
  el.dataset.c64Boot=s.boot||'session';
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
      className={`c64-site ${vt323.variable} min-h-svh w-full min-w-0`}
      suppressHydrationWarning
    >
      <script dangerouslySetInnerHTML={{ __html: C64_INLINE_INIT }} />
      <C64SettingsApplier />
      {children}
    </div>
    </>
  )
}
