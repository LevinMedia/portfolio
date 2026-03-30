'use client'

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { useSearchParams } from 'next/navigation'
import type { ClipboardEvent, KeyboardEvent, ReactNode, RefObject } from 'react'
import {
  C64_HOME_BOOT_LINES_SESSION_KEY,
  C64_SESSION_ENTRY_PATH_KEY,
  loadC64Settings,
} from '@/lib/c64-settings'
import type { BasicOutputOp } from '@/lib/c64-basic'
import {
  createBasicProgram,
  formatProgramLineEcho,
  isDirectList,
  isDirectNew,
  isDirectRun,
  listProgram,
  normalizeInputLine,
  resetDirectEvalContext,
  runBasicProgram,
  storeProgramLine,
  tryDirectGoto,
  tryDirectPrint,
  tryParseProgramLine,
} from '@/lib/c64-basic'

function applyBasicOutputOps(
  ops: BasicOutputOp[],
  appendRows: (texts: string[]) => void,
): void {
  let buf = ''
  for (const op of ops) {
    if (op.op === 'append') {
      buf += op.text
    } else if (op.op === 'newline') {
      appendRows([buf])
      buf = ''
    } else if (op.op === 'lines') {
      if (buf.length > 0) {
        appendRows([buf])
        buf = ''
      }
      appendRows(op.texts)
    }
  }
  if (buf.length > 0) {
    appendRows([buf])
  }
}

/**
 * Home-only layout: classic C64 CRT (no site nav, no howdy).
 * Style64 C64 Pro Mono — https://style64.org/c64-truetype
 */

/** Phones / touch tablets: skip programmatic focus on the ghost input (avoids keyboard + iOS zoom). */
function c64TouchPrimary(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(hover: none) and (pointer: coarse)').matches
  )
}

function focusC64TerminalInput(
  ref: RefObject<HTMLInputElement | null>,
  opts?: { force?: boolean },
): void {
  if (!opts?.force && c64TouchPrimary()) return
  ref.current?.focus({ preventScroll: true })
}

/** ROM splash (3) + spoofed disk directory sequence (7). */
const CENTER_STAGE_COUNT = 3
const DISK_SEQUENCE_LINES = [
  'READY.',
  'LOAD"$",8',
  '',
  'SEARCHING FOR $',
  'LOADING',
  'READY.',
  'LIST',
] as const
const BOOT_LINE_BANNER = '**** LEVINMEDIA 64 BASIC V2 ****'

/** ms after each ROM line before the next (banner → blank → RAM). */
const ROM_PAUSE_MS_AFTER_LINE: number[] = [220, 200, 360]

/** ms between each revealed character while typing disk lines (left → right). */
const DISK_TYPE_MS = 42

/** ms after an empty disk line before continuing. */
const DISK_BLANK_LINE_PAUSE_MS = 200

/** After “LOADING” is typed: square cursor becomes ASCII spinner; total hold = 12×125ms = 1500ms. */
const DISK_SPIN_FRAME_MS = 125
const DISK_SPIN_FRAME_COUNT = 12

const DISK_SPIN_CHARS = ['|', '/', '-', '\\'] as const

/**
 * ms after a disk line is fully typed (and spinner done, if any), before the next line starts.
 */
const DISK_PAUSE_AFTER_LINE_MS: number[] = [
  340,
  400,
  260,
  420,
  280,
  360,
  360,
]

const BOOT_LINE_RAM = '64K RAM SYSTEM  38911 BASIC BYTES FREE'

function renderCenterBoot(linesShown: number): ReactNode {
  const parts: ReactNode[] = []
  if (linesShown >= 1) {
    parts.push(BOOT_LINE_BANNER)
  }
  if (linesShown >= 2) {
    parts.push('\n')
  }
  if (linesShown >= 3) {
    parts.push('\n', BOOT_LINE_RAM)
  }
  return <>{parts}</>
}

export interface C64HomeCommandHandlers {
  onOpenAbout: () => void
  onOpenWorkHistory: () => void
  onOpenSelectedWorks: () => void
  onOpenFieldNotes: () => void
  onOpenStats: () => void
  onOpenGuestbook: () => void
  onOpenSiteSettings: () => void
}

/** Spoofed $ directory: blocks, 16-char style name, PRG; DEL separators like a real listing. */
type DirEntry =
  | { kind: 'prg'; blocks: number; name: string; action: keyof C64HomeCommandHandlers }
  | { kind: 'del' }

const DISK_VOLUME_LINE = '0 "LEVINMEDIA 64" 13 2A'

const DIRECTORY_ROWS: DirEntry[] = [
  { kind: 'prg', blocks: 14, name: 'ABOUT', action: 'onOpenAbout' },
  { kind: 'del' },
  { kind: 'prg', blocks: 52, name: 'WORK HISTORY', action: 'onOpenWorkHistory' },
  { kind: 'del' },
  { kind: 'prg', blocks: 102, name: 'FEATURED WORKS', action: 'onOpenSelectedWorks' },
  { kind: 'del' },
  { kind: 'prg', blocks: 66, name: 'FIELD NOTES', action: 'onOpenFieldNotes' },
  { kind: 'del' },
  { kind: 'prg', blocks: 8, name: 'STATS', action: 'onOpenStats' },
  { kind: 'del' },
  { kind: 'prg', blocks: 19, name: 'GUESTBOOK', action: 'onOpenGuestbook' },
  { kind: 'del' },
  { kind: 'prg', blocks: 24, name: 'SETTINGS', action: 'onOpenSiteSettings' },
]

const DIRECTORY_BLOCKS_USED = DIRECTORY_ROWS.reduce(
  (sum, row) => (row.kind === 'prg' ? sum + row.blocks : sum),
  0,
)
const DIRECTORY_DISK_BLOCKS = 400
const DIRECTORY_BLOCKS_FREE = Math.max(16, DIRECTORY_DISK_BLOCKS - DIRECTORY_BLOCKS_USED)

/** C64 BASIC-style load line shown in the prompt and “typed” when a PRG row is used. */
const LOAD_COMMAND_BY_ACTION: Record<keyof C64HomeCommandHandlers, string> = {
  onOpenAbout: 'LOAD "ABOUT",8,1',
  onOpenWorkHistory: 'LOAD "WORK HISTORY",8,1',
  onOpenSelectedWorks: 'LOAD "FEATURED WORKS",8,1',
  onOpenFieldNotes: 'LOAD "FIELD NOTES",8,1',
  onOpenStats: 'LOAD "STATS",8,1',
  onOpenGuestbook: 'LOAD "GUESTBOOK",8,1',
  onOpenSiteSettings: 'LOAD "SETTINGS",8,1',
}

const LOAD_LABEL_TO_ACTION: Record<string, keyof C64HomeCommandHandlers> = {
  ABOUT: 'onOpenAbout',
  'WORK HISTORY': 'onOpenWorkHistory',
  HISTORY: 'onOpenWorkHistory',
  'FEATURED WORKS': 'onOpenSelectedWorks',
  WORKS: 'onOpenSelectedWorks',
  'FIELD NOTES': 'onOpenFieldNotes',
  NOTES: 'onOpenFieldNotes',
  STATS: 'onOpenStats',
  GUESTBOOK: 'onOpenGuestbook',
  SETTINGS: 'onOpenSiteSettings',
}

/** LOAD "$",8 / LOAD"$",8 — read $ directory (no ,1). Case-insensitive. */
function isLoadDiskCatalogCommand(line: string): boolean {
  const t = line.replace(/\r/g, '').trim()
  return /^\s*LOAD\s*"\$"\s*,\s*8\s*$/i.test(t)
}

/** CRT scrollback line, or an embedded clickable disk catalog (LIST with no BASIC program). */
export type C64TerminalHistoryRow =
  | { id: number; kind: 'text'; text: string }
  | { id: number; kind: 'disk-catalog' }

function c64TextRow(id: number, text: string): C64TerminalHistoryRow {
  return { id, kind: 'text', text }
}

