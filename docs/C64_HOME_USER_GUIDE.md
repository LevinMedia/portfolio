# What you can do on the C64 home screen

The portfolio home can look and feel like a Commodore 64: disk catalog, `LOAD` / `RUN`, and a **BASIC prompt** where you type small programs. This page is for **you** as a visitor or owner — not for programmers maintaining the code.

---

## The short version

You can **type commands** as if the machine is real: load fake disk programs, list the “directory,” and write **tiny BASIC programs** that print patterns, random art, and experiments. Output scrolls in a long log (like a modern terminal), so think “creative playground,” not a fixed TV-sized grid.

---

## Things you can try without writing a program

- **Open disk entries** — Pick a program from the list (or type the `LOAD "NAME",8,1` style command and `RUN`) to open About, work, notes, and the rest of the site in drawer panels.
- **Disk catalog** — The directory is the **clickable list** above the prompt (or type `LOAD "NAME",8,1` and `RUN`). With **no BASIC program in memory**, `LIST` logs `LIST` / `READY.` and scrolls to that list again (after `LOAD "$",8`, after loading a PRG, or anytime). The catalog is not pasted as plain text into the log. Closing a drawer can auto-type `LIST` the same way.
- **Clear the program in memory** — Type `NEW` to wipe any BASIC lines you’ve stored.
- **See what you stored** — Type `LIST` to show your current program lines.

---

## Things you can do with BASIC

Once you’re entering **numbered lines** (e.g. `10 PRINT "HI"`), you’re in “program mode.” Type `RUN` to execute.

### Make noise on screen

- **Classic maze** — A one-liner that keeps printing random slash-like characters until the computer stops it (there’s a safety limit so your browser never freezes).
- **Glitch fields** — Loops that print random symbols and blocks (PETSCII-style characters) for a dense, retro texture.
- **Stripes and waves** — Use math inside `CHR$(…)` so the character choice follows a sine-like pattern — calmer than pure random.
- **Banners** — Nested loops to print rows of stars, dashes, or mixed characters, one row per line.

### Play with randomness

- **Skewed random** — Favor one “look” over another so streaks appear instead of perfect noise.
- **Dice-style values** — Use `INT` and `RND` to pick integers in a range and print them or turn them into characters.

### Light logic

- **Variables** — Single letters `A` through `Z` hold numbers; you can update them each loop.
- **Branches** — `IF` something `THEN` a line number jumps around your program (good for “pick A, B, or C path”).
- **Loops** — `FOR` / `NEXT` for counted loops; you can nest them (loop inside a loop).

### Combine tricks

Mix **PRINT**, **semicolons** (stay on the same line), **PRINT** alone (new line), **GOTO**, **IF**, and **FOR** to build little “demos” that run for a few seconds and fill the log with something you designed.

---

## What to expect (so nothing feels “broken”)

- **It will stop on its own** if a loop runs too long — you’ll see `?OUT OF STEPS`. Start again or simplify the loop.
- **The line may wrap** on a phone or narrow window — that’s the browser fitting text; your program still thinks in “print this, then newline.”
- **Stopping a run** — **Escape** on a keyboard, or the on-screen **STOP** control on touch, while a program is running.
- **Not a full C64** — There’s no `INPUT` from inside a program, no string variables like `A$`, no `GOSUB`. If something isn’t listed above, assume it isn’t there yet.

---

## Where the nerdy details live

**`C64_HOME_BASIC_EXAMPLES.md`** — small programs you can type and run (maze, banners, waves, dice, and more).

For exact rules (every statement, limits, and technical notes), see **`C64_TERMINAL_BASIC.md`** in the same folder — that one is the “reference manual.” **This** file is the “what can I do?” answer.

---

*Have fun; the point is to mess with the machine a little before you wander into the rest of the site.*
