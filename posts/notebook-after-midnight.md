---
title: Notebook After Midnight
date: 2026-04-12
category: code
tags: [javascript, obsidian, tools]
---

I keep a small file in my Obsidian vault called `notebook.md`. It is where
late-night scripts go to rest. Most of them are not useful. A few of them
turn into blog posts like this one.

## A function I wrote at 01:47

```javascript
function breathe(sequence, restLength = 1) {
  return sequence.flatMap((step, i) => {
    const rests = Array(restLength).fill(null);
    return i === sequence.length - 1 ? [step] : [step, ...rests];
  });
}

console.log(breathe(["kick", "snare", "piano"], 2));
// => ["kick", null, null, "snare", null, null, "piano"]
```

The function inserts `null` between each element. It is, essentially, a
**rest** operator for arrays. I wrote it because I was listening to a loop
and wanted to feel the gaps.

> [!note] Why `null` and not `undefined`
> `null` is an **intentional** nothing. `undefined` is an *accidental*
> nothing. For musical rests, only one of these is appropriate.

## What the script became

A week later I used `breathe` to generate spacing in a CSS grid. The array
became a list of row templates; each `null` became a blank row. The grid
looked like jazz.

Here is a fragment:

```css
.grid {
  display: grid;
  grid-template-rows:
    auto        /* kick   */
    1rem 1rem   /* rests  */
    auto        /* snare  */
    1rem 1rem   /* rests  */
    auto;       /* piano  */
}
```

Small enough to fit on a napkin. Large enough to change how the page breathes.

## A related limit

There is a reason the number of rests matters:

$$
\lim_{n \to \infty}\,\frac{\text{density of information}}{n} = 0
$$

where $n$ is the amount of whitespace. Past a certain point, more whitespace
does nothing — but *before* that point, every unit of blank space pays for
itself. Finding that point is the entire craft.

## Late-night rules

1. **Write it in one breath.** If it needs scrolling, save it for morning.
2. **Name the file after how it feels**, not what it does.
3. **Leave the bad version in.** Deleting it makes the good version less
   legible.

> [!warning] Production use
> Do not deploy anything written in this file without first reading it in
> daylight.
