/**
 * Commodore-style BASIC for the C64 home terminal (modern teletype adaptation).
 *
 * Supported: PRINT (+ ; ,), GOTO, CHR$, RND, INT, SIN, COS, ^ power, comparisons (= < > <> <= >=)
 * → C64-style -1 / 0 from relations; single-letter variables A–Z and LET/A= assignment;
 * IF expr THEN line (branch only); FOR/NEXT (nested); multi-statement lines (:) except FOR/NEXT lines
 * must be a single statement each; step cap; abort.
 *
 * Display: output is a character stream (PRINT / ; / ,). “40×25” in listings is a loop count, not pixels —
 * the responsive terminal may wrap a long logical line across several visual rows; use PRINT alone for a
 * newline between logical rows (e.g. end each maze row with PRINT).
 *
 * Not yet: strings/$, arrays, GOSUB, multi-statement IF THEN … (only THEN line).
 * Note: C64 BASIC V2 has no ^ operator; we allow ^ for maze demos. RND(1)^2 is intentional sugar.
 */

export const BASIC_MAX_STEPS = 10_000

export type BasicProgram = Map<number, string>

export function createBasicProgram(): BasicProgram {
  return new Map()
}

const UNDEF_ERROR = "?UNDEF'D STATEMENT ERROR"
const SYNTAX_ERROR = '?SYNTAX ERROR'
const OUT_OF_STEPS = '?OUT OF STEPS'
const NEXT_WITHOUT_FOR = '?NEXT WITHOUT FOR'

/** Trim CR/LF; normalize spaces for line entry. */
export function normalizeInputLine(raw: string): string {
  return raw.replace(/\r/g, '').trim()
}

export function tryParseProgramLine(
  raw: string,
): { lineNum: number; rest: string } | null {
  const m = /^\s*(\d+)\s*(.*)$/.exec(raw.replace(/\r/g, ''))
  if (!m) return null
  const lineNum = Number.parseInt(m[1], 10)
  if (!Number.isFinite(lineNum) || lineNum < 0) return null
  return { lineNum, rest: m[2] ?? '' }
}

export function canonicalStatement(rest: string): string {
  const t = rest.trim()
  if (t.length === 0) return ''
  return t.toUpperCase()
}

export type StoreLineResult =
  | { kind: 'deleted'; lineNum: number }
  | { kind: 'stored'; lineNum: number; statement: string }

export function storeProgramLine(
  program: BasicProgram,
  lineNum: number,
  rest: string,
): StoreLineResult {
  const statement = canonicalStatement(rest)
  if (statement.length === 0) {
    program.delete(lineNum)
    return { kind: 'deleted', lineNum }
  }
  program.set(lineNum, statement)
  return { kind: 'stored', lineNum, statement }
}

export function formatProgramLineEcho(lineNum: number, rest: string): string {
  const statement = canonicalStatement(rest)
  if (statement.length === 0) {
    return String(lineNum)
  }
  return `${lineNum} ${statement}`
}

export function listProgram(program: ReadonlyMap<number, string>): string[] {
  const keys = [...program.keys()].sort((a, b) => a - b)
  return keys.map((n) => `${n} ${program.get(n) ?? ''}`)
}

// --- PETSCII → Unicode (Style64 C64 Pro Mono: U/G = U+E000 + PETSCII byte) ---
// https://style64.org/c64-truetype/petscii-rom-mapping — matches CHR$ in graphics mode.

/** Private Use Area base for PETSCII “unshifted / graphics” (same as typing on a C64 in UPPER+GRAPH). */
const PETSCII_UG_PUA_BASE = 0xe000

/** C64-style float → byte for CHR$ / screen code. */
export function c64ByteFromFloat(x: number): number {
  const i = Math.floor(x)
  return ((i % 256) + 256) % 256
}

export function petsciiScreenToChar(code: number): string {
  const b = c64ByteFromFloat(code)
  if (b >= 32 && b <= 126) {
    return String.fromCharCode(b)
  }
  return String.fromCharCode(PETSCII_UG_PUA_BASE + b)
}

// --- RND (C64-ish: x>0 → (0,1), x=0 → repeat last, x<0 → reseed) ---

