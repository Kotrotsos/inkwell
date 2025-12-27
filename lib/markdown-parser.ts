export interface Block {
  id: string
  type: "h1" | "h2" | "h3" | "paragraph" | "blockquote" | "code" | "list" | "hr" | "image"
  content: string
  raw: string
  language?: string
}

export function parseMarkdownToBlocks(markdown: string): Block[] {
  const lines = markdown.split("\n")
  const blocks: Block[] = []
  let i = 0
  let blockId = 0

  while (i < lines.length) {
    const line = lines[i]

    // Skip empty lines
    if (line.trim() === "") {
      i++
      continue
    }

    const imageRegex = /^!\[([^\]]*)\]$$([^)]+)$$$/
    const imageMatch = line.match(imageRegex)
    if (imageMatch) {
      blocks.push({
        id: `block-${blockId++}`,
        type: "image",
        content: imageMatch[2], // URL
        raw: line,
        language: imageMatch[1], // Alt text stored in language field
      })
      i++
      continue
    }

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      blocks.push({
        id: `block-${blockId++}`,
        type: "hr",
        content: "",
        raw: line,
      })
      i++
      continue
    }

    // Headers
    const h1Match = line.match(/^# (.+)$/)
    if (h1Match) {
      blocks.push({
        id: `block-${blockId++}`,
        type: "h1",
        content: h1Match[1],
        raw: line,
      })
      i++
      continue
    }

    const h2Match = line.match(/^## (.+)$/)
    if (h2Match) {
      blocks.push({
        id: `block-${blockId++}`,
        type: "h2",
        content: h2Match[1],
        raw: line,
      })
      i++
      continue
    }

    const h3Match = line.match(/^### (.+)$/)
    if (h3Match) {
      blocks.push({
        id: `block-${blockId++}`,
        type: "h3",
        content: h3Match[1],
        raw: line,
      })
      i++
      continue
    }

    // Code blocks
    const codeMatch = line.match(/^```(\w*)$/)
    if (codeMatch) {
      const language = codeMatch[1] || undefined
      const codeLines: string[] = []
      const rawLines: string[] = [line]
      i++

      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i])
        rawLines.push(lines[i])
        i++
      }

      if (i < lines.length) {
        rawLines.push(lines[i])
        i++
      }

      blocks.push({
        id: `block-${blockId++}`,
        type: "code",
        content: codeLines.join("\n"),
        raw: rawLines.join("\n"),
        language,
      })
      continue
    }

    // Blockquote
    const blockquoteMatch = line.match(/^> (.+)$/)
    if (blockquoteMatch) {
      blocks.push({
        id: `block-${blockId++}`,
        type: "blockquote",
        content: blockquoteMatch[1],
        raw: line,
      })
      i++
      continue
    }

    // List items
    const listMatch = line.match(/^[-*] (.+)$/)
    if (listMatch) {
      const listItems: string[] = [listMatch[1]]
      const rawLines: string[] = [line]
      i++

      while (i < lines.length) {
        const nextListMatch = lines[i].match(/^[-*] (.+)$/)
        if (nextListMatch) {
          listItems.push(nextListMatch[1])
          rawLines.push(lines[i])
          i++
        } else if (lines[i].trim() === "") {
          i++
          break
        } else {
          break
        }
      }

      blocks.push({
        id: `block-${blockId++}`,
        type: "list",
        content: listItems.join("\n"),
        raw: rawLines.join("\n"),
      })
      continue
    }

    // Paragraph (default)
    const paragraphLines: string[] = [line]
    i++

    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].match(/^#{1,3} /) &&
      !lines[i].match(/^[-*] /) &&
      !lines[i].match(/^> /) &&
      !lines[i].match(/^```/) &&
      !lines[i].match(/^!\[/) && // Don't merge image lines into paragraphs
      !lines[i].match(/^(-{3,}|\*{3,}|_{3,})$/)
    ) {
      paragraphLines.push(lines[i])
      i++
    }

    blocks.push({
      id: `block-${blockId++}`,
      type: "paragraph",
      content: paragraphLines.join(" "),
      raw: paragraphLines.join("\n"),
    })
  }

  return blocks
}