/** Same rows as the main directory block, rendered inside the terminal log after LIST. */
function TerminalDiskCatalogEmbed({
  blockId,
  onPlayLoad,
  onProgramKeyDown,
}: {
  blockId: number
  onPlayLoad: (action: keyof C64HomeCommandHandlers) => void
  onProgramKeyDown: (e: KeyboardEvent<HTMLButtonElement>) => void
}) {
  return (
    <div
      className="c64-terminal-disk-catalog m-0 my-2 w-full max-w-full"
      role="region"
      aria-label="Disk directory from LIST"
    >
      <div className="c64-dir-header text-xs sm:text-base md:text-lg leading-tight tracking-wide py-1.5 rounded-sm w-fit max-w-full">
        {DISK_VOLUME_LINE}
      </div>
      <nav
        className="c64-dir-table text-xs sm:text-base md:text-lg leading-tight tracking-wide mt-1 w-max max-w-full"
        aria-label="Disk programs from LIST"
      >
        {DIRECTORY_ROWS.map((row, i) =>
          row.kind === 'del' ? (
            <div
              key={`tc-${blockId}-del-${i}`}
              className="c64-dir-row c64-dir-row--static text-[var(--c64-crt-ink-dim)]"
            >
              <span className="c64-dir-blocks tabular-nums">0</span>
              <span className="c64-dir-name min-w-0 truncate">
                &quot;----------------&quot;
              </span>
              <span className="c64-dir-type">DEL</span>
            </div>
          ) : (
            <button
              key={`tc-${blockId}-${row.action}`}
              type="button"
              onClick={() => onPlayLoad(row.action)}
              onKeyDown={onProgramKeyDown}
              className="c64-dir-row c64-dir-row--prg w-full text-left border-0 rounded-none"
              aria-label={`Load ${LOAD_COMMAND_BY_ACTION[row.action]} and open ${row.name}`}
            >
              <span className="c64-dir-blocks tabular-nums">{row.blocks}</span>
              <span className="c64-dir-name min-w-0 truncate">
                &quot;{row.name}&quot;
              </span>
              <span className="c64-dir-type">PRG</span>
            </button>
          ),
        )}
      </nav>
      <div className="c64-dir-footer text-xs sm:text-base md:text-lg leading-tight tracking-wide mt-3 text-[var(--c64-crt-ink)]">
        <p className="m-0">{DIRECTORY_BLOCKS_FREE} BLOCKS FREE.</p>
      </div>
    </div>
  )
}

const LOAD_TYPEWRITER_MS = 42
const LOAD_AFTER_TYPED_PAUSE_MS = 140

/** Terminal load sequence after a valid LOAD line (matches C64 disk behavior). */
const TERMINAL_LOAD_BLANK_PAUSE_MS = 200
const TERMINAL_LOAD_AFTER_BLANK_MS = 280
const TERMINAL_LOAD_AFTER_SEARCHING_MS = 380
/** Same cadence as boot disk LOADING spinner (12×125ms ≈ 1.5s). */
const TERMINAL_LOAD_SPIN_FRAME_MS = DISK_SPIN_FRAME_MS
const TERMINAL_LOAD_SPIN_FRAME_COUNT = DISK_SPIN_FRAME_COUNT
const TERMINAL_LOAD_SPIN_CHARS = DISK_SPIN_CHARS
/** After READY. on click path: brief beat before RUN + open. */
const TERMINAL_AUTO_RUN_PAUSE_MS = 120

function isAnySiteDrawerOpen(searchParams: ReturnType<typeof useSearchParams>): boolean {
  return (
    searchParams.get('about') === 'true' ||
    searchParams.get('work-history') === 'true' ||
    searchParams.get('selected-works') === 'true' ||
    searchParams.get('field-notes') === 'true' ||
    searchParams.get('guestbook') === 'true' ||
    searchParams.get('stats') === 'true' ||
    searchParams.get('site-settings') === 'true'
  )
}

type C64AuthenticHomeScreenProps = C64HomeCommandHandlers

