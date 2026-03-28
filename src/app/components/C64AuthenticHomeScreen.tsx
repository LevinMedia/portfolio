'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import type { KeyboardEvent, ReactNode } from 'react'
import {
  C64_HOME_BOOT_LINES_SESSION_KEY,
  loadC64Settings,
} from '@/lib/c64-settings'

/**
 * Home-only layout: classic C64 CRT (no site nav, no howdy).
 * Style64 C64 Pro Mono — https://style64.org/c64-truetype
 */

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
  const [terminalHistory, setTerminalHistory] = useState<{ id: number; text: string }[]>(
    [],
  )
  const [terminalLine, setTerminalLine] = useState('')
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
  const terminalLineIdRef = useRef(0)
  const terminalTypewriterRunIdRef = useRef(0)
  const terminalTypewriterTimeoutRef = useRef<number | undefined>(undefined)
  const terminalAutoTypingRef = useRef(false)
  const terminalSequenceBusyRef = useRef(false)
  const terminalLoadRunIdRef = useRef(0)
  const terminalLoadTimeoutsRef = useRef<number[]>([])

  const scrollViewportRef = useRef<HTMLDivElement>(null)
  const terminalInputRef = useRef<HTMLInputElement>(null)
  const diskLogKey = diskCompletedLines.join('\n')
  const terminalScrollKey = `${terminalHistory.map((h) => h.text).join('\n')}\n${terminalLine}\n${terminalLoadingGlyph ?? ''}\n${terminalSequenceBusy}\n${terminalPendingRun ? 'p' : ''}`

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
    if (!bootComplete) {
      return
    }
    const id = window.setTimeout(() => {
      terminalInputRef.current?.focus()
    }, 80)
    return () => window.clearTimeout(id)
  }, [bootComplete])

  /** Drawers focus-trap steals the prompt; put it back when a panel closes. */
  useEffect(() => {
    if (!bootComplete) {
      return
    }
    const wasOpen = wasDrawerOpenRef.current
    wasDrawerOpenRef.current = drawerOpen
    if (wasOpen && !drawerOpen) {
      const id = window.setTimeout(() => {
        if (terminalAutoTypingRef.current || terminalSequenceBusyRef.current) {
          return
        }
        terminalInputRef.current?.focus({ preventScroll: true })
      }, 200)
      return () => window.clearTimeout(id)
    }
    return undefined
  }, [bootComplete, drawerOpen])

  useEffect(() => {
    return () => {
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
      const rows: { id: number; text: string }[] = []
      for (const text of texts) {
        terminalLineIdRef.current += 1
        rows.push({ id: terminalLineIdRef.current, text })
      }
      setTerminalHistory((prev) => [...prev.slice(-199), ...rows])
    }

    if (reduced) {
      const texts = [
        '',
        `SEARCHING FOR ${searchLabel}`,
        'LOADING',
        'READY.',
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
        { id: loadingId, text: 'LOADING' },
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
          setTerminalHistory((prev) => [
            ...prev.slice(-199),
            { id: readyId, text: 'READY.' },
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
                { id: runRowId, text: 'RUN' },
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
      setTerminalHistory((prev) => [...prev.slice(-199), { id, text: full }])
      setTerminalLine('')
      startTerminalLoadSequence(
        action,
        'click',
        searchLabelFromLoadCommand(full),
      )
      window.requestAnimationFrame(() => terminalInputRef.current?.focus())
      return
    }

    if (terminalTypewriterTimeoutRef.current !== undefined) {
      window.clearTimeout(terminalTypewriterTimeoutRef.current)
    }
    terminalTypewriterRunIdRef.current += 1
    const runId = terminalTypewriterRunIdRef.current

    setTerminalAutoTyping(true)
    setTerminalLine('')
    terminalInputRef.current?.focus()

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
          setTerminalHistory((prev) => [...prev.slice(-199), { id, text: full }])
          setTerminalLine('')
          setTerminalAutoTyping(false)
          startTerminalLoadSequence(
            action,
            'click',
            searchLabelFromLoadCommand(full),
          )
          window.requestAnimationFrame(() => terminalInputRef.current?.focus())
        }, LOAD_AFTER_TYPED_PAUSE_MS)
      }
    }

    schedule(step, LOAD_TYPEWRITER_MS)
  }

  useEffect(() => {
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
      skipToCompleteBoot()
      return
    }

    if (settings.boot === 'session') {
      try {
        if (sessionStorage.getItem(C64_HOME_BOOT_LINES_SESSION_KEY)) {
          skipToCompleteBoot()
          return
        }
      } catch {
        // ignore
      }
    }

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
    }
  }, [])

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
              className="c64-authentic-boot whitespace-pre-wrap break-words m-0 text-sm sm:text-base md:text-lg leading-tight tracking-wide"
              aria-label="Startup messages"
            >
              {renderCenterBoot(linesShown)}
            </pre>
          </div>

          {showDiskBlock && (
            <pre className="c64-authentic-boot c64-authentic-text-fit whitespace-pre-wrap break-words m-0 mt-3 text-left text-sm sm:text-base md:text-lg leading-tight tracking-wide shrink-0 max-w-full">
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
                Disk directory. Each program opens a section; close the panel to return here. The
                listing stays pinned while the command log scrolls. Use Tab to reach a program, arrow
                keys or Home and End to move in the list, Enter to run.
              </p>

              <div className="c64-dir-listing-sticky">
                <div className="c64-dir-header text-sm sm:text-base md:text-lg leading-tight tracking-wide px-2 py-1.5 rounded-sm">
                  {DISK_VOLUME_LINE}
                </div>

                <nav
                  className="c64-dir-table text-sm sm:text-base md:text-lg leading-tight tracking-wide mt-1"
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

                <div className="c64-dir-footer text-sm sm:text-base md:text-lg leading-tight tracking-wide mt-3 text-[var(--c64-crt-ink)]">
                  <p className="m-0">{DIRECTORY_BLOCKS_FREE} BLOCKS FREE.</p>
                  <p className="m-0">READY.</p>
                </div>
              </div>

              <div
                className="c64-terminal c64-authentic-boot w-full max-w-full text-sm sm:text-base md:text-lg leading-tight tracking-wide text-[var(--c64-crt-ink)] mt-2"
                onPointerDown={() => {
                  terminalInputRef.current?.focus()
                }}
              >
                <div className="sr-only" aria-live="polite">
                  {terminalHistory.length > 0
                    ? `Printed: ${terminalHistory[terminalHistory.length - 1]?.text ?? ''}`
                    : ''}
                </div>
                {terminalHistory.map((row) => (
                  <div key={row.id} className="whitespace-pre-wrap break-words m-0">
                    {row.text}
                    {row.id === terminalLoadingLineId &&
                    terminalLoadingGlyph !== null ? (
                      <span className="c64-disk-spin-char" aria-hidden>
                        {terminalLoadingGlyph}
                      </span>
                    ) : null}
                  </div>
                ))}
                <div className="c64-terminal-prompt relative mt-0 block w-full max-w-full min-h-[1.35em]">
                  <label htmlFor="c64-terminal-input" className="sr-only">
                    Type LOAD &quot;NAME&quot;,8,1 then Enter; when the computer prints READY., type RUN and Enter to open. Or choose a program from the disk list — RUN is entered for you.
                  </label>
                  <span className="whitespace-pre-wrap break-words align-bottom text-[var(--c64-crt-ink)]">
                    {terminalLine}
                  </span>
                  <span
                    className="c64-disk-type-cursor c64-authentic-cursor align-bottom"
                    aria-hidden
                  />
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
                    readOnly={terminalAutoTyping || terminalSequenceBusy}
                    aria-busy={terminalAutoTyping || terminalSequenceBusy}
                    onChange={(e) => {
                      if (terminalAutoTyping || terminalSequenceBusy) {
                        return
                      }
                      setTerminalLine(e.target.value)
                    }}
                    onKeyDown={(e) => {
                      if (terminalAutoTyping) {
                        e.preventDefault()
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
                        const next = terminalLine.replace(/\r/g, '').trim()
                        if (next.length === 0) {
                          setTerminalLine('')
                          window.requestAnimationFrame(() => {
                            terminalInputRef.current?.focus()
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
                              { id: runLineId, text: 'RUN' },
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
                                { id: lineId, text: next },
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
                                terminalInputRef.current?.focus()
                              })
                              return
                            }
                            terminalLineIdRef.current += 1
                            const badLineId = terminalLineIdRef.current
                            terminalLineIdRef.current += 1
                            const errId = terminalLineIdRef.current
                            setTerminalHistory((prev) => [
                              ...prev.slice(-199),
                              { id: badLineId, text: next },
                              { id: errId, text: '?SYNTAX ERROR' },
                            ])
                          }
                          setTerminalLine('')
                          window.requestAnimationFrame(() => {
                            terminalInputRef.current?.focus()
                          })
                          return
                        }

                        const action = getTypedLoadAction(next)
                        terminalLineIdRef.current += 1
                        const id = terminalLineIdRef.current
                        const rows: { id: number; text: string }[] = [
                          { id, text: next },
                        ]
                        if (action === null) {
                          terminalLineIdRef.current += 1
                          rows.push({
                            id: terminalLineIdRef.current,
                            text: '?SYNTAX ERROR',
                          })
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
                          terminalInputRef.current?.focus()
                        })
                      }
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
