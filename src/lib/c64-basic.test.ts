import { describe, expect, it } from 'vitest'

import type { BasicOutputOp } from './c64-basic'
import {
  BASIC_MAX_STEPS,
  createBasicProgram,
  evalNumericExpression,
  formatProgramLineEcho,
  listProgram,
  runBasicProgram,
  splitStatements,
  storeProgramLine,
  tryDirectGoto,
  resetDirectEvalContext,
  tryDirectPrint,
  tryParseProgramLine,
  petsciiScreenToChar,
  c64ByteFromFloat,
} from './c64-basic'

async function runCollecting(
  program: ReturnType<typeof createBasicProgram>,
  opts: Omit<Parameters<typeof runBasicProgram>[1], 'onOutput'>,
): Promise<{ st: Awaited<ReturnType<typeof runBasicProgram>>; lines: string[] }> {
  const lines: string[] = []
  let buf = ''
  const st = await runBasicProgram(program, {
    ...opts,
    onOutput: (op) => {
      if (op.op === 'append') buf += op.text
      else if (op.op === 'newline') {
        lines.push(buf)
        buf = ''
      } else if (op.op === 'lines') {
        if (buf.length > 0) {
          lines.push(buf)
          buf = ''
        }
        lines.push(...op.texts)
      }
    },
  })
  if (buf.length > 0) lines.push(buf)
  return { st, lines }
}

function opsToRows(ops: BasicOutputOp[]): string[] {
  const lines: string[] = []
  let buf = ''
  for (const op of ops) {
    if (op.op === 'append') buf += op.text
    else if (op.op === 'newline') {
      lines.push(buf)
      buf = ''
    } else if (op.op === 'lines') {
      if (buf.length > 0) {
        lines.push(buf)
        buf = ''
      }
      lines.push(...op.texts)
    }
  }
  if (buf.length > 0) lines.push(buf)
  return lines
}