function randomRndSeed32(): number {
  try {
    const c = globalThis.crypto
    if (c?.getRandomValues) {
      const buf = new Uint32Array(1)
      c.getRandomValues(buf)
      return buf[0]! >>> 0
    }
  } catch {
    // ignore (e.g. locked-down environment)
  }
  return 0xace1
}

export class RndGen {
  private seed: number
  private last = 0.731056431

  /** Omit `seed` for a session-unique starting point when `crypto` is available (else 0xace1). */
  constructor(seed?: number) {
    this.seed = seed !== undefined ? seed >>> 0 : randomRndSeed32()
  }

  rnd(x: number): number {
    if (x < 0) {
      const s = Math.abs(Math.floor(x * 1_000_007)) ^ 0x9e3779b9
      this.seed = s === 0 ? 0xdeadbeef : s >>> 0
      this.next01()
      return this.last
    }
    if (x > 0) {
      this.last = this.next01()
      return this.last
    }
    return this.last
  }

  private next01(): number {
    this.seed = (Math.imul(1664525, this.seed) + 1013904223) >>> 0
    const u = this.seed / 0x1_0000_0000
    const eps = 1e-12
    return Math.min(1 - eps, Math.max(eps, u))
  }
}

// --- Split : outside quotes ---

/** Split `:` outside quotes (multi-statement BASIC lines). */
export function splitStatements(line: string): string[] {
  const parts: string[] = []
  let start = 0
  let i = 0
  let inStr = false
  while (i < line.length) {
    const c = line[i]
    if (c === '"') {
      inStr = !inStr
    } else if (!inStr && c === ':') {
      const chunk = line.slice(start, i).trim()
      if (chunk.length > 0) parts.push(chunk)
      start = i + 1
    }
    i += 1
  }
  const last = line.slice(start).trim()
  if (last.length > 0) parts.push(last)
  return parts
}

function skipWs(s: string, i: number): number {
  let j = i
  while (j < s.length && /\s/.test(s[j])) j += 1
  return j
}

function isGotoStatement(stmt: string): boolean {
  const u = stmt.trim().toUpperCase()
  return u.startsWith('GOTO') || /^GO\s+TO\b/i.test(stmt.trim())
}

function parseGotoLine(stmt: string): number | null {
  const t = stmt.trim()
  let m = /^\s*GOTO\s+(\d+)\s*$/i.exec(t)
  if (m) return Number.parseInt(m[1], 10)
  m = /^\s*GO\s+TO\s+(\d+)\s*$/i.exec(t)
  if (m) return Number.parseInt(m[1], 10)
  return null
}

/** `IF expr THEN line` only (no THEN PRINT / THEN : …). */
function parseIfThenLine(stmt: string): { cond: string; target: number } | null {
  const t = stmt.trim()
  if (!t.toUpperCase().startsWith('IF')) {
    return null
  }
  const thenM = /\bTHEN\b/i.exec(t)
  if (thenM === null || thenM.index < 2) {
    return null
  }
  const cond = t.slice(2, thenM.index).trim()
  if (cond.length === 0) {
    return null
  }
  const after = t.slice(thenM.index + thenM[0].length).trim()
  const num = /^(\d+)\s*$/.exec(after)
  if (num === null) {
    return null
  }
  const target = Number.parseInt(num[1], 10)
  if (!Number.isFinite(target)) {
    return null
  }
  return { cond, target }
}

function skipWsGlobal(s: string, j: number): number {
  let k = j
  while (k < s.length && /\s/.test(s[k]!)) k += 1
  return k
}

/**
 * `FOR V = expr TO expr [STEP expr]` — one statement per line (no `:` on that line).
 */