export default function C64AuthenticHomeScreen({
  onOpenAbout,
  onOpenWorkHistory,
  onOpenSelectedWorks,
  onOpenFieldNotes,
  onOpenStats,
  onOpenGuestbook,
  onOpenSiteSettings,
}: C64AuthenticHomeScreenProps) {
  const searchParams = useSearchParams()
  const drawerOpen = isAnySiteDrawerOpen(searchParams)
  const wasDrawerOpenRef = useRef(false)

  const [linesShown, setLinesShown] = useState(0)
  /** Full lines already printed in the disk block (typewriter finished per line). */
  const [diskCompletedLines, setDiskCompletedLines] = useState<string[]>([])
  /** Current disk line being typed; `count` = visible characters (0…length). */
  const [diskTyping, setDiskTyping] = useState<{ line: string; count: number } | null>(null)
  /** During LOADING: replaces block cursor with cycling ASCII spinner (null = use cursor). */
  const [diskSpinnerGlyph, setDiskSpinnerGlyph] = useState<string | null>(null)
  const [bootComplete, setBootComplete] = useState(false)

  /** Lines committed with Enter below READY. (typed text stays visible). */
  const [terminalHistory, setTerminalHistory] = useState<C64TerminalHistoryRow[]>([])
  const [terminalLine, setTerminalLine] = useState('')
  /** Caret index in `terminalLine` (0…length); mirrored to ghost input when editable. */
  const [terminalCaretPos, setTerminalCaretPos] = useState(0)
  const [terminalAutoTyping, setTerminalAutoTyping] = useState(false)
  /** True while blank → SEARCHING → LOADING spinner; input locked. */
  const [terminalSequenceBusy, setTerminalSequenceBusy] = useState(false)
  /** After manual load reaches READY.; cleared on RUN or new LOAD. */
  const [terminalPendingRun, setTerminalPendingRun] = useState<{
    action: keyof C64HomeCommandHandlers
  } | null>(null)
  const [terminalLoadingLineId, setTerminalLoadingLineId] = useState<number | null>(
    null,
  )
  const [terminalLoadingGlyph, setTerminalLoadingGlyph] = useState<string | null>(
    null,
  )
  const [basicRunning, setBasicRunning] = useState(false)
  const basicRunningRef = useRef(false)
  /** Show on-screen [STOP] only on phones / coarse-pointer tablets (desktop uses Escape). */
  const [basicStopTouchUi, setBasicStopTouchUi] = useState(false)
  const basicProgramRef = useRef(createBasicProgram())
  /** C64-style: directory load overwrites BASIC program RAM (no NEW line). */
  const wipeBasicProgramMemory = () => {
    basicProgramRef.current = createBasicProgram()
    resetDirectEvalContext()
  }
  /** After manual LOAD "$",8 finishes, LIST prints the disk catalog in the terminal log. */
  const [diskCatalogReady, setDiskCatalogReady] = useState(false)
  const basicAbortRef = useRef<AbortController | null>(null)
  /** One terminal row that grows while PRINT uses `;` (no newline yet). */
  const basicLivePrintRowIdRef = useRef<number | null>(null)
  const basicPrintRafRef = useRef<number | null>(null)
  /** Latest “replay LIST after drawer” impl (ref so drawer timeout always calls current). */
  const playDiskListReplayRef = useRef<() => void>(() => {})
  const terminalLineIdRef = useRef(0)
  const terminalTypewriterRunIdRef = useRef(0)
  const terminalTypewriterTimeoutRef = useRef<number | undefined>(undefined)
  const terminalAutoTypingRef = useRef(false)
  const terminalSequenceBusyRef = useRef(false)
  const terminalLoadRunIdRef = useRef(0)
  const terminalLoadTimeoutsRef = useRef<number[]>([])

  const scrollViewportRef = useRef<HTMLDivElement>(null)
  /** Scroll target when LIST shows the $ catalog (clickable rows live here, not in the log). */
  const diskListingRef = useRef<HTMLDivElement>(null)
  const terminalInputRef = useRef<HTMLInputElement>(null)
  /** Same behavior as Enter; used for multi-line paste into the ghost input. */
  const terminalSubmitRef = useRef<(next: string) => void>(() => {})
  const diskLogKey = diskCompletedLines.join('\n')
  const terminalScrollKey = `${terminalHistory.map((h) => (h.kind === 'text' ? h.text : '[disk]')).join('\n')}\n${terminalLine}\n${terminalLoadingGlyph ?? ''}\n${terminalSequenceBusy}\n${terminalPendingRun ? 'p' : ''}\n${basicRunning ? 'b' : ''}\n${diskCatalogReady ? 'c' : 'C'}`

  useLayoutEffect(() => {
    const el = scrollViewportRef.current
    if (!el) {
      return
    }
    el.scrollTop = Math.max(0, el.scrollHeight - el.clientHeight)
  }, [
    linesShown,
    bootComplete,
    diskLogKey,
    diskSpinnerGlyph,
    diskTyping?.line,
    diskTyping?.count,
    terminalScrollKey,
    terminalAutoTyping,
    terminalLoadingGlyph,
    terminalLoadingLineId,
  ])

  useEffect(() => {
    terminalAutoTypingRef.current = terminalAutoTyping
  }, [terminalAutoTyping])

  useEffect(() => {
    terminalSequenceBusyRef.current = terminalSequenceBusy
  }, [terminalSequenceBusy])

  useEffect(() => {
    basicRunningRef.current = basicRunning
  }, [basicRunning])

  const terminalInputBusy =
    terminalAutoTyping || terminalSequenceBusy || basicRunning
  /** Caret index for drawing the prompt (always end while input is read-only). */
  const terminalPromptCaretPos = terminalInputBusy
    ? terminalLine.length
    : Math.min(terminalCaretPos, terminalLine.length)

  const syncTerminalCaretFromInput = useCallback(
    (el: HTMLInputElement) => {
      if (terminalAutoTyping || terminalSequenceBusy || basicRunning) {
        return
      }
      const raw = el.selectionStart ?? 0
      const clamped = Math.min(Math.max(0, raw), el.value.length)
      setTerminalCaretPos(clamped)
    },
    [terminalAutoTyping, terminalSequenceBusy, basicRunning],
  )

  /** Keep ghost input selection and caret index aligned with the visible prompt (controlled input). */
  useLayoutEffect(() => {
    const el = terminalInputRef.current
    const len = terminalLine.length

    if (terminalInputBusy) {
      setTerminalCaretPos(len)
      if (el && document.activeElement === el) {
        el.setSelectionRange(len, len)
      }
      return
    }

    const c = Math.min(terminalCaretPos, len)
    if (c !== terminalCaretPos) {
      setTerminalCaretPos(c)
    }
    if (el && document.activeElement === el) {
      el.setSelectionRange(c, c)
    }
  }, [
    terminalLine,
    terminalCaretPos,
    terminalInputBusy,
  ])

  useEffect(() => {
    const mq = window.matchMedia('(hover: none) and (pointer: coarse)')
    const sync = () => setBasicStopTouchUi(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    if (!bootComplete) {
      return
    }
    const id = window.setTimeout(() => {
      focusC64TerminalInput(terminalInputRef)
    }, 80)
    return () => window.clearTimeout(id)
  }, [bootComplete])

  /**
   * When a site drawer closes, replay loading the disk catalog (LOAD"$",8 → SEARCHING → LOADING →
   * READY.) then LIST + clickable directory embed + READY. Skip if terminal is busy or BASIC runs.
   */
  useEffect(() => {
    if (!bootComplete) {
      return
    }
    const wasOpen = wasDrawerOpenRef.current
    wasDrawerOpenRef.current = drawerOpen
    if (wasOpen && !drawerOpen) {
      const id = window.setTimeout(() => {
        if (terminalAutoTypingRef.current || terminalSequenceBusyRef.current) {
          window.requestAnimationFrame(() => {
            focusC64TerminalInput(terminalInputRef)
          })
          return
        }
        if (basicRunningRef.current) {
          window.requestAnimationFrame(() => {
            focusC64TerminalInput(terminalInputRef)
          })
          return
        }
        playDiskListReplayRef.current()
      }, 200)
      return () => window.clearTimeout(id)
    }
    return undefined
  }, [bootComplete, drawerOpen])

  useEffect(() => {
    return () => {
      if (basicPrintRafRef.current !== null) {
        cancelAnimationFrame(basicPrintRafRef.current)
        basicPrintRafRef.current = null
      }
      basicLivePrintRowIdRef.current = null
      basicAbortRef.current?.abort()
      terminalTypewriterRunIdRef.current += 1
      if (terminalTypewriterTimeoutRef.current !== undefined) {
        window.clearTimeout(terminalTypewriterTimeoutRef.current)
      }
      terminalLoadRunIdRef.current += 1
      for (const tid of terminalLoadTimeoutsRef.current) {
        window.clearTimeout(tid)
      }
      terminalLoadTimeoutsRef.current = []
    }
  }, [])

  /**
   * Escape: abort BASIC when running; otherwise clear disk-catalog LIST readiness so you can retype
   * LOAD "$",8 then LIST (drawer keeps Escape for closing panels).
   */
  useEffect(() => {
    if (drawerOpen) {
      return undefined
    }
    const onKeyDown = (ev: globalThis.KeyboardEvent) => {
      if (ev.key !== 'Escape') {
        return
      }
      if (basicRunning) {
        ev.preventDefault()
        basicAbortRef.current?.abort()
        return
      }
      if (terminalSequenceBusyRef.current || terminalAutoTypingRef.current) {
        return
      }
      setDiskCatalogReady(false)
    }
    document.addEventListener('keydown', onKeyDown, true)
    return () => document.removeEventListener('keydown', onKeyDown, true)
  }, [basicRunning, drawerOpen])

  const handlers: Record<keyof C64HomeCommandHandlers, () => void> = {
    onOpenAbout,
    onOpenWorkHistory,
    onOpenSelectedWorks,
    onOpenFieldNotes,
    onOpenStats,
    onOpenGuestbook,
    onOpenSiteSettings,
  }
  const handlersRef = useRef(handlers)
  handlersRef.current = handlers

  /** If the line matches `LOAD "NAME",8,1` with a known name, returns that action. */
  const getTypedLoadAction = (
    line: string,
  ): keyof C64HomeCommandHandlers | null => {
    const t = line.replace(/\r/g, '').trim()
    const m = /^\s*LOAD\s+"([^"]+)"\s*,\s*8\s*,\s*1\s*$/i.exec(t)
    if (!m) {
      return null
    }
    return LOAD_LABEL_TO_ACTION[m[1].toUpperCase().trim()] ?? null
  }

  const clearTerminalLoadTimeoutsOnly = () => {
    for (const tid of terminalLoadTimeoutsRef.current) {
      window.clearTimeout(tid)
    }
    terminalLoadTimeoutsRef.current = []
  }

  const searchLabelFromLoadCommand = (cmd: string) => {
    const m = /LOAD\s+"([^"]+)"/i.exec(cmd)
    return (m?.[1] ?? '').toUpperCase()
  }

  const appendTerminalTexts = (texts: string[]) => {
    if (texts.length === 0) {
      return
    }
    setTerminalHistory((prev) => {
      const out = [...prev.slice(-199)]
      for (const text of texts) {
        terminalLineIdRef.current += 1
        out.push(c64TextRow(terminalLineIdRef.current, text))
      }
      return out
    })
  }

  /** Blank row after READY. in the log (separates command blocks). */
  const appendReadyWithGap = () => {
    appendTerminalTexts(['READY.', ''])
  }

  const appendTerminalDiskCatalogEmbed = () => {
    setTerminalHistory((prev) => {
      const out = [...prev.slice(-199)]
      terminalLineIdRef.current += 1
      out.push({ id: terminalLineIdRef.current, kind: 'disk-catalog' })
      return out
    })
  }

  /**
   * LIST: BASIC program lines in the log if any; else LIST + clickable disk catalog embed + READY.
   */
  const handleDirectListCommand = () => {
    if (basicProgramRef.current.size > 0) {
      appendTerminalTexts([
        'LIST',
        ...listProgram(basicProgramRef.current),
        'READY.',
        '',
      ])
      return
    }
    appendTerminalTexts(['LIST'])
    appendTerminalDiskCatalogEmbed()
    appendTerminalTexts(['READY.', ''])
    if (diskCatalogReady) {
      setDiskCatalogReady(false)
    }
  }

  const startBasicRun = (entryLine?: number) => {
    const ac = new AbortController()
    basicAbortRef.current = ac
    basicLivePrintRowIdRef.current = null
    setBasicRunning(true)
    void (async () => {
      let printBuf = ''

      const pumpPrintToTerminal = () => {
        basicPrintRafRef.current = null
        if (printBuf.length === 0) return
        const text = printBuf
        const liveId = basicLivePrintRowIdRef.current
        if (liveId === null) {
          terminalLineIdRef.current += 1
          const id = terminalLineIdRef.current
          basicLivePrintRowIdRef.current = id
          setTerminalHistory((prev) => [...prev.slice(-199), c64TextRow(id, text)])
        } else {
          setTerminalHistory((prev) =>
            prev.map((row) =>
              row.id === liveId && row.kind === 'text'
                ? c64TextRow(row.id, text)
                : row,
            ),
          )
        }
      }

      const schedulePump = () => {
        if (basicPrintRafRef.current !== null) return
        basicPrintRafRef.current = requestAnimationFrame(() => {
          pumpPrintToTerminal()
        })
      }

      const cancelPumpRaf = () => {
        if (basicPrintRafRef.current !== null) {
          cancelAnimationFrame(basicPrintRafRef.current)
          basicPrintRafRef.current = null
        }
      }

      const flushPrintSync = () => {
        cancelPumpRaf()
        pumpPrintToTerminal()
      }

      ac.signal.addEventListener('abort', flushPrintSync)

      const onOutput = (op: BasicOutputOp) => {
        if (op.op === 'append') {
          printBuf += op.text
          schedulePump()
        } else if (op.op === 'newline') {
          flushPrintSync()
          printBuf = ''
          basicLivePrintRowIdRef.current = null
        } else if (op.op === 'lines') {
          flushPrintSync()
          printBuf = ''
          basicLivePrintRowIdRef.current = null
          appendTerminalTexts(op.texts)
        }
      }
      try {
        await runBasicProgram(basicProgramRef.current, {
          entryLine,
          signal: ac.signal,
          onOutput,
        })
      } finally {
        ac.signal.removeEventListener('abort', flushPrintSync)
        flushPrintSync()
        printBuf = ''
        basicLivePrintRowIdRef.current = null
        if (basicAbortRef.current === ac) {
          basicAbortRef.current = null
        }
        setBasicRunning(false)
        appendReadyWithGap()
        window.requestAnimationFrame(() => {
          focusC64TerminalInput(terminalInputRef)
        })
      }
    })()
  }

  const handleDirectoryProgramKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (
      e.key !== 'ArrowDown' &&
      e.key !== 'ArrowUp' &&
      e.key !== 'Home' &&
      e.key !== 'End'
    ) {
      return
    }
    const nav = e.currentTarget.closest('.c64-dir-table')
    if (!nav) {
      return
    }
    const buttons = [
      ...nav.querySelectorAll<HTMLButtonElement>('.c64-dir-row--prg'),
    ]
    if (buttons.length === 0) {
      return
    }
    const i = buttons.indexOf(e.currentTarget)
    if (i < 0) {
      return
    }
    e.preventDefault()
    let nextIndex = i
    if (e.key === 'ArrowDown') {
      nextIndex = Math.min(i + 1, buttons.length - 1)
    } else if (e.key === 'ArrowUp') {
      nextIndex = Math.max(i - 1, 0)
    } else if (e.key === 'Home') {
      nextIndex = 0
    } else {
      nextIndex = buttons.length - 1
    }
    const next = buttons[nextIndex]
    if (!next || next === e.currentTarget) {
      return
    }
    next.focus()
    next.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }

  /**
   * After the LOAD line is already in history: blank line, SEARCHING FOR, LOADING + spinner, READY.
   * Manual: leave pending RUN. Click: append RUN and open after a short pause.
   */
  const startTerminalLoadSequence = (
    action: keyof C64HomeCommandHandlers,
    source: 'manual' | 'click',
    searchLabel: string,
  ) => {
    setDiskCatalogReady(false)
    clearTerminalLoadTimeoutsOnly()
    terminalLoadRunIdRef.current += 1
    const runId = terminalLoadRunIdRef.current
    setTerminalPendingRun(null)
    setTerminalLoadingLineId(null)
    setTerminalLoadingGlyph(null)

    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const appendRows = (texts: string[]) => {
      const rows: C64TerminalHistoryRow[] = []
      for (const text of texts) {
        terminalLineIdRef.current += 1
        rows.push(c64TextRow(terminalLineIdRef.current, text))
      }
      setTerminalHistory((prev) => [...prev.slice(-199), ...rows])
    }

    if (reduced) {
      const texts = [
        '',
        `SEARCHING FOR ${searchLabel}`,
        'LOADING',
        'READY.',
        '',
        ...(source === 'click' ? (['RUN'] as const) : []),
      ]
      appendRows([...texts])
      setTerminalSequenceBusy(false)
      if (source === 'click') {
        handlersRef.current[action]()
      } else {
        setTerminalPendingRun({ action })
      }
      return
    }

    setTerminalSequenceBusy(true)

    const schedule = (fn: () => void, ms: number) => {
      const tid = window.setTimeout(() => {
        if (terminalLoadRunIdRef.current !== runId) {
          return
        }
        fn()
      }, ms) as unknown as number
      terminalLoadTimeoutsRef.current.push(tid)
    }

    const tBlank = TERMINAL_LOAD_BLANK_PAUSE_MS
    const tSearch = tBlank + TERMINAL_LOAD_AFTER_BLANK_MS
    const tLoading = tSearch + TERMINAL_LOAD_AFTER_SEARCHING_MS

    schedule(() => {
      appendRows([''])
    }, tBlank)

    schedule(() => {
      appendRows([`SEARCHING FOR ${searchLabel}`])
    }, tSearch)

    schedule(() => {
      terminalLineIdRef.current += 1
      const loadingId = terminalLineIdRef.current
      setTerminalHistory((prev) => [
        ...prev.slice(-199),
        c64TextRow(loadingId, 'LOADING'),
      ])
      setTerminalLoadingLineId(loadingId)

      const runSpinFrame = (frame: number) => {
        if (terminalLoadRunIdRef.current !== runId) {
          return
        }
        setTerminalLoadingGlyph(
          TERMINAL_LOAD_SPIN_CHARS[frame % TERMINAL_LOAD_SPIN_CHARS.length],
        )
        if (frame + 1 < TERMINAL_LOAD_SPIN_FRAME_COUNT) {
          schedule(() => runSpinFrame(frame + 1), TERMINAL_LOAD_SPIN_FRAME_MS)
        } else {
          setTerminalLoadingGlyph(null)
          setTerminalLoadingLineId(null)
          terminalLineIdRef.current += 1
          const readyId = terminalLineIdRef.current
          terminalLineIdRef.current += 1
          const readyGapId = terminalLineIdRef.current
          setTerminalHistory((prev) => [
            ...prev.slice(-199),
            c64TextRow(readyId, 'READY.'),
            c64TextRow(readyGapId, ''),
          ])
          setTerminalSequenceBusy(false)
          if (source === 'click') {
            schedule(() => {
              if (terminalLoadRunIdRef.current !== runId) {
                return
              }
              terminalLineIdRef.current += 1
              const runRowId = terminalLineIdRef.current
              setTerminalHistory((prev) => [
                ...prev.slice(-199),
                c64TextRow(runRowId, 'RUN'),
              ])
              handlersRef.current[action]()
            }, TERMINAL_AUTO_RUN_PAUSE_MS)
          } else {
            setTerminalPendingRun({ action })
          }
        }
      }
      runSpinFrame(0)
    }, tLoading)
  }

  type DiskCatalogSequenceOpts = {
    /** Log LOAD"$",8 before blank (closing a drawer — full disk reload). */
    logSyntheticLoadLine?: boolean
    /** After READY.: append LIST + clickable embed + READY. instead of $-catalog readiness only. */
    endWithListEmbed?: boolean
    /** Called after sequence fully finishes (reduced or animated). */
    onComplete?: () => void
  }

  /** LOAD "$",8: same cadence as a PRG load; optional drawer replay then auto-LIST + embed. */
  const startTerminalDiskCatalogSequence = (opts?: DiskCatalogSequenceOpts) => {
    setDiskCatalogReady(false)
    clearTerminalLoadTimeoutsOnly()
    terminalLoadRunIdRef.current += 1
    const runId = terminalLoadRunIdRef.current
    setTerminalPendingRun(null)
    setTerminalLoadingLineId(null)
    setTerminalLoadingGlyph(null)

    if (opts?.logSyntheticLoadLine) {
      appendTerminalTexts([DISK_SEQUENCE_LINES[1]])
    }

    const finishListEmbed = () => {
      appendTerminalTexts(['LIST'])
      appendTerminalDiskCatalogEmbed()
      appendTerminalTexts(['READY.', ''])
      opts?.onComplete?.()
    }

    const finishCatalogReadyOnly = () => {
      setDiskCatalogReady(true)
      opts?.onComplete?.()
    }

    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const appendRows = (texts: string[]) => {
      const rows: C64TerminalHistoryRow[] = []
      for (const text of texts) {
        terminalLineIdRef.current += 1
        rows.push(c64TextRow(terminalLineIdRef.current, text))
      }
      setTerminalHistory((prev) => [...prev.slice(-199), ...rows])
    }

    if (reduced) {
      appendRows(['', 'SEARCHING FOR $', 'LOADING', 'READY.', ''])
      setTerminalSequenceBusy(false)
      if (opts?.endWithListEmbed) {
        finishListEmbed()
      } else {
        finishCatalogReadyOnly()
      }
      return
    }

    setTerminalSequenceBusy(true)

    const schedule = (fn: () => void, ms: number) => {
      const tid = window.setTimeout(() => {
        if (terminalLoadRunIdRef.current !== runId) {
          return
        }
        fn()
      }, ms) as unknown as number
      terminalLoadTimeoutsRef.current.push(tid)
    }

    const tBlank = TERMINAL_LOAD_BLANK_PAUSE_MS
    const tSearch = tBlank + TERMINAL_LOAD_AFTER_BLANK_MS
    const tLoading = tSearch + TERMINAL_LOAD_AFTER_SEARCHING_MS

    schedule(() => {
      appendRows([''])
    }, tBlank)

    schedule(() => {
      appendRows(['SEARCHING FOR $'])
    }, tSearch)

    schedule(() => {
      terminalLineIdRef.current += 1
      const loadingId = terminalLineIdRef.current
      setTerminalHistory((prev) => [
        ...prev.slice(-199),
        c64TextRow(loadingId, 'LOADING'),
      ])
      setTerminalLoadingLineId(loadingId)

      const runSpinFrame = (frame: number) => {
        if (terminalLoadRunIdRef.current !== runId) {
          return
        }
        setTerminalLoadingGlyph(
          TERMINAL_LOAD_SPIN_CHARS[frame % TERMINAL_LOAD_SPIN_CHARS.length],
        )
        if (frame + 1 < TERMINAL_LOAD_SPIN_FRAME_COUNT) {
          schedule(() => runSpinFrame(frame + 1), TERMINAL_LOAD_SPIN_FRAME_MS)
        } else {
          setTerminalLoadingGlyph(null)
          setTerminalLoadingLineId(null)
          terminalLineIdRef.current += 1
          const readyId = terminalLineIdRef.current
          terminalLineIdRef.current += 1
          const readyGapId = terminalLineIdRef.current
          setTerminalHistory((prev) => [
            ...prev.slice(-199),
            c64TextRow(readyId, 'READY.'),
            c64TextRow(readyGapId, ''),
          ])
          setTerminalSequenceBusy(false)
          if (opts?.endWithListEmbed) {
            finishListEmbed()
          } else {
            finishCatalogReadyOnly()
          }
        }
      }
      runSpinFrame(0)
    }, tLoading)
  }

  playDiskListReplayRef.current = () => {
    if (!bootComplete) {
      return
    }
    if (terminalTypewriterTimeoutRef.current !== undefined) {
      window.clearTimeout(terminalTypewriterTimeoutRef.current)
    }
    terminalTypewriterRunIdRef.current += 1
    setTerminalLine('')
    setTerminalAutoTyping(false)
    startTerminalDiskCatalogSequence({
      logSyntheticLoadLine: true,
      endWithListEmbed: true,
      onComplete: () => {
        window.requestAnimationFrame(() => {
          focusC64TerminalInput(terminalInputRef, { force: true })
        })
      },
    })
  }

  const playLoadCommandFromList = (action: keyof C64HomeCommandHandlers) => {
    const full = LOAD_COMMAND_BY_ACTION[action]
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    clearTerminalLoadTimeoutsOnly()
    terminalLoadRunIdRef.current += 1
    setTerminalPendingRun(null)
    setTerminalSequenceBusy(false)
    setTerminalLoadingLineId(null)
    setTerminalLoadingGlyph(null)

    if (reduced) {
      terminalLineIdRef.current += 1
      const id = terminalLineIdRef.current
      setTerminalHistory((prev) => [...prev.slice(-199), c64TextRow(id, full)])
      setTerminalLine('')
      startTerminalLoadSequence(
        action,
        'click',
        searchLabelFromLoadCommand(full),
      )
      window.requestAnimationFrame(() => focusC64TerminalInput(terminalInputRef))
      return
    }

    if (terminalTypewriterTimeoutRef.current !== undefined) {
      window.clearTimeout(terminalTypewriterTimeoutRef.current)
    }
    terminalTypewriterRunIdRef.current += 1
    const runId = terminalTypewriterRunIdRef.current

    setTerminalAutoTyping(true)
    setTerminalLine('')
    focusC64TerminalInput(terminalInputRef)

    const schedule = (fn: () => void, ms: number) => {
      terminalTypewriterTimeoutRef.current = window.setTimeout(fn, ms) as unknown as number
    }

    let pos = 0
    const step = () => {
      if (terminalTypewriterRunIdRef.current !== runId) {
        return
      }
      pos += 1
      setTerminalLine(full.slice(0, pos))
      if (pos < full.length) {
        schedule(step, LOAD_TYPEWRITER_MS)
      } else {
        schedule(() => {
          if (terminalTypewriterRunIdRef.current !== runId) {
            return
          }
          terminalLineIdRef.current += 1
          const id = terminalLineIdRef.current
          setTerminalHistory((prev) => [...prev.slice(-199), c64TextRow(id, full)])
          setTerminalLine('')
          setTerminalAutoTyping(false)
          startTerminalLoadSequence(
            action,
            'click',
            searchLabelFromLoadCommand(full),
          )
          window.requestAnimationFrame(() => focusC64TerminalInput(terminalInputRef))
        }, LOAD_AFTER_TYPED_PAUSE_MS)
      }
    }

    schedule(step, LOAD_TYPEWRITER_MS)
  }

  /**
   * First full load of the tab was not `/` → wait until no site drawer covers the CRT, then run boot
   * once so the sequence is visible the first time they reach a clear home.
   */
  const sessionEntryWasNotHomeRef = useRef<boolean | null>(null)
  useLayoutEffect(() => {
    if (sessionEntryWasNotHomeRef.current !== null) {
      return
    }
    try {
      const p = sessionStorage.getItem(C64_SESSION_ENTRY_PATH_KEY) ?? '/'
      sessionEntryWasNotHomeRef.current = p !== '/' && p !== ''
    } catch {
      sessionEntryWasNotHomeRef.current = false
    }
  }, [])

  const authenticBootStartedRef = useRef(false)

  /** Landed on `/` first: boot immediately (may run under a query-param drawer). */
  useEffect(() => {
    if (sessionEntryWasNotHomeRef.current === true) {
      return undefined
    }
    if (authenticBootStartedRef.current) {
      return undefined
    }

    const settings = loadC64Settings()
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const skipToCompleteBoot = () => {
      setLinesShown(CENTER_STAGE_COUNT)
      setDiskCompletedLines([...DISK_SEQUENCE_LINES])
      setDiskTyping(null)
      setDiskSpinnerGlyph(null)
      setBootComplete(true)
    }

    if (settings.boot === 'off' || reduced) {
      authenticBootStartedRef.current = true
      skipToCompleteBoot()
      return undefined
    }

    if (settings.boot === 'session') {
      try {
        if (sessionStorage.getItem(C64_HOME_BOOT_LINES_SESSION_KEY)) {
          authenticBootStartedRef.current = true
          skipToCompleteBoot()
          return undefined
        }
      } catch {
        // ignore
      }
    }

    authenticBootStartedRef.current = true
    let bootFinishedLatch = false
    const timeouts: number[] = []
    let cancelled = false

    const after = (ms: number, fn: () => void) => {
      const id = window.setTimeout(() => {
        if (!cancelled) {
          fn()
        }
      }, ms) as unknown as number
      timeouts.push(id)
    }

    const finishBoot = () => {
      bootFinishedLatch = true
      if (settings.boot === 'session') {
        try {
          sessionStorage.setItem(C64_HOME_BOOT_LINES_SESSION_KEY, '1')
        } catch {
          // ignore
        }
      }
      setBootComplete(true)
    }

    /** Type one disk line left → right; then pause, then next line or finish. */
    const runDiskLine = (lineIndex: number) => {
      if (cancelled) {
        return
      }
      if (lineIndex >= DISK_SEQUENCE_LINES.length) {
        finishBoot()
        return
      }
      const text = DISK_SEQUENCE_LINES[lineIndex]
      if (text === '') {
        setDiskCompletedLines((prev) => [...prev, ''])
        after(DISK_BLANK_LINE_PAUSE_MS, () => runDiskLine(lineIndex + 1))
        return
      }

      let visible = 0
      setDiskTyping({ line: text, count: 0 })

      const typeStep = () => {
        if (cancelled) {
          return
        }
        visible += 1
        setDiskTyping({ line: text, count: visible })
        if (visible < text.length) {
          after(DISK_TYPE_MS, typeStep)
        } else {
          after(DISK_TYPE_MS, () => {
            if (cancelled) {
              return
            }
            if (text === 'LOADING') {
              const runSpinFrame = (frame: number) => {
                if (cancelled) {
                  return
                }
                setDiskTyping({ line: text, count: text.length })
                setDiskSpinnerGlyph(DISK_SPIN_CHARS[frame % DISK_SPIN_CHARS.length])
                if (frame + 1 < DISK_SPIN_FRAME_COUNT) {
                  after(DISK_SPIN_FRAME_MS, () => runSpinFrame(frame + 1))
                } else {
                  setDiskSpinnerGlyph(null)
                  setDiskCompletedLines((prev) => [...prev, text])
                  setDiskTyping(null)
                  const pauseAfter =
                    DISK_PAUSE_AFTER_LINE_MS[lineIndex] ?? 320
                  after(pauseAfter, () => runDiskLine(lineIndex + 1))
                }
              }
              runSpinFrame(0)
              return
            }
            setDiskCompletedLines((prev) => [...prev, text])
            setDiskTyping(null)
            const pauseAfter =
              DISK_PAUSE_AFTER_LINE_MS[lineIndex] ?? 320
            if (lineIndex < DISK_SEQUENCE_LINES.length - 1) {
              after(pauseAfter, () => runDiskLine(lineIndex + 1))
            } else {
              after(pauseAfter, finishBoot)
            }
          })
        }
      }

      after(DISK_TYPE_MS, typeStep)
    }

    setLinesShown(1)
    after(ROM_PAUSE_MS_AFTER_LINE[0] ?? 220, () => {
      setLinesShown(2)
      after(ROM_PAUSE_MS_AFTER_LINE[1] ?? 200, () => {
        setLinesShown(3)
        after(ROM_PAUSE_MS_AFTER_LINE[2] ?? 360, () => runDiskLine(0))
      })
    })

    return () => {
      cancelled = true
      for (const id of timeouts) {
        window.clearTimeout(id)
      }
      if (!bootFinishedLatch) {
        authenticBootStartedRef.current = false
      }
    }
  }, [])

  useEffect(() => {
    const notHomeFirst = sessionEntryWasNotHomeRef.current === true
    if (!notHomeFirst) {
      return undefined
    }
    if (authenticBootStartedRef.current) {
      return undefined
    }
    if (drawerOpen) {
      return undefined
    }

    const settings = loadC64Settings()
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const skipToCompleteBoot = () => {
      setLinesShown(CENTER_STAGE_COUNT)
      setDiskCompletedLines([...DISK_SEQUENCE_LINES])
      setDiskTyping(null)
      setDiskSpinnerGlyph(null)
      setBootComplete(true)
    }

    if (settings.boot === 'off' || reduced) {
      authenticBootStartedRef.current = true
      skipToCompleteBoot()
      return undefined
    }

    if (settings.boot === 'session') {
      try {
        if (sessionStorage.getItem(C64_HOME_BOOT_LINES_SESSION_KEY)) {
          authenticBootStartedRef.current = true
          skipToCompleteBoot()
          return undefined
        }
      } catch {
        // ignore
      }
    }

    authenticBootStartedRef.current = true
    let bootFinishedLatch = false

    const timeouts: number[] = []
    let cancelled = false

    const after = (ms: number, fn: () => void) => {
      const id = window.setTimeout(() => {
        if (!cancelled) {
          fn()
        }
      }, ms) as unknown as number
      timeouts.push(id)
    }

    const finishBoot = () => {
      bootFinishedLatch = true
      if (settings.boot === 'session') {
        try {
          sessionStorage.setItem(C64_HOME_BOOT_LINES_SESSION_KEY, '1')
        } catch {
          // ignore
        }
      }
      setBootComplete(true)
    }

    const runDiskLine = (lineIndex: number) => {
      if (cancelled) {
        return
      }
      if (lineIndex >= DISK_SEQUENCE_LINES.length) {
        finishBoot()
        return
      }
      const text = DISK_SEQUENCE_LINES[lineIndex]
      if (text === '') {
        setDiskCompletedLines((prev) => [...prev, ''])
        after(DISK_BLANK_LINE_PAUSE_MS, () => runDiskLine(lineIndex + 1))
        return
      }

      let visible = 0
      setDiskTyping({ line: text, count: 0 })

      const typeStep = () => {
        if (cancelled) {
          return
        }
        visible += 1
        setDiskTyping({ line: text, count: visible })
        if (visible < text.length) {
          after(DISK_TYPE_MS, typeStep)
        } else {
          after(DISK_TYPE_MS, () => {
            if (cancelled) {
              return
            }
            if (text === 'LOADING') {
              const runSpinFrame = (frame: number) => {
                if (cancelled) {
                  return
                }
                setDiskTyping({ line: text, count: text.length })
                setDiskSpinnerGlyph(DISK_SPIN_CHARS[frame % DISK_SPIN_CHARS.length])
                if (frame + 1 < DISK_SPIN_FRAME_COUNT) {
                  after(DISK_SPIN_FRAME_MS, () => runSpinFrame(frame + 1))
                } else {
                  setDiskSpinnerGlyph(null)
                  setDiskCompletedLines((prev) => [...prev, text])
                  setDiskTyping(null)
                  const pauseAfter =
                    DISK_PAUSE_AFTER_LINE_MS[lineIndex] ?? 320
                  after(pauseAfter, () => runDiskLine(lineIndex + 1))
                }
              }
              runSpinFrame(0)
              return
            }
            setDiskCompletedLines((prev) => [...prev, text])
            setDiskTyping(null)
            const pauseAfter =
              DISK_PAUSE_AFTER_LINE_MS[lineIndex] ?? 320
            if (lineIndex < DISK_SEQUENCE_LINES.length - 1) {
              after(pauseAfter, () => runDiskLine(lineIndex + 1))
            } else {
              after(pauseAfter, finishBoot)
            }
          })
        }
      }

      after(DISK_TYPE_MS, typeStep)
    }

    setLinesShown(1)
    after(ROM_PAUSE_MS_AFTER_LINE[0] ?? 220, () => {
      setLinesShown(2)
      after(ROM_PAUSE_MS_AFTER_LINE[1] ?? 200, () => {
        setLinesShown(3)
        after(ROM_PAUSE_MS_AFTER_LINE[2] ?? 360, () => runDiskLine(0))
      })
    })

    return () => {
      cancelled = true
      for (const id of timeouts) {
        window.clearTimeout(id)
      }
      if (!bootFinishedLatch) {
        authenticBootStartedRef.current = false
      }
    }
  }, [drawerOpen])

  terminalSubmitRef.current = (nextRaw: string) => {
    const next = nextRaw.replace(/\r/g, '').trim()
    if (next.length === 0) {
      setTerminalLine('')
      window.requestAnimationFrame(() => {
        focusC64TerminalInput(terminalInputRef)
      })
      return
    }

    if (terminalPendingRun) {
      if (/^RUN$/i.test(next)) {
        terminalLineIdRef.current += 1
        const runLineId = terminalLineIdRef.current
        const { action: pendingAction } = terminalPendingRun
        setTerminalPendingRun(null)
        setTerminalHistory((prev) => [
          ...prev.slice(-199),
          c64TextRow(runLineId, 'RUN'),
        ])
        handlers[pendingAction]()
      } else {
        const loadAction = getTypedLoadAction(next)
        if (loadAction !== null) {
          terminalLineIdRef.current += 1
          const lineId = terminalLineIdRef.current
          setTerminalPendingRun(null)
          setTerminalHistory((prev) => [
            ...prev.slice(-199),
            c64TextRow(lineId, next),
          ])
          setTerminalLine('')
          startTerminalLoadSequence(
            loadAction,
            'manual',
            searchLabelFromLoadCommand(
              LOAD_COMMAND_BY_ACTION[loadAction],
            ),
          )
          window.requestAnimationFrame(() => {
            focusC64TerminalInput(terminalInputRef)
          })
          return
        }
        if (isLoadDiskCatalogCommand(next)) {
          setTerminalPendingRun(null)
          wipeBasicProgramMemory()
          terminalLineIdRef.current += 1
          const catLineId = terminalLineIdRef.current
          setTerminalHistory((prev) => [
            ...prev.slice(-199),
            c64TextRow(catLineId, normalizeInputLine(next).toUpperCase()),
          ])
          setTerminalLine('')
          startTerminalDiskCatalogSequence()
          window.requestAnimationFrame(() => {
            focusC64TerminalInput(terminalInputRef)
          })
          return
        }
        const plPending = tryParseProgramLine(next)
        if (plPending !== null) {
          setTerminalPendingRun(null)
          storeProgramLine(
            basicProgramRef.current,
            plPending.lineNum,
            plPending.rest,
          )
          setDiskCatalogReady(false)
          const echo = formatProgramLineEcho(
            plPending.lineNum,
            plPending.rest,
          )
          appendTerminalTexts([echo])
        } else if (isDirectList(next)) {
          setTerminalPendingRun(null)
          handleDirectListCommand()
        } else if (isDirectNew(next)) {
          setTerminalPendingRun(null)
          basicProgramRef.current = createBasicProgram()
          resetDirectEvalContext()
          setDiskCatalogReady(false)
          appendTerminalTexts(['NEW', 'READY.', ''])
        } else {
          const gotoTargetPending = tryDirectGoto(next)
          const printDirectPending = tryDirectPrint(next)
          if (gotoTargetPending !== null) {
            setTerminalPendingRun(null)
            appendTerminalTexts([
              normalizeInputLine(next).toUpperCase(),
            ])
            setTerminalLine('')
            startBasicRun(gotoTargetPending)
            window.requestAnimationFrame(() => {
              focusC64TerminalInput(terminalInputRef)
            })
            return
          }
          if (printDirectPending.ok) {
            setTerminalPendingRun(null)
            appendTerminalTexts([
              normalizeInputLine(next).toUpperCase(),
            ])
            applyBasicOutputOps(
              printDirectPending.ops,
              appendTerminalTexts,
            )
            appendReadyWithGap()
          } else {
            terminalLineIdRef.current += 1
            const badLineId = terminalLineIdRef.current
            terminalLineIdRef.current += 1
            const errId = terminalLineIdRef.current
            setTerminalHistory((prev) => [
              ...prev.slice(-199),
              c64TextRow(badLineId, next),
              c64TextRow(errId, '?SYNTAX ERROR'),
            ])
          }
        }
      }
      setTerminalLine('')
      window.requestAnimationFrame(() => {
        focusC64TerminalInput(terminalInputRef)
      })
      return
    }

    if (isLoadDiskCatalogCommand(next)) {
      wipeBasicProgramMemory()
      terminalLineIdRef.current += 1
      const catLineId = terminalLineIdRef.current
      setTerminalHistory((prev) => [
        ...prev.slice(-199),
        c64TextRow(catLineId, normalizeInputLine(next).toUpperCase()),
      ])
      setTerminalLine('')
      startTerminalDiskCatalogSequence()
      window.requestAnimationFrame(() => {
        focusC64TerminalInput(terminalInputRef)
      })
      return
    }

    const pl = tryParseProgramLine(next)
    if (pl !== null) {
      storeProgramLine(basicProgramRef.current, pl.lineNum, pl.rest)
      setDiskCatalogReady(false)
      const echo = formatProgramLineEcho(pl.lineNum, pl.rest)
      appendTerminalTexts([echo])
      setTerminalLine('')
      window.requestAnimationFrame(() => {
        focusC64TerminalInput(terminalInputRef)
      })
      return
    }

    if (isDirectList(next)) {
      handleDirectListCommand()
      setTerminalLine('')
      window.requestAnimationFrame(() => {
        focusC64TerminalInput(terminalInputRef)
      })
      return
    }

    if (isDirectNew(next)) {
      basicProgramRef.current = createBasicProgram()
      resetDirectEvalContext()
      setDiskCatalogReady(false)
      appendTerminalTexts(['NEW', 'READY.', ''])
      setTerminalLine('')
      window.requestAnimationFrame(() => {
        focusC64TerminalInput(terminalInputRef)
      })
      return
    }

    if (isDirectRun(next)) {
      appendTerminalTexts(['RUN'])
      setTerminalLine('')
      startBasicRun()
      return
    }

    const gotoTarget = tryDirectGoto(next)
    if (gotoTarget !== null) {
      appendTerminalTexts([normalizeInputLine(next).toUpperCase()])
      setTerminalLine('')
      startBasicRun(gotoTarget)
      return
    }

    const printDirect = tryDirectPrint(next)
    if (printDirect.ok) {
      appendTerminalTexts([normalizeInputLine(next).toUpperCase()])
      applyBasicOutputOps(printDirect.ops, appendTerminalTexts)
      appendReadyWithGap()
      setTerminalLine('')
      window.requestAnimationFrame(() => {
        focusC64TerminalInput(terminalInputRef)
      })
      return
    }

    const action = getTypedLoadAction(next)
    terminalLineIdRef.current += 1
    const id = terminalLineIdRef.current
    const rows: C64TerminalHistoryRow[] = [c64TextRow(id, next)]
    if (action === null) {
      terminalLineIdRef.current += 1
      rows.push(c64TextRow(terminalLineIdRef.current, '?SYNTAX ERROR'))
      setTerminalHistory((prev) => [
        ...prev.slice(-199),
        ...rows,
      ])
    } else {
      setTerminalHistory((prev) => [
        ...prev.slice(-199),
        ...rows,
      ])
      startTerminalLoadSequence(
        action,
        'manual',
        searchLabelFromLoadCommand(
          LOAD_COMMAND_BY_ACTION[action],
        ),
      )
    }
    setTerminalLine('')
    window.requestAnimationFrame(() => {
      focusC64TerminalInput(terminalInputRef)
    })
  }

  const showDiskBlock =
    diskCompletedLines.length > 0 ||
    diskTyping !== null ||
    diskSpinnerGlyph !== null

  return (
    <div className="flex flex-1 flex-col w-full min-w-0 min-h-0">
      <div className="c64-authentic-screen w-full min-w-0 flex flex-1 min-h-0 flex-col overflow-hidden shadow-[inset_0_0_0_2px_rgba(0,0,0,0.35)]">
        <div
          ref={scrollViewportRef}
          className="c64-authentic-screen-scroll flex-1 min-h-0 min-w-0 overflow-x-hidden overflow-y-auto overscroll-contain py-4 sm:py-6 md:py-8 px-3 sm:px-5 md:px-6"
        >
          <div className="flex w-full flex-col items-start">
          <div className="text-center shrink-0 w-fit max-w-full mx-auto">
            <pre
              className="c64-authentic-boot whitespace-pre-wrap break-words m-0 text-xs sm:text-base md:text-lg leading-tight tracking-wide"
              aria-label="Startup messages"
            >
              {renderCenterBoot(linesShown)}
            </pre>
          </div>

          {showDiskBlock && (
            <pre className="c64-authentic-boot c64-authentic-text-fit whitespace-pre-wrap break-words m-0 mt-3 text-left text-xs sm:text-base md:text-lg leading-tight tracking-wide shrink-0 max-w-full">
              {diskCompletedLines.join('\n')}
              {diskTyping && (
                <>
                  {diskCompletedLines.length > 0 ? '\n' : null}
                  {diskTyping.line.slice(0, diskTyping.count)}
                  {diskSpinnerGlyph !== null ? (
                    <span
                      className="c64-disk-spin-char"
                      aria-hidden
                    >
                      {diskSpinnerGlyph}
                    </span>
                  ) : (
                    <span
                      className="c64-disk-type-cursor c64-authentic-cursor"
                      aria-hidden
                    />
                  )}
                </>
              )}
            </pre>
          )}

          {bootComplete && (
            <div className="c64-dir-listing mt-6 sm:mt-8 text-left shrink-0 min-w-0 max-w-full">
              <p className="sr-only" id="c64-disk-directory-hint">
                Disk directory: use the clickable program rows here, or type LOAD &quot;NAME&quot;,8,1
                and RUN. LIST with no BASIC program inserts the same clickable directory in the command
                log below. After LOAD &quot;$&quot;,8, LIST does that and clears $-catalog readiness.
                Close a site panel to replay LIST in the log. Tab into a list; arrow keys or Home and End;
                Enter to run.
              </p>

              <div className="c64-dir-listing-sticky">
                <div className="c64-dir-header text-xs sm:text-base md:text-lg leading-tight tracking-wide py-1.5 rounded-sm">
                  {DISK_VOLUME_LINE}
                </div>

                <nav
                  className="c64-dir-table text-xs sm:text-base md:text-lg leading-tight tracking-wide mt-1"
                  aria-label="Disk programs"
                  aria-describedby="c64-disk-directory-hint"
                >
                  {DIRECTORY_ROWS.map((row, i) =>
                    row.kind === 'del' ? (
                      <div
                        key={`del-${i}`}
                        className="c64-dir-row c64-dir-row--static text-[var(--c64-crt-ink-dim)]"
                      >
                        <span className="c64-dir-blocks tabular-nums">0</span>
                        <span className="c64-dir-name min-w-0 truncate">&quot;----------------&quot;</span>
                        <span className="c64-dir-type">DEL</span>
                      </div>
                    ) : (
                      <button
                        key={row.action}
                        type="button"
                        onClick={() => playLoadCommandFromList(row.action)}
                        onKeyDown={handleDirectoryProgramKeyDown}
                        className="c64-dir-row c64-dir-row--prg w-full text-left border-0 rounded-none"
                        aria-label={`Load ${LOAD_COMMAND_BY_ACTION[row.action]} and open ${row.name}`}
                      >
                        <span className="c64-dir-blocks tabular-nums">{row.blocks}</span>
                        <span className="c64-dir-name min-w-0 truncate">
                          &quot;{row.name}&quot;
                        </span>
                        <span className="c64-dir-type">PRG</span>
                      </button>
                    ),
                  )}
                </nav>

                <div className="c64-dir-footer text-xs sm:text-base md:text-lg leading-tight tracking-wide mt-3 text-[var(--c64-crt-ink)]">
                  <p className="m-0">{DIRECTORY_BLOCKS_FREE} BLOCKS FREE.</p>
                  <p className="m-0">READY.</p>
                </div>
              </div>

              <div
                className="c64-terminal c64-authentic-boot w-full max-w-full text-xs sm:text-base md:text-lg leading-tight tracking-wide text-[var(--c64-crt-ink)] mt-2"
                onPointerDown={() => {
                  focusC64TerminalInput(terminalInputRef, { force: true })
                }}
              >
                <div className="sr-only" aria-live="polite">
                  {(() => {
                    const last = terminalHistory[terminalHistory.length - 1]
                    if (last === undefined) return ''
                    if (last.kind === 'text') return `Terminal: ${last.text}`
                    return 'Terminal: disk directory from LIST'
                  })()}
                </div>
                {terminalHistory.map((row) =>
                  row.kind === 'disk-catalog' ? (
                    <div key={row.id} className="m-0 w-full max-w-full">
                      <TerminalDiskCatalogEmbed
                        blockId={row.id}
                        onPlayLoad={playLoadCommandFromList}
                        onProgramKeyDown={handleDirectoryProgramKeyDown}
                      />
                    </div>
                  ) : (
                    <div
                      key={row.id}
                      className={
                        row.text === ''
                          ? 'm-0 min-h-[1.2em]'
                          : 'whitespace-pre-wrap break-words m-0'
                      }
                    >
                      {row.text}
                      {row.id === terminalLoadingLineId &&
                      terminalLoadingGlyph !== null ? (
                        <span className="c64-disk-spin-char" aria-hidden>
                          {terminalLoadingGlyph}
                        </span>
                      ) : null}
                    </div>
                  ),
                )}
                <div className="c64-terminal-prompt relative mt-0 block w-full max-w-full min-h-[1.35em]">
                  <label htmlFor="c64-terminal-input" className="sr-only">
                    Disk: use the directory above or type LOAD &quot;NAME&quot;,8,1 then Enter; when the computer prints READY., type RUN and Enter to open, or pick a program from the list (RUN is typed for you). With no BASIC program, LIST inserts a clickable disk catalog into this log. LOAD &quot;$&quot;,8 then LIST does the same and clears $-catalog readiness. Escape clears that readiness. BASIC: numbered lines store without READY after each line; LIST lists the program if any lines exist. PRINT supports CHR$(), RND(), INT, SIN, COS, comparisons (equals and less-than / greater-than), caret for power, one-letter variables A through Z with optional LET, IF condition THEN line number, FOR and NEXT (each on its own line; nested loops allowed), semicolons to stay on the same line, commas for spacing, and colons to put more than one statement on a line. Logical screen rows follow PRINT newlines; the view may wrap long lines on narrow screens. Output wraps in the browser like a modern terminal, not a fixed 40-column C64 screen. NEW, GOTO, RUN; on touch devices a Stop control appears while a program runs; on desktop use Escape when no panel is open.
                  </label>
                  {basicRunning && basicStopTouchUi ? (
                    <button
                      type="button"
                      className="relative z-[2] mb-2 inline-flex min-h-11 min-w-[5.5rem] touch-manipulation cursor-pointer items-center justify-center rounded-sm border-2 border-[var(--c64-accent)] bg-[var(--c64-border-bg)] px-3 py-2 text-center font-inherit text-sm text-[var(--c64-crt-ink)] shadow-sm active:opacity-90"
                      onClick={(e) => {
                        e.stopPropagation()
                        basicAbortRef.current?.abort()
                      }}
                      onPointerDown={(e) => e.stopPropagation()}
                      aria-label="Stop BASIC program"
                    >
                      [STOP]
                    </button>
                  ) : null}
                  <span className="whitespace-pre-wrap break-words align-bottom text-[var(--c64-crt-ink)]">
                    {terminalLine.slice(0, terminalPromptCaretPos)}
                  </span>
                  {terminalPromptCaretPos < terminalLine.length ? (
                    <span
                      className="c64-terminal-cursor-inverse align-bottom"
                      aria-hidden
                    >
                      {terminalLine.charAt(terminalPromptCaretPos)}
                    </span>
                  ) : (
                    <span
                      className="c64-disk-type-cursor c64-authentic-cursor align-bottom"
                      aria-hidden
                    />
                  )}
                  <span className="whitespace-pre-wrap break-words align-bottom text-[var(--c64-crt-ink)]">
                    {terminalLine.slice(terminalPromptCaretPos + 1)}
                  </span>
                  <input
                    id="c64-terminal-input"
                    ref={terminalInputRef}
                    type="text"
                    name="c64-terminal"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    value={terminalLine}
                    readOnly={terminalAutoTyping || terminalSequenceBusy || basicRunning}
                    aria-busy={terminalAutoTyping || terminalSequenceBusy || basicRunning}
                    onChange={(e) => {
                      if (terminalAutoTyping || terminalSequenceBusy || basicRunning) {
                        return
                      }
                      const el = e.currentTarget
                      setTerminalLine(el.value)
                      syncTerminalCaretFromInput(el)
                    }}
                    onSelect={(e) => {
                      syncTerminalCaretFromInput(e.currentTarget)
                    }}
                    onClick={(e) => {
                      syncTerminalCaretFromInput(e.currentTarget)
                    }}
                    onKeyDown={(e) => {
                      if (terminalAutoTyping) {
                        e.preventDefault()
                        return
                      }
                      if (basicRunning) {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                        }
                        return
                      }
                      if (terminalSequenceBusy) {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                        }
                        return
                      }
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        terminalSubmitRef.current(
                          terminalLine.replace(/\r/g, '').trim(),
                        )
                        return
                      }
                    }}
                    onPaste={(e: ClipboardEvent<HTMLInputElement>) => {
                      if (
                        terminalAutoTyping ||
                        terminalSequenceBusy ||
                        basicRunning
                      ) {
                        return
                      }
                      const clip = e.clipboardData?.getData('text/plain') ?? ''
                      if (!/[\r\n\u2028\u2029]/.test(clip)) {
                        return
                      }
                      e.preventDefault()
                      const lines = clip
                        .split(/\r\n|\r|\n|\u2028|\u2029/)
                        .map((line) => line.replace(/\r/g, '').trim())
                        .filter(
                          (line) => line.length > 0 && !/^```/.test(line),
                        )
                      setTerminalLine('')
                      setTerminalCaretPos(0)
                      const runLine = (i: number) => {
                        if (i >= lines.length) {
                          return
                        }
                        window.requestAnimationFrame(() => {
                          terminalSubmitRef.current(lines[i]!)
                          runLine(i + 1)
                        })
                      }
                      runLine(0)
                    }}
                    className="c64-terminal-input absolute inset-0 z-[1] h-full min-h-0 w-full cursor-text rounded-none border-0 bg-transparent p-0 text-transparent caret-transparent shadow-none ring-0 outline-none focus:outline-none focus-visible:outline-none focus:ring-0 selection:bg-transparent"
                  />
                </div>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  )
}
