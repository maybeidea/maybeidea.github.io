---
title: A Syntax for Rain at 02:00
date: 2026-04-06
category: code
tags: [javascript, pattern, jazz]
---

There is a specific kind of rain — thin, persistent, barely audible — that
only exists between about 01:30 and 03:00. I wanted to write a program that
matched its pacing.

## The sequencer

```javascript
const groove = ["kick", "snare", "piano", "rain"];

function loop(bars, beats = 4) {
  const out = [];
  for (let b = 1; b <= bars; b++) {
    for (let i = 0; i < beats; i++) {
      out.push(`${b}:${i + 1} ${groove[i % groove.length]}`);
    }
  }
  return out;
}

loop(2).forEach((line) => console.log(line));
```

The output reads like a score:

```text
1:1 kick
1:2 snare
1:3 piano
1:4 rain
2:1 kick
2:2 snare
2:3 piano
2:4 rain
```

## What the script taught me

Nothing the script *does* is novel. What matters is the **rhythm of reading
it aloud**. Code, like prose, has cadence. A good function, read slowly,
sounds like a verse.

> [!note] Quiet principle
> Name your variables so that reading the function aloud at 02:00 does not
> wake anyone up.

## A final fragment

```javascript
// for the loop to end gracefully
function fadeOut(arr, steps = 3) {
  return [...arr, ...Array(steps).fill("…")];
}
```

Every piece of music needs a way to stop. Most scripts forget this.