function parseForLine(stmt: string): {
  var: string
  startS: string
  limitS: string
  stepS: string
} | null {
  const t = stmt.trim()
  if (!/^\s*FOR\b/i.test(t)) {
    return null
  }
  let i = (/^\s*FOR\b/i.exec(t) ?? [''])[0].length
  i = skipWsGlobal(t, i)
  if (i >= t.length || !/[A-Z]/i.test(t[i]!)) {
    return null
  }
  const v = t[i]!.toUpperCase()
  if (v < 'A' || v > 'Z') {
    return null
  }
  i += 1
  i = skipWsGlobal(t, i)
  if (t[i] !== '=') {
    return null
  }
  i += 1
  const start0 = i
  let depth = 0
  let toIdx = -1
  while (i < t.length) {
    const c = t[i]!
    if (c === '(') {
      depth += 1
    } else if (c === ')') {
      depth -= 1
    }
    if (depth === 0 && /^\s*TO\b/i.test(t.slice(i))) {
      toIdx = i
      break
    }
    i += 1
  }
  if (toIdx < 0) {
    return null
  }
  const startS = t.slice(start0, toIdx).trim()
  const toMatch = /^\s*TO\b/i.exec(t.slice(toIdx))
  if (toMatch === null) {
    return null
  }
  i = toIdx + toMatch[0].length
  const lim0 = i
  depth = 0
  let stepIdx = -1
  while (i < t.length) {
    const c = t[i]!
    if (c === '(') {
      depth += 1
    } else if (c === ')') {
      depth -= 1
    }
    if (depth === 0 && /^\s*STEP\b/i.test(t.slice(i))) {
      stepIdx = i
      break
    }
    i += 1
  }
  let limitS: string
  let stepS = '1'
  if (stepIdx >= 0) {
    limitS = t.slice(lim0, stepIdx).trim()
    const sm = /^\s*STEP\b/i.exec(t.slice(stepIdx))
    if (sm === null) {
      return null
    }
    stepS = t.slice(stepIdx + sm[0].length).trim()
  } else {
    limitS = t.slice(lim0).trim()
  }
  if (startS.length === 0 || limitS.length === 0 || stepS.length === 0) {
    return null
  }
  return { var: v, startS, limitS, stepS }
}

/** `NEXT` or `NEXT V` — one statement per line. */
function parseNextLine(stmt: string): { var?: string } | null {
  const t = stmt.trim()
  const m = /^\s*NEXT\b(.*)$/i.exec(t)
  if (m === null) {
    return null
  }
  const rest = (m[1] ?? '').trim().toUpperCase()
  if (rest.length === 0) {
    return {}
  }
  if (/^[A-Z]$/.test(rest)) {
    return { var: rest }
  }
  return null
}

type ForFrame = {
  var: string
  limit: number
  step: number
  bodyEntryLine: number
}

/** Single-letter variable A–Z; optional leading LET. */
function parseAssignStatement(stmt: string): { name: string; expr: string } | null {
  let t = stmt.trim()
  const letM = /^LET\s+/i.exec(t)
  if (letM !== null) {
    t = t.slice(letM[0].length).trim()
  }
  const m = /^([A-Z])\s*=\s*(.+)$/i.exec(t)
  if (m === null) {
    return null
  }
  const name = m[1].toUpperCase()
  const expr = m[2].trim()
  if (expr.length === 0) {
    return null
  }
  return { name, expr }
}

// --- Value / numeric eval (RND, + - * /, parens) ---

type Value = { kind: 'num'; n: number } | { kind: 'str'; s: string }

function formatPrintNumber(n: number): string {
  if (Number.isInteger(n) && Math.abs(n) <= 1e15) {
    return String(n)
  }
  return String(n)
}

/** Strip spaces for numeric tokenizer. */
function stripExprWs(s: string): string {
  return s.replace(/\s/g, '')
}

export type BasicEvalContext = {
  rnd: RndGen
  vars: Map<string, number>
}

function createEmptyEvalContext(): BasicEvalContext {
  return { rnd: new RndGen(), vars: new Map<string, number>() }
}

/**
 * Direct statements typed at READY. share one RNG and variable map (like one interactive session).
 * Without this, each `PRINT` used a fresh `RndGen` and `RND(1)` repeated the same value.
 */
const directModeEvalContext: BasicEvalContext = {
  rnd: new RndGen(),
  vars: new Map<string, number>(),
}

/** Clears direct-mode variables and reseeds RND; call when the user enters NEW. */
export function resetDirectEvalContext(): void {
  directModeEvalContext.rnd = new RndGen()
  directModeEvalContext.vars.clear()
}

export function evalNumericExpression(expr: string): number | null {
  return evalNumericWithContext(stripExprWs(expr), createEmptyEvalContext())
}

