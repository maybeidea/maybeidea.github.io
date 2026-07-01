---
title: 何为长度——lebesgue 测度
date: 2026-06-24
category: math
tags:
  - 测度论
  - lebesgue测度
  - 实变函数
featuredFormula: \mu\left(\bigcup_{n=1}^{\infty}A_n\right)=\sum_{n=1}^{\infty}\mu(A_n)
quote: 长度不该只是线段的属性，而应该是一套能在极限中保持诚实的记账规则。
publish: true
---
# 测度是如何定义

长度、面积和体积，是我们从古至今都在讨论的事情，或者说，度量催生了数学

直觉告诉我们他们是某种相同的概念在不同维度上的表现，他们应该遵循某种相同的定义，我们该如何定义度量

## 用区间定义长度的局限性

对区间 $[a,b]$，长度定义为

$$
\ell([a,b])=b-a.
$$

这个定义天然满足非负性：

$$
\ell([a,b])\geq 0.
$$

如果把一个区间拆成有限个互不重叠的区间，总长度也等于各部分长度之和。

例如，当 $a<c<b$ 时，

$$
\ell([a,b])
=
\ell([a,c])+\ell([c,b]).
$$

也就是

$$
b-a=(c-a)+(b-c).
$$

这就是我们对“大小”的直觉。它是非负的，也具有加法性质。

问题出在它的定义域。

假设有一列两两不相交的区间

$$
I_1,I_2,I_3,\ldots
$$

我们希望写下

$$
\ell\left(\bigcup_{n=1}^{\infty}I_n\right)
=
\sum_{n=1}^{\infty}\ell(I_n).
$$

但可列个区间的并通常不再是一个区间(就是说左边没有定义)。

## 先决定哪些集合能够被测量

设 $X$ 是我们研究的全集。

