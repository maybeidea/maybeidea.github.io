---
title: Footnotes for a Half-Remembered Proof
date: 2026-03-30
category: math
tags: [proof, footnote, table]
---

I am trying to reconstruct a theorem I half-remember from a late lecture.
The lecturer was drawing on a blackboard with a piece of chalk so short it
kept slipping out of their fingers. I remember the conclusion more clearly
than the argument.

## What I remember

There is an identity — one of Euler's — that connects five of the most
important constants in mathematics into a single sentence:

$$
e^{i\pi} + 1 = 0
$$

This is not the theorem from the lecture. But it is in the same *neighborhood*.

## The argument, with gaps

The lecture started with the Taylor expansion of $e^x$:

$$
e^x = \sum_{n=0}^{\infty} \frac{x^n}{n!}
$$

Then — this is where my memory blurs — the lecturer substituted $x = i\theta$
and separated the real and imaginary parts. Something like:

$$
e^{i\theta} = \cos\theta + i\sin\theta
$$

Setting $\theta = \pi$ gives Euler's identity. But I am not sure whether the
lecture went that way, or whether I am importing a proof I read later.[^lec]

## A table of what I am sure of

| Claim                              | Confidence | Note                               |
| ---------------------------------- | ---------- | ---------------------------------- |
| The lecture mentioned Euler        | High       | The name was on the board.         |
| It involved a Taylor series        | Medium     | I copied one into my notes.        |
| It ended in $e^{i\pi} + 1 = 0$     | Medium     | Or possibly a closely related form.|
| The chalk kept breaking            | High       | I remember this very clearly.      |

> [!warning] Epistemic status
> This post is **not** a reliable source for the proof of Euler's identity.
> It is a reliable source for what it feels like to try to reconstruct one.

## Footnotes as margin memory

I have started using footnotes the way I use the margins of a paper book —
not for citations, but for **what I almost forgot**.[^margin]

That, more than anything, is what the form is for.

[^lec]: The lecture was in a building that no longer exists. I cannot ask.

[^margin]: See also the [[Margins for Memory]] post, which argues for the
      same idea from a different angle.