function evalNumericWithContext(s: string, ctx: BasicEvalContext): number | null {
  let i = 0
  const peek = () => s[i]
  const eat = (c: string) => {
    if (peek() === c) {
      i += 1
      return true
    }
    return false
  }

  const { rnd, vars } = ctx

  function parseRndArg(): number | null {
    if (!eat('(')) return null
    const inner = parseComparison()
    if (inner === null || !eat(')')) return null
    return inner
  }

  function parsePrimary(): number | null {
    if (eat('(')) {
      const inner = parseComparison()
      if (inner === null || !eat(')')) return null
      return inner
    }
    if (peek() === '-') {
      i += 1
      const v = parsePrimary()
      return v === null ? null : -v
    }
    const rest = s.slice(i).toUpperCase()
    if (rest.startsWith('RND')) {
      i += 3
      const arg = parseRndArg()
      if (arg === null) return null
      return rnd.rnd(arg)
    }
    if (rest.startsWith('INT')) {
      i += 3
      if (!eat('(')) return null
      const inner = parseComparison()
      if (inner === null || !eat(')')) return null
      return Math.floor(inner)
    }
    if (rest.startsWith('SIN')) {
      i += 3
      if (!eat('(')) return null
      const inner = parseComparison()
      if (inner === null || !eat(')')) return null
      return Math.sin(inner)
    }
    if (rest.startsWith('COS')) {
      i += 3
      if (!eat('(')) return null
      const inner = parseComparison()
      if (inner === null || !eat(')')) return null
      return Math.cos(inner)
    }
    const num = parseNumber()
    if (num !== null) return num
    if (/[A-Z]/.test(peek() ?? '')) {
      const name = peek()!
      i += 1
      return vars.get(name) ?? 0
    }
    return null
  }

  function parseNumber(): number | null {
    const start = i
    if (peek() === '-') {
      i += 1
    }
    let sawDigit = false
    while (i < s.length && /[0-9]/.test(s[i])) {
      sawDigit = true
      i += 1
    }
    if (peek() === '.') {
      i += 1
      while (i < s.length && /[0-9]/.test(s[i])) {
        sawDigit = true
        i += 1
      }
    }
    if (!sawDigit) {
      i = start
      return null
    }
    const n = Number.parseFloat(s.slice(start, i))
    return Number.isFinite(n) ? n : null
  }

  /** Right-associative ^ (not on stock C64 BASIC; useful for demos). */
  function parseExponent(): number | null {
    const left = parsePrimary()
    if (left === null) return null
    if (peek() === '^') {
      i += 1
      const right = parseExponent()
      if (right === null) return null
      return Math.pow(left, right)
    }
    return left
  }

  function parseFactor(): number | null {
    let left = parseExponent()
    if (left === null) return null
    while (peek() === '*' || peek() === '/') {
      const op = peek()
      i += 1
      const right = parseExponent()
      if (right === null) return null
      left = op === '*' ? left * right : left / right
    }
    return left
  }

  function parseExpr(): number | null {
    let left = parseFactor()
    if (left === null) return null
    while (peek() === '+' || peek() === '-') {
      const op = peek()
      i += 1
      const right = parseFactor()
      if (right === null) return null
      left = op === '+' ? left + right : left - right
    }
    return left
  }

  /** Relations yield -1 (true) or 0 (false), like Commodore BASIC numeric comparisons. */
  function parseComparison(): number | null {
    const left = parseExpr()
    if (left === null) return null
    if (i >= s.length) return left

    const c0 = peek()
    if (c0 === '<') {
      i += 1
      if (eat('>')) {
        const r = parseExpr()
        if (r === null) return null
        return left !== r ? -1 : 0
      }
      if (eat('=')) {
        const r = parseExpr()
        if (r === null) return null
        return left <= r ? -1 : 0
      }
      const r = parseExpr()
      if (r === null) return null
      return left < r ? -1 : 0
    }
    if (c0 === '>') {
      i += 1
      if (eat('=')) {
        const r = parseExpr()
        if (r === null) return null
        return left >= r ? -1 : 0
      }
      const r = parseExpr()
      if (r === null) return null
      return left > r ? -1 : 0
    }
    if (c0 === '=') {
      i += 1
      const r = parseExpr()
      if (r === null) return null
      return left === r ? -1 : 0
    }
    return left
  }

  const v = parseComparison()
  if (v === null || i !== s.length) return null
  return v
}