如果同时要求长度保持平移不变、满足可列可加性，并且保留普通区间的长度，那么某些集合无法被一致地赋予大小(见[[何为长度——lebesgue 测度的定义与构造#为什么不能测量所有集合——不可测集 Vitali Set 的构造]])。

因此，测度并不一定定义在整个幂集 $\mathcal P(X)$ 上，而是定义在一个经过筛选的集合族 $\mathcal F$ 上。

这个集合族需要满足：

1. $X\in\mathcal F$；
2. 若 $A\in\mathcal F$，则 $X\setminus A\in\mathcal F$；
3. 若 $A_1,A_2,\ldots\in\mathcal F$，则

   $$
   \bigcup_{n=1}^{\infty}A_n\in\mathcal F.
   $$

这样的 $\mathcal F$ 称为 $X$ 上的 $\sigma$-algebra。

前两个条件保证取补集不会离开可测集合族，第三个条件则直接修复了区间长度遇到的问题：可测集合做可列并之后，结果仍然可测。

由这些条件还可以推出，$\mathcal F$ 对可列交和集合差封闭。

例如，

$$
\bigcap_{n=1}^{\infty}A_n
=
X\setminus
\bigcup_{n=1}^{\infty}(X\setminus A_n).
$$

$\sigma$-algebra 的作用不是描述集合是否规整，而是保证我们在执行分析中常见的集合运算时，不会突然离开“允许谈论大小”的范围。

真正被定义的，不只是大小，还有哪些对象可以被测量。

> [!note]  
> $\sigma$-algebra 对补集、可列并和可列交封闭，因此从可测集合出发进行这些运算，结果仍然可测。它一定包含 $\varnothing$ 和 $X$；由某个集合族生成的最小 $\sigma$-algebra 记作 $\sigma(\mathcal A)$。实数轴上的 Borel $\sigma$-algebra，就是由所有开区间生成的。

## 从长度的性质抽象出测度

有了对可列运算封闭的集合族，下一步是规定“大小”应当遵守哪些规则。

在可测空间 $(X,\mathcal F)$ 上，一个测度是映射

$$
\mu:\mathcal F\to[0,\infty],
$$

并满足以下条件。

### 空集的测度为零

$$
\mu(\varnothing)=0.
$$

### 测度非负

$$
\mu(A)\geq 0.
$$

测度允许取 $+\infty$。例如，整条实数轴的 Lebesgue 测度就是无穷。

### 可列可加性

若 $A_1,A_2,\ldots$ 两两不相交，则

$$
\mu\left(\bigcup_{n=1}^{\infty}A_n\right)
=
\sum_{n=1}^{\infty}\mu(A_n).
$$

这三条规则定义了抽象意义上的测度。

它们来自我们对长度、面积和体积的基本直觉，但比普通长度更一般。

其中最有趣的是 可列可加性，这甚至值得我们单开一章去聊聊

为什么测度要求的不是有限可加？

直接原因就是为了方便长度的概念可以在 Lebesgue 积分中使用。我们希望数学约束应尽量放松，实际上有限可加，可列可加，任意无限可加的约束是逐步加紧的，但因为 Lebesgue 积分我们希望他至少满足无限次的相加，而可列是最小的无限

即使如此，可列可加性依然是一个非常强的约束，那些满足有限可加但不满足可列可加的集合函数，只是因为他们不能很好的放到极限的话题里讨论就直接剔除(可列集可以拆成可列的单点集的并，测度为 0)

从这个角度看，测度论并不是说有限可加的“长度”毫无意义，而是选择了一套更适合分析的规则。

## 测度是一种通用的关于"大小"的定义

满足上述公理的函数都叫测度，但它们不一定表示几何长度。

例如，计数测度定义为

$$
\mu(A)=\#A.
$$

它测量的是集合中元素的个数。

Dirac 测度定义为

$$
\delta_x(A)=
\begin{cases}
1, & x\in A,\\
0, & x\notin A.
\end{cases}
$$

它只检查集合是否包含指定点 $x$。

概率测度则额外满足

$$
P(X)=1.
$$

它测量的不是长度，而是事件发生的概率。

## Lebesgue 测度是什么

Lebesgue 测度是实数轴上的一个具体测度。

它不仅满足测度公理，还保留了原来的区间长度：

$$
m([a,b])=b-a.
$$

它也满足平移不变性：

$$
m(A+x)=m(A).
$$

也就是说，移动一个集合不会改变它的长度。

所以，Lebesgue 测度可以理解为：

> 将普通区间长度推广到更丰富的集合，同时保持非负性、可列可加性和平移不变性所得到的标准长度。

# 如何构造 Lebesgue 测度

测度公理只告诉我们，一个已经存在的测度应当满足什么性质。

但它并没有自动保证，确实存在一个定义在足够多集合上、同时保留区间长度的测度。

Lebesgue 测度仍然需要被构造出来。

## 从外部覆盖集合

对任意集合 $E\subseteq\mathbb R$，用可列个开区间覆盖它：

$$
E\subseteq\bigcup_{k=1}^{\infty}I_k.
$$

这组区间的总长度为

$$
\sum_{k=1}^{\infty}|I_k|.
$$

同一个集合可以有许多种覆盖方式。我们取所有覆盖总长度的下确界：

$$
m^*(E)
=
\inf\left\{
\sum_{k=1}^{\infty}|I_k|
\;\middle|\;
E\subseteq\bigcup_{k=1}^{\infty}I_k
\right\}.
$$

$m^*$ 称为 Lebesgue outer measure，即 Lebesgue 外测度。

这种定义可以作用于实数轴的任意子集，不要求集合本身能够写成区间的有限并。

> [!tip]
> 外测度不分析集合内部有多复杂。它只问：从外面覆盖这个集合，最少需要多少区间长度？

对于普通区间，外测度会给出原来的长度：

$$
m^*([a,b])=b-a.
$$

因此，外测度保留了构造的起点。

但是外测度还不是测度

虽然 $m^*$ 对所有集合都有定义，但它在所有集合上通常只满足**次可加性**：

$$
m^*\left(\bigcup_{n=1}^{\infty}A_n\right)
\leq
\sum_{n=1}^{\infty}m^*(A_n).
$$

外测度对所有集合都有定义，但我们不能测量所有集合，详见[[何为长度——lebesgue 测度的定义与构造#为什么不能测量所有集合——不可测集 Vitali Set 的构造]]

接下来必须从所有集合中筛选出一部分，使外测度在这些集合上真正成为测度。

## 筛选可测集合

结合外测度与双向包含，很大程度上说，我们还要寻找集合使得
$$
m^*\left(\bigcup_{n=1}^{\infty}A_n\right)
\geq
\sum_{n=1}^{\infty}m^*(A_n).
$$

我们很自然的想到提出内测度与外测度对应，这也是 Lebesgue 最初的想法，只要外测度和内测度相等就是可测的，但 Carathéodory 提出了不依赖于实数轴、区间和“长度” 的新的方法

如果按照 Lebesgue 最初的思路，用“内外测度相等”定义可测集合，那么可以证明它与 Carathéodory 条件等价。若采用现代教材中更常见的构造，则 Carathéodory 条件本身就被用来定义可测集合。

需要注意，Lebesgue 外测度仍然是从实数轴上的区间长度出发构造的。它用可列个区间覆盖集合，并取覆盖总长度的下确界。因此，在这个具体例子里，外测度仍然依赖于 $\mathbb R$、区间和长度。

但 Carathéodory 的贡献，是把这件事从具体的长度问题中抽象出来。外测度不一定来自区间覆盖；它可以定义在任意集合 $X$ 的幂集 $\mathcal P(X)$ 上，只要满足空集为零、单调性和次可加性。

Carathéodory 条件关心的不是区间本身，而是：哪些集合能够在这个外测度下稳定地切割任意集合，并恢复加法关系。

Carathéodory 的条件规定：若对任意 $A\subseteq\mathbb R$，都有

$$
m^*(A)
=
m^*(A\cap E)
+
m^*(A\setminus E),
$$

则称 $E$ 是可测的。

这个等式把任意集合 $A$ 沿着 $E$ 切成两部分。

如果切割前后的外测度能够严格相加，说明 $E$ 没有破坏长度的加法结构。

 不难证明，所有满足这一条件的集合构成了一个 $\sigma$-algebra，记作 $\mathcal L$。

将外测度限制在 $\mathcal L$ 上：

$$
m=m^*|_{\mathcal L},
$$

便得到 Lebesgue 测度。

### Carathéodory 条件与 Lebesgue 测度的等价性的证明

 满足Lebesgue 测度的集合一定满足 Carathéodory 条件是显然的，下面主要证明 Carathéodory 条件可以推出可列可加性

设

$$
\mathcal L
=
\left\{
E\subseteq\mathbb R:
\forall A\subseteq\mathbb R,\ 
m^*(A)
=
m^*(A\cap E)+m^*(A\setminus E)
\right\}.
$$

也就是说，$\mathcal L$ 是所有满足 Carathéodory 条件的集合组成的集合族。

下面证明：将外测度 $m^*$ 限制在 $\mathcal L$ 上之后，它满足可列可加性。

先考虑两个两两不交的集合。

若 $E,F\in\mathcal L$，且

$$
E\cap F=\varnothing,
$$

将

$$
A=E\cup F
$$

代入 $E$ 的 Carathéodory 条件，得到

$$
m^*(E\cup F)
=
m^*((E\cup F)\cap E)
+
m^*((E\cup F)\setminus E).
$$

由于

$$
(E\cup F)\cap E=E,
$$

且

$$
(E\cup F)\setminus E=F,
$$

所以

$$
m^*(E\cup F)=m^*(E)+m^*(F).
$$

这说明，对于互不相交的 Carathéodory 可测集合，外测度已经满足有限可加性。

重复这个过程，可以得到：若

$$
E_1,E_2,\ldots,E_N\in\mathcal L
$$

两两不交，则

$$
m^*\left(\bigcup_{n=1}^{N}E_n\right)
=
\sum_{n=1}^{N}m^*(E_n).
$$

接下来考虑可列个集合。

设

$$
E_1,E_2,\ldots\in\mathcal L
$$

两两不交，并令

$$
E=\bigcup_{n=1}^{\infty}E_n.
$$

因为所有满足 Carathéodory 条件的集合构成一个 $\sigma$-algebra，所以

$$
E\in\mathcal L.
$$

对任意 $N$，都有

$$
\bigcup_{n=1}^{N}E_n
\subseteq
E.
$$

由外测度的单调性，

$$
m^*(E)
\geq
m^*\left(\bigcup_{n=1}^{N}E_n\right).
$$

再由刚才得到的有限可加性，

$$
m^*\left(\bigcup_{n=1}^{N}E_n\right)
=
\sum_{n=1}^{N}m^*(E_n).
$$

因此

$$
m^*(E)
\geq
\sum_{n=1}^{N}m^*(E_n).
$$

令 $N\to\infty$，得到

$$
m^*(E)
\geq
\sum_{n=1}^{\infty}m^*(E_n).
$$

另一方面，外测度本身满足可列次可加性，所以

$$
m^*(E)
=
m^*\left(\bigcup_{n=1}^{\infty}E_n\right)
\leq
\sum_{n=1}^{\infty}m^*(E_n).
$$

两个不等式合在一起，便得到

$$
m^*\left(\bigcup_{n=1}^{\infty}E_n\right)
=
\sum_{n=1}^{\infty}m^*(E_n).
$$

这正是可列可加性。

因此，Carathéodory 条件的作用不是简单地给集合贴上“可测”的标签，而是筛选出一类集合，使外测度在这类集合上从“只能次可加”恢复为“真正可列可加”。

# 为什么不能测量所有集合——不可测集 Vitali Set 的构造

## Vitali 集的构造

在 $[0,1]$ 上定义等价关系：$x \sim y \Longleftrightarrow x - y \in \mathbb Q$。两个实数之差为有理数时，归入同一等价类。利用**选择公理**，从每个等价类中恰好选取一个代表元，组成集合 $V \subseteq [0,1]$。

将 $[-1,1]$ 中的全体有理数排列为 $q_1, q_2, \ldots$，定义平移副本：

$$
V_k = V + q_k = \{v + q_k \mid v \in V\}.
$$

**这些副本两两不交。** 若存在 $i \neq j$ 使得某 $x \in V_i \cap V_j$，则存在 $v_i, v_j \in V$ 满足 $x = v_i + q_i = v_j + q_j$。于是 $v_i - v_j = q_j - q_i \in \mathbb Q$，即 $v_i \sim v_j$。但 $V$ 从每个等价类仅选一个代表，故 $v_i = v_j$，进而 $q_i = q_j$，与 $i \neq j$ 矛盾。因此 $V_i \cap V_j = \varnothing$（$i \neq j$）。

## 这些副本拼出了什么

记 $U = \bigcup_{k=1}^{\infty} V_k$。对任意 $x \in [0,1]$，它所在等价类在 $V$ 中有代表 $v$，故 $x - v \in \mathbb Q$。又因 $x, v \in [0,1]$，差落在 $[-1,1]$ 内，因此存在某个 $q_k$ 使得 $x = v + q_k \in V_k$。于是 $[0,1] \subseteq U$。

另一方面，每个 $v + q_k$ 满足 $v \in [0,1]$、$q_k \in [-1,1]$，故 $v + q_k \in [-1, 2]$，即 $U \subseteq [-1,2]$。综上：

$$
[0,1] \subseteq U \subseteq [-1,2].
$$

## 矛盾

假设 $V$ 是 Lebesgue 可测的。由平移不变性，每个 $V_k$ 也可测，且 $m(V_k) = m(V)$。

$V_k$ 两两不交，可列可加性给出：

$$
m(U) = m\!\left(\bigcup_{k=1}^{\infty} V_k\right) = \sum_{k=1}^{\infty} m(V_k) = \sum_{k=1}^{\infty} m(V).
$$

由包含关系，$1 = m([0,1]) \leq m(U) \leq m([-1,2]) = 3$，即 $m(U)$ 被夹在 $1$ 和 $3$ 之间。

- 若 $m(V) = 0$，则 $m(U) = 0$，与 $m(U) \geq 1$ 矛盾。
- 若 $m(V) > 0$，则无穷级数 $\sum_{k=1}^{\infty} m(V) = +\infty$，与 $m(U) \leq 3$ 矛盾。

$m(V)$ 既不能是零也不能为正——无论哪种情形都导出矛盾。因此 $V$ 不可能是 Lebesgue 可测的。

此反例依赖选择公理，如果不承认选择公理此反例也就不存在了，事实上这是我们目前能举出的唯一反例。