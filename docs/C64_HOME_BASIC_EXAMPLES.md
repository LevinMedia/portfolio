# BASIC examples for the C64 home screen

Type these at the **READY.** prompt. For programs with line numbers, enter **each line** and press Enter, then type **`RUN`**.

One-line loops stop on their own when they hit the computer’s **step limit** (`?OUT OF STEPS`) — that’s normal.

---

## One-liners (then Enter)

**Hello**

```text
PRINT "HELLO"
```

**Roll a six-sided die**

```text
PRINT INT(RND(1)*6)+1
```

**Is RND greater than half?** (prints `-1` for yes, `0` for no — C64-style)

```text
PRINT (RND(1)>0.5)
```

---

## Classic maze (runs until step limit)

```text
10 PRINT CHR$(205.5+RND(1)); : GOTO 10
```

`RUN` — dense random slashes.  
`NEW` when you want to clear the program from memory.

---

## Tighter random slashes (biased)

Favors one diagonal a bit more than the other:

```text
10 PRINT CHR$(205.5+(RND(1)^2)); : GOTO 10
```

---

## Three-character chaos

Picks among three PETSCII codes in a row:

```text
10 PRINT CHR$(205+INT(RND(1)*3)); : GOTO 10
```

---

## Small banner (one logical row)

Prints a row of stars, then a newline. Finishes immediately — no infinite loop.

```text
10 FOR X=1 TO 24
20 PRINT "*";
30 NEXT X
40 PRINT
```

`RUN`

---

## Mini “screen” block (rows of dots)

Outer loop = rows, inner = columns. Each row ends with `PRINT` (blank `PRINT` = newline only after the row of semicolon-printed chars).

```text
10 FOR Y=1 TO 8
20 FOR X=1 TO 16
30 PRINT ".";
40 NEXT X
50 PRINT
60 NEXT Y
```

`RUN`

---

## Wave stripe (sine picks between two characters)

Uses a counter in `Y`; `SIN` is in **radians**.

```text
10 Y=0
20 FOR I=1 TO 80
30 Y=Y+1
40 PRINT CHR$(205.5+(SIN(Y/5)>0));
50 NEXT I
60 PRINT
```

`RUN`

---

## Random branches

Jumps to different “verses” depending on `INT(RND(1)*3)`:

```text
10 A=INT(RND(1)*3)
20 IF A=0 THEN 100
30 IF A=1 THEN 110
40 GOTO 120
100 PRINT "PATH A"
105 GOTO 200
110 PRINT "PATH B"
115 GOTO 200
120 PRINT "PATH C"
200 PRINT "DONE"
```

`RUN` a few times to see different paths.

---

## Countdown with FOR

```text
10 FOR T=5 TO 1 STEP -1
20 PRINT T
30 NEXT T
40 PRINT "GO"
```

`RUN`

---

## Tips

- **`LIST`** — see your program. **`NEW`** — erase it. **`RUN`** — start from the lowest line number.
- **`;`** after `PRINT` keeps the next character on the **same** logical line; **`PRINT` alone** starts a new line in the log.
- More syntax and limits: **`C64_TERMINAL_BASIC.md`**. Visitor overview: **`C64_HOME_USER_GUIDE.md`**.