function matchChr$(s: string, start: number): { innerStart: number; end: number } | null {
  const u = s.slice(start).toUpperCase()
  if (!u.startsWith('CHR$(')) return null
  let j = start + 'CHR$('.length
  let depth = 1
  while (j < s.length && depth > 0) {
    const c = s[j]
    if (c === '(') depth += 1
    else if (c === ')') depth -= 1
    j += 1
  }
  if (depth !== 0) return null
  return { innerStart: start + 'CHR$('.length, end: j }
}

function evalValueExpr(slice: string, ctx: BasicEvalContext): Value | null {
  const t = slice.trim()
  if (t.length === 0) return { kind: 'str', s: '' }
  const ws0 = skipWs(t, 0)
  const mchr = matchChr$(t, ws0)
  if (mchr !== null && skipWs(t, mchr.end) === t.length) {
    const inner = t.slice(mchr.innerStart, mchr.end - 1)
    const n = evalNumericWithContext(stripExprWs(inner), ctx)
    if (n === null) return null
    const b = c64ByteFromFloat(n)
    return { kind: 'str', s: petsciiScreenToChar(b) }
  }
  const n = evalNumericWithContext(stripExprWs(t), ctx)
  if (n === null) return null
  return { kind: 'num', n }
}

function findPrintItemEnd(tail: string, start: number): number {
  let i = skipWs(tail, start)
  if (i >= tail.length) return i
  if (tail[i] === '"') {
    i += 1
    while (i < tail.length) {
      if (tail[i] === '"') {
        i += 1
        break
      }
      i += 1
    }
    return i
  }
  let depth = 0
  while (i < tail.length) {
    const c = tail[i]
    if (c === '"') {
      i += 1
      while (i < tail.length && tail[i] !== '"') i += 1
      if (i < tail.length) i += 1
      continue
    }
    if (c === '(') depth += 1
    else if (c === ')' && depth > 0) depth -= 1
    else if (depth === 0 && (c === ';' || c === ',')) return i
    i += 1
  }
  return i
}

function executePrintTail(
  tail: string,
  ctx: BasicEvalContext,
  emit: (op: BasicOutputOp) => void,
): boolean {
  let i = skipWs(tail, 0)
  let needNewline = true

  const doAppend = (text: string) => {
    if (text.length > 0) emit({ op: 'append', text })
  }

  while (i < tail.length) {
    i = skipWs(tail, i)
    if (i >= tail.length) break

    const c = tail[i]
    if (c === ';') {
      needNewline = false
      i += 1
      continue
    }
    if (c === ',') {
      doAppend('  ')
      needNewline = false
      i += 1
      continue
    }

    if (c === '"') {
      let j = i + 1
      let out = ''
      while (j < tail.length && tail[j] !== '"') {
        out += tail[j]
        j += 1
      }
      if (j >= tail.length) return false
      j += 1
      doAppend(out.toUpperCase())
      i = j
      continue
    }

    const end = findPrintItemEnd(tail, i)
    const piece = tail.slice(i, end).trim()
    if (piece.length > 0) {
      const v = evalValueExpr(piece, ctx)
      if (v === null) return false
      if (v.kind === 'num') doAppend(formatPrintNumber(v.n))
      else doAppend(v.s)
    }
    i = end
  }

  if (needNewline) emit({ op: 'newline' })
  return true
}

export function parseBasicPrintStatement(
  stmt: string,
): { ok: true; text: string } | { ok: false } {
  const m = /^\s*PRINT\b\s*(.*)$/i.exec(stmt)
  if (!m) return { ok: false }
  const ctx = createEmptyEvalContext()
  const parts: string[] = []
  const ok = executePrintTail(m[1] ?? '', ctx, (op) => {
    if (op.op === 'append') parts.push(op.text)
    if (op.op === 'newline') parts.push('\n')
  })
  if (!ok) return { ok: false }
  return { ok: true, text: parts.join('').replace(/\n$/, '') }
}

function nextLineNum(current: number, sortedLines: number[]): number | null {
  const idx = sortedLines.findIndex((n) => n > current)
  return idx === -1 ? null : sortedLines[idx]!
}

type AfterNextResult = number | 'past_end' | null

