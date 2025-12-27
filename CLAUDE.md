# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Inkwell is a distraction-free markdown editor built with Next.js 16 and React 19. It features inline WYSIWYG editing where users click on rendered markdown elements to edit them directly. All data persists locally via IndexedDB.

## Commands

```bash
npm run dev      # Start dev server at http://localhost:3000
npm run build    # Production build (ignores TS errors, see next.config.mjs)
npm run lint     # ESLint
npm start        # Serve production build
```

Note: `pnpm-lock.yaml` is present but sparse; npm is the primary package manager.

## Architecture

### Core Data Flow

The app uses a block-based editing model:

1. **Markdown Parser** (`lib/markdown-parser.ts`): Converts raw markdown into `Block[]` array. Each block has a type (h1, h2, h3, paragraph, blockquote, code, list, hr, image), content, and raw source.

2. **InlineMarkdownEditor** (`components/inline-markdown-editor.tsx`): Main editor component. Manages block state, handles document selection, auto-saves to IndexedDB with 300ms debounce, and extracts document titles from first h1/h2 heading.

3. **EditableBlock** (`components/editable-block.tsx`): Wraps each block. Handles three edit modes:
   - `quick`: Click to edit individual blocks (default)
   - `edit`: All blocks show as editable textareas
   - `read`: View-only mode

4. **RenderedBlock** (`components/rendered-block.tsx`): Renders parsed markdown blocks to React elements. Handles inline markdown parsing (bold, italic, code, links, images).

### Storage Layer

Two IndexedDB databases in `lib/`:

- **settings-db.ts**: Editor preferences (font, size, line height, theme, width)
- **documents-db.ts**: Documents, folders, and sidebar state

### Component Structure

```
components/
  inline-markdown-editor.tsx  # Main editor orchestrator
  editable-block.tsx          # Click-to-edit block wrapper
  rendered-block.tsx          # Markdown to React renderer
  insert-zone.tsx             # Block insertion UI
  document-sidebar.tsx        # Left sidebar with document/folder tree
  settings-panel.tsx          # Settings dropdown
  edit-mode-toggle.tsx        # Quick/Edit/Read mode switcher
  ui/                         # shadcn/ui primitives (new-york style)
```

### Styling

- Tailwind CSS v4 with `@tailwindcss/postcss`
- CSS variables for theming defined in `app/globals.css` (oklch color space)
- Light/dark mode via `.dark` class on `<html>`
- Three font families available: serif (Source Serif 4), sans (Inter), mono (Geist Mono)

## Key Patterns

- All editor components are client-side (`"use client"`)
- Document titles auto-update from first h1/h2 heading
- Sidebar state (open/pinned) persists in IndexedDB
- Images are unoptimized (static in `public/`)
- Use `@/*` path alias for imports (e.g., `@/lib/utils`)
- shadcn/ui components use `cn()` from `@/lib/utils` for class merging

## Style Guidelines

- Never use serif fonts unless explicitly requested
- Avoid icons and emojis unless clearly stated
- Never use em-dashes in text content, use commas instead
