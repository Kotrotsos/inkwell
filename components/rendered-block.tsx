"use client"

import type React from "react"

import type { Block } from "@/lib/markdown-parser"

interface RenderedBlockProps {
  block: Block
}

function parseInlineMarkdown(text: string): React.ReactNode {
  const parts: React.ReactNode[] = []
  let remaining = text
  let key = 0

  while (remaining.length > 0) {
    const imageRegex = /^!\[([^\]]*)\]$$([^)]+)$$/
    const imageMatch = remaining.match(imageRegex)
    if (imageMatch) {
      parts.push(
        <img
          key={key++}
          src={imageMatch[2] || "/placeholder.svg"}
          alt={imageMatch[1]}
          className="max-w-full h-auto rounded-lg my-2"
          onClick={(e) => e.stopPropagation()}
        />,
      )
      remaining = remaining.slice(imageMatch[0].length)
      continue
    }

    // Bold
    const boldMatch = remaining.match(/^\*\*(.+?)\*\*/)
    if (boldMatch) {
      parts.push(
        <strong key={key++} className="font-semibold">
          {parseInlineMarkdown(boldMatch[1])}
        </strong>,
      )
      remaining = remaining.slice(boldMatch[0].length)
      continue
    }

    // Italic
    const italicMatch = remaining.match(/^\*(.+?)\*/)
    if (italicMatch) {
      parts.push(
        <em key={key++} className="italic">
          {parseInlineMarkdown(italicMatch[1])}
        </em>,
      )
      remaining = remaining.slice(italicMatch[0].length)
      continue
    }

    // Inline code
    const codeMatch = remaining.match(/^`([^`]+)`/)
    if (codeMatch) {
      parts.push(
        <code key={key++} className="px-1.5 py-0.5 bg-muted rounded text-sm font-mono">
          {codeMatch[1]}
        </code>,
      )
      remaining = remaining.slice(codeMatch[0].length)
      continue
    }

    const linkRegex = /^\[([^\]]+)\]$$([^)]+)$$/
    const linkMatch = remaining.match(linkRegex)
    if (linkMatch) {
      parts.push(
        <a
          key={key++}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-foreground underline underline-offset-2 hover:text-muted-foreground transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          {linkMatch[1]}
        </a>,
      )
      remaining = remaining.slice(linkMatch[0].length)
      continue
    }

    const nextSpecial = remaining.search(/[*`[!]/)
    if (nextSpecial === -1) {
      parts.push(remaining)
      break
    } else if (nextSpecial === 0) {
      parts.push(remaining[0])
      remaining = remaining.slice(1)
    } else {
      parts.push(remaining.slice(0, nextSpecial))
      remaining = remaining.slice(nextSpecial)
    }
  }

  return parts.length === 1 ? parts[0] : parts
}

export function RenderedBlock({ block }: RenderedBlockProps) {
  if (block.type === "image") {
    return (
      <figure className="my-4">
        <img
          src={block.content || "/placeholder.svg"}
          alt={block.language || ""}
          className="max-w-full h-auto rounded-lg"
        />
        {block.language && (
          <figcaption className="text-sm text-muted-foreground mt-2 text-center">{block.language}</figcaption>
        )}
      </figure>
    )
  }

  switch (block.type) {
    case "h1":
      return (
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground leading-tight">
          {parseInlineMarkdown(block.content)}
        </h1>
      )
    case "h2":
      return (
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground mt-8 first:mt-0">
          {parseInlineMarkdown(block.content)}
        </h2>
      )
    case "h3":
      return (
        <h3 className="text-xl md:text-2xl font-medium text-foreground mt-6 first:mt-0">
          {parseInlineMarkdown(block.content)}
        </h3>
      )
    case "paragraph":
      if (!block.content.trim()) {
        return null
      }
      return <p className="text-foreground">{parseInlineMarkdown(block.content)}</p>
    case "blockquote":
      return (
        <blockquote className="border-l-2 border-foreground/20 pl-4 italic text-muted-foreground">
          {parseInlineMarkdown(block.content)}
        </blockquote>
      )
    case "code":
      return (
        <div className="relative">
          {block.language && (
            <span className="absolute top-2 right-3 text-xs text-muted-foreground/60 font-mono">{block.language}</span>
          )}
          <pre className="bg-muted/70 rounded-lg p-4 overflow-x-auto">
            <code className="text-sm font-mono text-foreground">{block.content}</code>
          </pre>
        </div>
      )
    case "list":
      const items = block.content.split("\n").filter(Boolean)
      return (
        <ul className="space-y-2">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="text-muted-foreground mt-1.5">•</span>
              <span>{parseInlineMarkdown(item)}</span>
            </li>
          ))}
        </ul>
      )
    case "hr":
      return <hr className="border-t border-border my-8" />
    default:
      return <p className="text-foreground">{parseInlineMarkdown(block.content)}</p>
  }
}