/** `null` = no matching NEXT; `past_end` = NEXT on last line (run ends after skip). */
function findLineAfterMatchingNext(
  program: ReadonlyMap<number, string>,
  sortedLines: number[],
  forLineNum: number,
): AfterNextResult {
  let depth = 1
  const fromIdx = sortedLines.findIndex((n) => n > forLineNum)
  if (fromIdx < 0) {
    return null
  }
  for (let li = fromIdx; li < sortedLines.length; li += 1) {
    const ln = sortedLines[li]!
    const text = program.get(ln)
    if (text === undefined) {
      continue
    }
    const subs = splitStatements(text)
    for (const sub of subs) {
      const tr = sub.trim()
      if (parseForLine(tr) !== null) {
        depth += 1
        continue
      }
      if (parseNextLine(tr) !== null) {
        depth -= 1
        if (depth === 0) {
          const nxt = nextLineNum(ln, sortedLines)
          return nxt === null ? 'past_end' : nxt
        }
        if (depth < 0) {
          return null
        }
      }
    }
  }
  return null
}

async function yieldToEventLoop(): Promise<void> {
  await new Promise<void>((r) => {
    setTimeout(r, 0)
  })
}

export type BasicRunStatus =
  | 'completed'
  | 'syntax_error'
  | 'undef_error'
  | 'out_of_steps'
  | 'aborted'

export type BasicOutputOp =
  | { op: 'append'; text: string }
  | { op: 'newline' }
  | { op: 'lines'; texts: string[] }

export interface RunBasicProgramOptions {
  entryLine?: number
  maxSteps?: number
  signal?: AbortSignal
  /** Stream: append / newline for PRINT; lines for errors and multi-line messages. */
  onOutput: (op: BasicOutputOp) => void
}

function emitLines(onOutput: (op: BasicOutputOp) => void, texts: string[]) {
  onOutput({ op: 'lines', texts })
}