describe('c64-basic', () => {
  it('stores, canonicalizes, and deletes program lines', () => {
    const p = createBasicProgram()
    storeProgramLine(p, 10, 'PrInT "hi"')
    expect(p.get(10)).toBe('PRINT "HI"')
    storeProgramLine(p, 10, '   ')
    expect(p.has(10)).toBe(false)
  })

  it('lists lines in numeric order', () => {
    const p = createBasicProgram()
    storeProgramLine(p, 20, 'PRINT 1')
    storeProgramLine(p, 10, 'PRINT 2')
    expect(listProgram(p)).toEqual(['10 PRINT 2', '20 PRINT 1'])
  })

  it('formatProgramLineEcho matches stored form', () => {
    expect(formatProgramLineEcho(10, 'print 1+1')).toBe('10 PRINT 1+1')
    expect(formatProgramLineEcho(5, '')).toBe('5')
  })

  it('tryParseProgramLine', () => {
    expect(tryParseProgramLine('10 PRINT "X"')).toEqual({
      lineNum: 10,
      rest: 'PRINT "X"',
    })
    expect(tryParseProgramLine('LOAD "X"')).toBeNull()
  })

  it('evalNumericExpression', () => {
    expect(evalNumericExpression('1+2*3')).toBe(7)
    expect(evalNumericExpression('(1+2)*3')).toBe(9)
    expect(evalNumericExpression('-5+2')).toBe(-3)
    expect(evalNumericExpression('')).toBeNull()
    expect(evalNumericExpression('1+')).toBeNull()
  })

  it('evalNumericExpression INT, comparisons, power', () => {
    expect(evalNumericExpression('INT(3.9)')).toBe(3)
    expect(evalNumericExpression('INT(-3.2)')).toBe(-4)
    expect(evalNumericExpression('5>3')).toBe(-1)
    expect(evalNumericExpression('5<3')).toBe(0)
    expect(evalNumericExpression('2^3')).toBe(8)
    expect(evalNumericExpression('2^2^2')).toBe(16)
    expect(evalNumericExpression('SIN(0)')).toBeCloseTo(0)
  })

  it('assignment and IF THEN run with variables', async () => {
    const p = createBasicProgram()
    storeProgramLine(p, 10, 'A=2+3')
    storeProgramLine(p, 20, 'PRINT A')
    const { lines } = await runCollecting(p, {})
    expect(lines).toContain('5')
  })

  it('IF false still runs rest of line after colon', async () => {
    const p = createBasicProgram()
    /* No higher line numbers: after 10, RUN ends so we only prove the : PRINT ran. */
    storeProgramLine(p, 10, 'IF 0 THEN 99: PRINT "OK"')
    const { lines } = await runCollecting(p, {})
    expect(lines).toContain('OK')
  })

  it('IF true branches', async () => {
    const p = createBasicProgram()
    storeProgramLine(p, 10, 'IF -1 THEN 30')
    storeProgramLine(p, 20, 'PRINT "SKIP"')
    storeProgramLine(p, 30, 'PRINT "HERE"')
    const { lines } = await runCollecting(p, {})
    expect(lines).toContain('HERE')
    expect(lines).not.toContain('SKIP')
  })

  it('nested FOR/NEXT builds logical rows (PRINT newline between rows)', async () => {
    const p = createBasicProgram()
    storeProgramLine(p, 10, 'FOR Y=1 TO 2')
    storeProgramLine(p, 20, 'FOR X=1 TO 2')
    storeProgramLine(p, 30, 'PRINT "*";')
    storeProgramLine(p, 40, 'NEXT X')
    storeProgramLine(p, 50, 'PRINT')
    storeProgramLine(p, 60, 'NEXT Y')
    const { lines } = await runCollecting(p, {})
    expect(lines.filter((l) => l === '**').length).toBe(2)
  })

  it('FOR skips body when range is empty', async () => {
    const p = createBasicProgram()
    storeProgramLine(p, 10, 'FOR I=1 TO 0')
    storeProgramLine(p, 20, 'PRINT "BAD"')
    storeProgramLine(p, 30, 'NEXT I')
    const { st, lines } = await runCollecting(p, {})
    expect(st).toBe('completed')
    expect(lines).not.toContain('BAD')
  })

  it('NEXT without FOR is an error', async () => {
    const p = createBasicProgram()
    storeProgramLine(p, 10, 'NEXT I')
    const { st, lines } = await runCollecting(p, {})
    expect(st).toBe('syntax_error')
    expect(lines).toContain('?NEXT WITHOUT FOR')
  })

  it('RND(1) in numeric expression', () => {
    const a = evalNumericExpression('RND(1)')
    const b = evalNumericExpression('RND(1)')
    expect(a).not.toBeNull()
    expect(b).not.toBeNull()
    expect(a!).toBeGreaterThan(0)
    expect(a!).toBeLessThan(1)
  })

  it('splitStatements respects quotes', () => {
    expect(splitStatements('PRINT "A:B": GOTO 10')).toEqual([
      'PRINT "A:B"',
      'GOTO 10',
    ])
  })

  it('PETSCII maze bytes (PUA U+E0CD / U+E0CE under C64 Pro Mono)', () => {
    expect(petsciiScreenToChar(205)).toBe('\uE0CD')
    expect(petsciiScreenToChar(206)).toBe('\uE0CE')
    expect(c64ByteFromFloat(205.7)).toBe(205)
    expect(c64ByteFromFloat(206.2)).toBe(206)
  })

  it('PETSCII high bytes use PUA, not middle-dot fallback', () => {
    expect(petsciiScreenToChar(210)).toBe('\uE0D2')
    expect(petsciiScreenToChar(230)).toBe('\uE0E6')
  })

  it('tryDirectPrint and tryDirectGoto', () => {
    const pr = tryDirectPrint('print "hello"')
    expect(pr.ok).toBe(true)
    if (pr.ok) {
      expect(opsToRows(pr.ops)).toEqual(['HELLO'])
    }
    expect(tryDirectGoto('go to 40')).toBe(40)
    expect(tryDirectGoto('GOTO 40')).toBe(40)
  })

  it('tryDirectPrint semicolon suppresses newline row merge', () => {
    const pr = tryDirectPrint('print "A";')
    expect(pr.ok).toBe(true)
    if (pr.ok) {
      expect(opsToRows(pr.ops)).toEqual(['A'])
    }
  })

  it('tryDirectPrint RND advances across separate PRINT lines (d6)', () => {
    resetDirectEvalContext()
    const faces = new Set<number>()
    for (let i = 0; i < 40; i += 1) {
      const pr = tryDirectPrint('PRINT INT(RND(1)*6)+1')
      expect(pr.ok).toBe(true)
      if (pr.ok) {
        const row = opsToRows(pr.ops)[0]
        expect(row).toBeDefined()
        const n = Number(row)
        expect(n).toBeGreaterThanOrEqual(1)
        expect(n).toBeLessThanOrEqual(6)
        faces.add(n)
      }
    }
    expect(faces.size).toBeGreaterThan(1)
  })

  it('tryDirectPrint (RND(1)>0.5) varies across lines (not stuck at 0)', () => {
    resetDirectEvalContext()
    const outs = new Set<string>()
    for (let i = 0; i < 24; i += 1) {
      const pr = tryDirectPrint('PRINT (RND(1)>0.5)')
      expect(pr.ok).toBe(true)
      if (pr.ok) {
        outs.add(opsToRows(pr.ops)[0] ?? '')
      }
    }
    expect(outs.has('0')).toBe(true)
    expect(outs.has('-1')).toBe(true)
  })

  it('RUN follows GOTO loop until step cap', async () => {
    const p = createBasicProgram()
    storeProgramLine(p, 10, 'PRINT "A"')
    storeProgramLine(p, 20, 'GOTO 10')
    const { st, lines } = await runCollecting(p, { maxSteps: 8 })
    expect(st).toBe('out_of_steps')
    expect(lines.filter((x) => x === 'A').length).toBeGreaterThanOrEqual(3)
    expect(lines).toContain('?OUT OF STEPS')
  })

  it('10 PRINT maze line runs with CHR and RND', async () => {
    const p = createBasicProgram()
    storeProgramLine(p, 10, 'PRINT CHR$(205.5+RND(1)); : GOTO 10')
    const { st, lines } = await runCollecting(p, { maxSteps: 40 })
    expect(st).toBe('out_of_steps')
    const joined = lines.join('')
    expect(joined).toMatch(/[\uE0CD\uE0CE]+/)
    expect(lines).toContain('?OUT OF STEPS')
  })

  it('undefined GOTO target errors', async () => {
    const p = createBasicProgram()
    storeProgramLine(p, 10, 'GOTO 99')
    const { st, lines } = await runCollecting(p, {})
    expect(st).toBe('undef_error')
    expect(lines).toContain("?UNDEF'D STATEMENT ERROR")
  })

  it('direct entry line starts at GOTO target', async () => {
    const p = createBasicProgram()
    storeProgramLine(p, 10, 'PRINT "Y"')
    storeProgramLine(p, 30, 'PRINT "Z"')
    const { lines } = await runCollecting(p, { entryLine: 30 })
    expect(lines).toContain('Z')
    expect(lines).not.toContain('Y')
  })

  it('GOTO skips sequential lines', async () => {
    const p = createBasicProgram()
    storeProgramLine(p, 10, 'PRINT "A"')
    storeProgramLine(p, 20, 'GOTO 40')
    storeProgramLine(p, 30, 'PRINT "SKIP"')
    storeProgramLine(p, 40, 'PRINT "B"')
    const { lines } = await runCollecting(p, {})
    expect(lines).toContain('A')
    expect(lines).toContain('B')
    expect(lines).not.toContain('SKIP')
  })

  it('unknown statement is syntax error', async () => {
    const p = createBasicProgram()
    storeProgramLine(p, 10, 'FOO')
    const { st, lines } = await runCollecting(p, {})
    expect(st).toBe('syntax_error')
    expect(lines).toContain('?SYNTAX ERROR')
  })

  it('PRINTFOO does not parse as PRINT', async () => {
    const p = createBasicProgram()
    storeProgramLine(p, 10, 'PRINTFOO')
    const { st, lines } = await runCollecting(p, {})
    expect(st).toBe('syntax_error')
    expect(lines).toContain('?SYNTAX ERROR')
  })

  it('aborts when signal is already aborted (no statements run)', async () => {
    const p = createBasicProgram()
    storeProgramLine(p, 10, 'PRINT "X"')
    const ac = new AbortController()
    ac.abort()
    const { st, lines } = await runCollecting(p, { signal: ac.signal })
    expect(st).toBe('aborted')
    expect(lines).toEqual([])
  })

  it('aborts mid-run after a timer turn', async () => {
    const p = createBasicProgram()
    storeProgramLine(p, 10, 'PRINT "X"')
    storeProgramLine(p, 20, 'GOTO 10')
    const ac = new AbortController()
    const lines: string[] = []
    let buf = ''
    const done = runBasicProgram(p, {
      signal: ac.signal,
      maxSteps: 100_000,
      onOutput: (op) => {
        if (op.op === 'append') buf += op.text
        else if (op.op === 'newline') {
          lines.push(buf)
          buf = ''
        } else if (op.op === 'lines') {
          if (buf.length > 0) {
            lines.push(buf)
            buf = ''
          }
          lines.push(...op.texts)
        }
      },
    })
    await new Promise<void>((r) => {
      setTimeout(() => {
        ac.abort()
        r()
      }, 0)
    })
    const st = await done
    if (buf.length > 0) lines.push(buf)
    expect(st).toBe('aborted')
  })

  it('default max steps is BASIC_MAX_STEPS', () => {
    expect(BASIC_MAX_STEPS).toBe(10_000)
  })
})
