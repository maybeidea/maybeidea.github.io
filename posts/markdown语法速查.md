---
title: markdown语法速查
date: 2026-5-1
category: 笔记管理
tags:
  - md
  - 语法字典
  - 笔记方法
featuredFormula:
publish: true
---

参考教程：[Markdown 入门](https://markdown.com.cn/)

# 最基本的语法

## 段落与换行

用空白行区分段落。

在行尾添加两个或多个空格后回车，或使用 `<br>`，可以实现强制换行。

```markdown
hello world

bye world<br>
see you tomorrow
```

## 标题语法

`#` 后面需要加一个空格。

```markdown
# 一级标题
## 二级标题
### 三级标题
```

## 代码

- 行内代码：用一对反引号包裹，例如：`` `code` ``。
- 如果内容本身包含反引号，可以用双反引号包裹。
- 缩进至少四个空格或一个制表符，可以创建代码块。
- 更推荐使用围栏代码块：用三个反引号包裹代码，并在开头标明语言。

````markdown
```python
print("hello world")
```
````

# 基本语法

## 字体与强调

```markdown
*斜体*
**粗体**
***粗斜体***
~~删除线~~
==高亮==  <!-- Obsidian 支持 -->
```

## 引用

- 普通块引用：在段落前添加 `>`。
- 多段引用：空白行也要添加 `>`。
- 嵌套引用：使用 `>>`。

```markdown
> Dorothy followed her through many beautiful rooms.
>
>> The Witch bade her clean the pots and kettles.
```

## 列表

有序列表：

```markdown
1. 第一项
2. 第二项
3. 第三项
```

无序列表：

```markdown
- 第一项
- 第二项
  - 嵌套列表
```

## 分割线

在单独一行使用三个或多个星号、破折号或下划线：

```markdown
***
---
___
```

为了兼容性与美观，建议在分割线前后添加空白行。

## 链接

注意使用英文标点。

```markdown
这是一个链接：[Markdown 语法](https://markdown.com.cn "Markdown 教程")

<https://markdown.com.cn>
```

## 图片

图片地址可以是本地地址，也可以是网络地址。

```markdown
![图片说明](https://markdown.com.cn/assets/img/philly-magic-garden.9c0b4415.jpg "图片标题")
```

也可以为图片添加链接：

```markdown
[![图片说明](https://markdown.com.cn/assets/img/philly-magic-garden.9c0b4415.jpg)](https://markdown.com.cn)
```

## 转义字符

要显示原本用于 Markdown 格式化的字符，可以在字符前添加反斜杠 `\`。

```markdown
\*这不是斜体\*
\# 这不是标题
```

# 进阶语法

## 表格

使用三个或多个连字符创建表头分隔线，并用管道符 `|` 分隔列。

```markdown
| Syntax | Description |
| --- | --- |
| Header | Title |
| Paragraph | Text |
```

可以在分隔线中添加冒号控制对齐方式：

```markdown
| 左对齐 | 居中 | 右对齐 |
| :--- | :---: | ---: |
| A | B | C |
```

## 脚注

```markdown
这里有一个脚注。[^note]

[^note]: 这是脚注内容。
```

## 任务列表

```markdown
- [x] 已完成
- [ ] 未完成
```

## 数学公式

Markdown 支持 LaTeX 风格的数学公式。行内公式注意 `$` 与内容之间不要加空格。

```markdown
行内公式：$E = mc^2$

块级公式：
$$
E = mc^2
$$
```

更多内容可参考：[[LaTeX 数学公式语法]]

# Obsidian 常用 Markdown 语法

## 双向链接

```markdown
[[笔记名称]]
[[笔记名称|显示文本]]
[[笔记名称#标题]]
```

## 嵌入内容

```markdown
![[另一篇笔记]]
![[图片.png]]
![[PDF文件.pdf]]
```

## 标签

```markdown
#学习
#项目/Markdown
```

## 高亮

```markdown
==重点内容==
```

## Callout 提示块

```markdown
> [!note]
> 这是一条普通提示。

> [!tip]
> 这是一条技巧提示。

> [!warning]
> 这是一条警告。
```

常见类型：`note`、`info`、`tip`、`warning`、`danger`、`question`、`quote`。

## 折叠 Callout

```markdown
> [!note]+ 默认展开
> 内容

> [!note]- 默认折叠
> 内容
```

## 块引用与块链接

```markdown
这是一段内容。^block-id

[[笔记名称#^block-id]] 块链接，点击可跳转

! [[笔记名称#^block-id]]  嵌入式块链接， 内容直接嵌入
```

## 属性 / Frontmatter

```yaml
---
title: Markdown 语法速查
tags:
  - Markdown
  - Obsidian
created: 2026-05-02
---
```

## 注释

```markdown
%% 这是一段只在编辑模式中可见的注释 %%
```