export async function runBasicProgram(
  program: ReadonlyMap<number, string>,
  options: RunBasicProgramOptions,
): Promise<BasicRunStatus> {
  const maxSteps = options.maxSteps ?? BASIC_MAX_STEPS
  const sortedLines = [...program.keys()].sort((a, b) => a - b)
  const signal = options.signal
  const ctx: BasicEvalContext = { rnd: new RndGen(), vars: new Map<string, number>() }
  const { onOutput } = options
  const forStack: ForFrame[] = []

  if (sortedLines.length === 0) {
    return 'completed'
  }

  let pc: number | null =
    options.entryLine !== undefined ? options.entryLine : sortedLines[0]!

  let steps = 0

  while (pc !== null) {
    if (signal?.aborted) {
      return 'aborted'
    }

    steps += 1
    if (steps > maxSteps) {
      emitLines(onOutput, [OUT_OF_STEPS])
      return 'out_of_steps'
    }

    await yieldToEventLoop()

    const stmtLine = program.get(pc)
    if (stmtLine === undefined) {
      emitLines(onOutput, [UNDEF_ERROR])
      return 'undef_error'
    }

    const subs = splitStatements(stmtLine)
    let jumped: number | null = null
    let exitRun = false

    for (const sub of subs) {
      const trimmed = sub.trim()

      const ifThen = parseIfThenLine(trimmed)
      if (ifThen !== null) {
        const condVal = evalNumericWithContext(stripExprWs(ifThen.cond), ctx)
        if (condVal === null) {
          emitLines(onOutput, [SYNTAX_ERROR])
          return 'syntax_error'
        }
        if (condVal !== 0) {
          if (!program.has(ifThen.target)) {
            emitLines(onOutput, [UNDEF_ERROR])
            return 'undef_error'
          }
          jumped = ifThen.target
          break
        }
        /* false: done with this sub; remaining subs (after :) still run */
        continue
      }

      const printMatch = /^\s*PRINT\b(.*)$/i.exec(trimmed)
      if (printMatch) {
        const ok = executePrintTail(printMatch[1] ?? '', ctx, onOutput)
        if (!ok) {
          emitLines(onOutput, [SYNTAX_ERROR])
          return 'syntax_error'
        }
        continue
      }

      if (isGotoStatement(trimmed)) {
        const target = parseGotoLine(trimmed)
        if (target === null) {
          emitLines(onOutput, [SYNTAX_ERROR])
          return 'syntax_error'
        }
        if (!program.has(target)) {
          emitLines(onOutput, [UNDEF_ERROR])
          return 'undef_error'
        }
        jumped = target
        break
      }

      const nextParsed = parseNextLine(trimmed)
      if (nextParsed !== null) {
        if (subs.length > 1) {
          emitLines(onOutput, [SYNTAX_ERROR])
          return 'syntax_error'
        }
        if (forStack.length === 0) {
          emitLines(onOutput, [NEXT_WITHOUT_FOR])
          return 'syntax_error'
        }
        const top = forStack[forStack.length - 1]!
        if (nextParsed.var !== undefined && nextParsed.var !== top.var) {
          emitLines(onOutput, [SYNTAX_ERROR])
          return 'syntax_error'
        }
        const cur = (ctx.vars.get(top.var) ?? 0) + top.step
        ctx.vars.set(top.var, cur)
        const cont =
          (top.step > 0 && cur <= top.limit) ||
          (top.step < 0 && cur >= top.limit)
        if (cont) {
          jumped = top.bodyEntryLine
          break
        }
        forStack.pop()
        continue
      }

      const forParsed = parseForLine(trimmed)
      if (forParsed !== null) {
        if (subs.length > 1) {
          emitLines(onOutput, [SYNTAX_ERROR])
          return 'syntax_error'
        }
        const start = evalNumericWithContext(stripExprWs(forParsed.startS), ctx)
        const limit = evalNumericWithContext(stripExprWs(forParsed.limitS), ctx)
        const stepVal = evalNumericWithContext(stripExprWs(forParsed.stepS), ctx)
        if (start === null || limit === null || stepVal === null) {
          emitLines(onOutput, [SYNTAX_ERROR])
          return 'syntax_error'
        }
        if (stepVal === 0) {
          emitLines(onOutput, [SYNTAX_ERROR])
          return 'syntax_error'
        }
        ctx.vars.set(forParsed.var, start)
        const bodyEntry = nextLineNum(pc, sortedLines)
        const cont =
          (stepVal > 0 && start <= limit) ||
          (stepVal < 0 && start >= limit)
        if (!cont) {
          const after = findLineAfterMatchingNext(program, sortedLines, pc)
          if (after === null) {
            emitLines(onOutput, [SYNTAX_ERROR])
            return 'syntax_error'
          }
          if (after === 'past_end') {
            exitRun = true
          } else {
            jumped = after
          }
          break
        }
        if (bodyEntry === null) {
          emitLines(onOutput, [SYNTAX_ERROR])
          return 'syntax_error'
        }
        forStack.push({
          var: forParsed.var,
          limit,
          step: stepVal,
          bodyEntryLine: bodyEntry,
        })
        continue
      }

      const assign = parseAssignStatement(trimmed)
      if (assign !== null) {
        const v = evalNumericWithContext(stripExprWs(assign.expr), ctx)
        if (v === null) {
          emitLines(onOutput, [SYNTAX_ERROR])
          return 'syntax_error'
        }
        ctx.vars.set(assign.name, v)
        continue
      }

      emitLines(onOutput, [SYNTAX_ERROR])
      return 'syntax_error'
    }

    if (exitRun) {
      pc = null
    } else if (jumped !== null) {
      pc = jumped
    } else {
      pc = nextLineNum(pc, sortedLines)
    }
  }

  return 'completed'
}

export function tryDirectPrint(
  raw: string,
): { ok: true; ops: BasicOutputOp[] } | { ok: false } {
  const t = normalizeInputLine(raw)
  const m = /^\s*PRINT\b(.*)$/i.exec(t)
  if (!m) return { ok: false }
  const ops: BasicOutputOp[] = []
  const ok = executePrintTail(m[1] ?? '', directModeEvalContext, (op) => {
    ops.push(op)
  })
  if (!ok) return { ok: false }
  return { ok: true, ops }
}

export function tryDirectGoto(raw: string): number | null {
  const t = normalizeInputLine(raw)
  if (!isGotoStatement(t)) return null
  return parseGotoLine(t)
}

export function isDirectList(raw: string): boolean {
  return normalizeInputLine(raw).toUpperCase() === 'LIST'
}

export function isDirectNew(raw: string): boolean {
  return normalizeInputLine(raw).toUpperCase() === 'NEW'
}

export function isDirectRun(raw: string): boolean {
  return normalizeInputLine(raw).toUpperCase() === 'RUN'
}

export { SYNTAX_ERROR, UNDEF_ERROR, OUT_OF_STEPS }
