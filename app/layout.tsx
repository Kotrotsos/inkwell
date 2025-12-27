import type React from "react"
import type { Metadata, Viewport } from "next"
import { Source_Serif_4, Geist_Mono, Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const _sourceSerif = Source_Serif_4({ subsets: ["latin"], variable: "--font-source-serif" })
const _geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" })
const _inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

export const metadata: Metadata = {
  title: "Inkwell — Markdown Editor",
  description: "A distraction-free markdown editor with inline editing",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="bg-background" suppressHydrationWarning>
      <body className={`antialiased ${_sourceSerif.variable} ${_geistMono.variable} ${_inter.variable}`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
