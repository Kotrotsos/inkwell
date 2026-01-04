# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Inkwell is a distraction-free markdown editor built with Next.js 16 and React 19. It features full-document inline editing where users click on the rendered content to edit the raw markdown directly in a textarea. Data persists locally via IndexedDB with optional cloud sync for authenticated users via PostgreSQL.

## Commands

```bash
npm run dev      # Start dev server at http://localhost:3000
npm run build    # Production build (ignores TS errors, see next.config.mjs)
npm run lint     # ESLint
npm start        # Serve production build
```

Note: `pnpm-lock.yaml` is present but sparse; npm is the primary package manager.

## Environment Variables

Required for cloud features:
- `DATABASE_URL`: PostgreSQL connection string for Prisma
- Clerk environment variables for authentication (see Clerk docs)

## Architecture

### Core Data Flow

The app uses a block-based rendering model with full-document editing:

1. **Markdown Parser** (`lib/markdown-parser.ts`): Converts raw markdown into `Block[]` array. Each block has a type (heading, paragraph, blockquote, code, list, hr, image, table), content, and raw source.

2. **InlineMarkdownEditor** (`components/inline-markdown-editor.tsx`): Main editor component. Click anywhere on the rendered content to switch to a full-document textarea for editing. Auto-saves to IndexedDB with 300ms debounce, extracts document titles from first h1/h2 heading, and manages URL hash-based document routing.

3. **RenderedBlock** (`components/rendered-block.tsx`): Renders parsed markdown blocks to React elements. Handles inline markdown parsing (bold, italic, code, links, images).

### Storage Layer

**Local Storage (IndexedDB):**
Three databases in `lib/`:
- **documents-db.ts**: Documents, folders, sidebar state, and sync metadata
- **settings-db.ts**: Editor preferences (font, size, line height, theme, width, background color)
- **media-db.ts**: Uploaded media files stored as base64 data URLs

**Cloud Storage (PostgreSQL via Prisma):**
- `prisma/schema.prisma`: Defines User, Document, Folder, Media, and Settings models
- `lib/prisma.ts`: Prisma client with PrismaPg adapter for connection pooling
- `lib/sync.ts`: Bidirectional sync between IndexedDB and PostgreSQL

### Authentication

Uses **Clerk** for authentication:
- `@clerk/nextjs` wraps the app in `ClerkProvider`
- API routes use `auth()` from `@clerk/nextjs/server` to get `userId`
- `components/auth/user-menu.tsx`: Sign in button, user avatar, and sync button

### API Routes

```
app/api/
  documents/
    route.ts              # GET (list), POST (create)
    [id]/
      route.ts            # GET, PUT, DELETE
      share/route.ts      # POST (generate share link)
  folders/
    route.ts              # GET (list), POST (create)
    [id]/route.ts         # GET, PUT, DELETE
  media/
    route.ts              # GET (list), POST (upload)
    [id]/route.ts         # GET, DELETE
  settings/route.ts       # GET, PUT
  share/[shareId]/route.ts  # GET (public, no auth required)
```

### Document Sharing

- Authenticated users can share documents via unique `shareId`
- Share links use URL hash format: `https://app.com/#<shareId>`
- Documents without a `serverId` are auto-synced before sharing
- Shared documents are read-only for viewers

### Component Structure

```
components/
  inline-markdown-editor.tsx  # Main editor orchestrator
  rendered-block.tsx          # Markdown to React renderer
  editable-block.tsx          # Legacy block wrapper (unused in current flow)
  document-sidebar.tsx        # Left sidebar with document/folder tree
  settings-panel.tsx          # Settings dropdown
  media-manager.tsx           # Upload and manage images
  editor-context-menu.tsx     # Right-click menu for inserting links/images
  auth/
    user-menu.tsx             # Clerk auth UI and sync button
  ui/                         # shadcn/ui primitives (new-york style)
```

### Styling

- Tailwind CSS v4 with `@tailwindcss/postcss`
- CSS variables for theming defined in `app/globals.css` (oklch color space)
- Light/dark mode via `.dark` class on `<html>`, controlled by settings
- Three font families: serif (Source Serif 4), sans (Inter), mono (Geist Mono)
- Three background colors: gray, warm, cool

## Key Patterns

- All editor components are client-side (`"use client"`)
- Document titles auto-update from first h1/h2 heading
- URL hash reflects current document ID for shareable URLs
- Sidebar state (open/pinned) persists in IndexedDB
- Images are unoptimized (`next.config.mjs` sets `images.unoptimized: true`)
- TypeScript errors are ignored in production builds (`typescript.ignoreBuildErrors: true`)
- Use `@/*` path alias for imports (e.g., `@/lib/utils`)
- shadcn/ui components use `cn()` from `@/lib/utils` for class merging

### Sync Model

Documents and folders have sync metadata:
- `serverId`: Cloud database ID (null if never synced)
- `syncStatus`: 'synced' | 'pending' | 'conflict'
- `lastSyncedAt`: Timestamp of last successful sync

Sync flow:
1. Local changes mark document as `pending`
2. User clicks "Sync" button in UserMenu
3. `fullSync()` pushes pending changes, then pulls server updates
4. On login, `onLogin()` syncs from server then to server
5. On logout, `onLogout()` clears local data

## Style Guidelines

- Never use serif fonts in UI unless explicitly requested
- Avoid icons and emojis unless clearly stated
- Never use em-dashes in text content, use commas instead
