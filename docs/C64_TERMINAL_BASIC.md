# C64 home terminal — BASIC pocket manual

For a **visitor-friendly** “what can I do here?” overview, see **`C64_HOME_USER_GUIDE.md`**. **Copy-paste examples:** **`C64_HOME_BASIC_EXAMPLES.md`**.

This is the dialect implemented in `src/lib/c64-basic.ts` for the authentic C64 home screen. It is **not** a full Commodore 64 BASIC V2 interpreter; it is a small, browser-safe subset with a C64 feel.

---

## How you use it

- **Numbered lines** — Type `10 PRINT "HELLO"`, Enter. The line is stored; there is no `READY.` after each stored line (unlike typing at the real C64 immediate mode).
- **LIST** — With a stored program, prints those lines in the log. With **no** program lines, logs `LIST` / `READY.` and scrolls to the **clickable disk directory** above the prompt (after `LOAD "$",8`, after a PRG `LOAD`, or anytime — not pasted as plain text).
- **NEW** — Clears the stored program.
- **RUN** — Runs from the lowest line number (or continues after `LOAD` / `RUN` flows from the disk UI).
- **GOTO n** — Direct or inside a program; target line must exist or you get `?UNDEF'D STATEMENT ERROR`.
- **Colon** — Several statements on one line: `PRINT "A": GOTO 10`. **Exception:** a line that contains **FOR** or **NEXT** must contain **only** that one statement (no `:` on that line).
- **Step limit** — Long tight loops stop with `?OUT OF STEPS` (default 10 000 steps) so the tab cannot hang.
- **Stop** — While a program runs: **Escape** on desktop; **[STOP]** on touch. **PRINT** during a run streams into the log; the “screen” is one wide scrolling terminal, not a fixed 40×25 hardware matrix. Use **PRINT** alone for a newline between **logical** rows; the browser may still wrap a long line visually.

---

## What’s in the language

| Feature | Notes |
|--------|--------|
| **PRINT** | Strings in `"..."` (shown in uppercase). Numbers print as-is. |
| **`;`** | Stay on the same logical line (no newline at end of PRINT). |
| **`,`** | Inserts a two-space field (C64-ish spacing). |
| **CHR$(n)** | One character from PETSCII value `n` (see below). |
| **RND(x)** | `x > 0`: next random in (0,1). `x = 0`: repeat last. `x < 0`: reseed, then value. |
| **INT(x)** | Floor toward −∞ (C64-style). |
| **SIN(x)**, **COS(x)** | Radians. |
| **^** | Power, **right-associative**. *Not* on stock C64 BASIC V2; included for short demos. |
| **Comparisons** | `=`, `<>`, `<`, `>`, `<=`, `>=` in expressions yield **−1** (true) or **0** (false), like C64 numeric compares. |
| **+ − * /** | With parentheses as usual. |
| **Variables** | Single letters **A–Z** only. **LET** optional: `LET A=1` or `A=1`. Unread variables are **0**. |
| **IF expr THEN line** | If expression ≠ 0, jump to **line**; if 0, fall through. **Only** `THEN <line number>` — not `THEN PRINT …`. After a false IF, the rest of the **same** physical line after `:` still runs. |
| **FOR / NEXT** | `FOR I = start TO limit [STEP step]`, `NEXT` or `NEXT I`. Nested loops OK. **One statement per line** for any line that has FOR or NEXT. **STEP 0** is an error. |
| **GOTO** | Same line or elsewhere. |

---

## PETSCII and CHR$

Non-ASCII codes use the **Style64 “uppercase / graphics” mapping** (private use area **U+E000 + byte**) so **C64 Pro Mono** draws the right glyphs. ASCII **32–126** print as normal ASCII. The classic maze one-liner uses **205** and **206** (diagonals) with `CHR$(205.5+RND(1))`.

You can still think in **PETSCII ranges** for glitch art, bars, and block characters — not only mazes.

---

## Ideas beyond the maze one-liner

All of these fit what you have **today** (maybe within the step limit).

### Output and “graphics”

- **Random PETSCII fields** — `CHR$(200+INT(RND(1)*40))` style loops to fill the log with blocks, lines, and symbols.
- **Deterministic art** — Use `SIN` / `COS` on a counter in a FOR loop to pick between two or three CHR$ codes (waves, stripes, “circuit” patterns).
- **Biased randomness** — `(RND(1)>0.7)` or `(RND(1)^2)` inside a CHR$ expression to skew which character appears (streakier noise).
- **Banners** — Nested FORs to print rows of the same character, or alternating characters, then `PRINT` for a newline each row.
- **Progressive density** — A variable `P` updated each step (`P=P+(RND(1)-.5)/10` with clamps via IF) to change how often you pick one glyph vs another (needs a few lines of assigns + IF).

### Numbers and toys

- **Dice / ranges** — `INT(RND(1)*6)+1` for 1..6; print many times in a loop for a histogram of text characters.
- **Comparisons as arithmetic** — `205.5+(RND(1)>0.5)` style tricks map booleans into CHR$ bands.
- **Mini state machines** — Variables hold “mode” or position; **IF … THEN** jumps to different line blocks (menu-like, not interactive input).

### Structure and “demos”

- **Multiple sections** — `GOTO` chains: init block, draw block, delay loop (FOR…NEXT with empty body or PRINT), repeat.
- **Entry point** — `RUN` always starts at the smallest line number; use `IF 1 THEN 100` on line 10 to skip to a “main” label at 100 if you like that style.
- **Clear and redraw** — `NEW` from the user clears program; from code you can’t call NEW, but you can branch to a “clear output” strategy by PRINTing blank lines or separators (strings of spaces or dashes).

### What you cannot do yet

- **INPUT**, **GET**, **INPUT#** — no keyboard input inside a running program.
- **String variables** (`A$`), **arrays**, **DEF FN**, **ON GOTO**, **GOSUB/RETURN**.
- **PEEK/POKE**, **WAIT**, **SYS** — no machine.
- **Multi-statement** `IF THEN PRINT …` — only `THEN line`.
- **FOR … : PRINT … : NEXT** on one line — FOR/NEXT lines must be alone.

---

## Sample skeletons (patterns, not copy-paste gospel)

**One-line infinite texture (until step cap):**

```text
10 PRINT CHR$(205.5+RND(1)); : GOTO 10
```

**Row of 40 glyphs then newline (logical row; may wrap on narrow viewports):**

```text
10 FOR X=1 TO 40
20 PRINT "*";
30 NEXT X
40 PRINT
```

**Branching “modes” (line numbers are examples):**

```text
10 A=INT(RND(1)*3)
20 IF A=0 THEN 100
30 IF A=1 THEN 200
40 GOTO 300
```

---

## Files and limits

- Implementation: **`src/lib/c64-basic.ts`**
- Tests: **`src/lib/c64-basic.test.ts`**
- Step cap constant: **`BASIC_MAX_STEPS`** (10 000)

When something fails, you’ll see familiar C64-style messages such as `?SYNTAX ERROR`, `?UNDEF'D STATEMENT ERROR`, `?OUT OF STEPS`, or `?NEXT WITHOUT FOR`.

---

*Treat this as a creative constraint set: short programs, visible output, and a CRT that scrolls like a modern log — with C64 typography and PETSCII when you reach for CHR$.*
