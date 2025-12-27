"use client"

import { useState, useEffect, useRef } from "react"
import { Settings, X } from "lucide-react"
import { type EditorSettings, defaultSettings, saveSettings, loadSettings } from "@/lib/settings-db"

interface SettingsPanelProps {
  onSettingsChange: (settings: EditorSettings) => void
}

export function SettingsPanel({ onSettingsChange }: SettingsPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [settings, setSettings] = useState<EditorSettings>(defaultSettings)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadSettings().then((loaded) => {
      setSettings(loaded)
      onSettingsChange(loaded)
    })
  }, [onSettingsChange])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  const updateSetting = <K extends keyof EditorSettings>(key: K, value: EditorSettings[K]) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    onSettingsChange(newSettings)
    saveSettings(newSettings)
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/50 transition-colors"
        aria-label="Open settings"
      >
        <Settings className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-card border border-border rounded-xl shadow-lg p-4 z-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-foreground">Settings</h3>
            <button onClick={() => setIsOpen(false)} className="p-1 rounded hover:bg-muted transition-colors">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Font Family */}
            <div>
              <label className="block text-sm text-muted-foreground mb-2">Font</label>
              <div className="flex gap-1">
                {(["serif", "sans", "mono"] as const).map((font) => (
                  <button
                    key={font}
                    onClick={() => updateSetting("fontFamily", font)}
                    className={`flex-1 px-3 py-2 text-sm rounded-lg transition-colors capitalize ${
                      settings.fontFamily === font
                        ? "bg-foreground text-background"
                        : "bg-muted/50 text-foreground hover:bg-muted"
                    }`}
                  >
                    {font}
                  </button>
                ))}
              </div>
            </div>

            {/* Font Size */}
            <div>
              <label className="block text-sm text-muted-foreground mb-2">Size</label>
              <div className="flex gap-1">
                {(["small", "medium", "large"] as const).map((size) => (
                  <button
                    key={size}
                    onClick={() => updateSetting("fontSize", size)}
                    className={`flex-1 px-3 py-2 text-sm rounded-lg transition-colors capitalize ${
                      settings.fontSize === size
                        ? "bg-foreground text-background"
                        : "bg-muted/50 text-foreground hover:bg-muted"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Line Height */}
            <div>
              <label className="block text-sm text-muted-foreground mb-2">Line Height</label>
              <div className="flex gap-1">
                {(["compact", "normal", "relaxed"] as const).map((height) => (
                  <button
                    key={height}
                    onClick={() => updateSetting("lineHeight", height)}
                    className={`flex-1 px-3 py-2 text-sm rounded-lg transition-colors capitalize ${
                      settings.lineHeight === height
                        ? "bg-foreground text-background"
                        : "bg-muted/50 text-foreground hover:bg-muted"
                    }`}
                  >
                    {height}
                  </button>
                ))}
              </div>
            </div>

            {/* Content Width */}
            <div>
              <label className="block text-sm text-muted-foreground mb-2">Width</label>
              <div className="flex gap-1">
                {(["default", "wide", "full"] as const).map((width) => (
                  <button
                    key={width}
                    onClick={() => updateSetting("contentWidth", width)}
                    className={`flex-1 px-3 py-2 text-sm rounded-lg transition-colors capitalize ${
                      settings.contentWidth === width
                        ? "bg-foreground text-background"
                        : "bg-muted/50 text-foreground hover:bg-muted"
                    }`}
                  >
                    {width}
                  </button>
                ))}
              </div>
            </div>

            {/* Theme */}
            <div>
              <label className="block text-sm text-muted-foreground mb-2">Theme</label>
              <div className="flex gap-1">
                {(["light", "dark", "system"] as const).map((theme) => (
                  <button
                    key={theme}
                    onClick={() => updateSetting("theme", theme)}
                    className={`flex-1 px-3 py-2 text-sm rounded-lg transition-colors capitalize ${
                      settings.theme === theme
                        ? "bg-foreground text-background"
                        : "bg-muted/50 text-foreground hover:bg-muted"
                    }`}
                  >
                    {theme}
                  </button>
                ))}
              </div>
            </div>

            {/* Background Color */}
            <div>
              <label className="block text-sm text-muted-foreground mb-2">Background</label>
              <div className="flex gap-2">
                {(
                  [
                    { value: "default", color: "bg-background", label: "Default" },
                    { value: "gray", color: "bg-[#DDDDE3]", label: "Gray" },
                    { value: "warm", color: "bg-[#E8E4DF]", label: "Warm" },
                    { value: "cool", color: "bg-[#DEE3E8]", label: "Cool" },
                  ] as const
                ).map((bg) => (
                  <button
                    key={bg.value}
                    onClick={() => updateSetting("backgroundColor", bg.value)}
                    className={`flex-1 flex flex-col items-center gap-1.5 p-2 rounded-lg transition-colors ${
                      settings.backgroundColor === bg.value
                        ? "ring-2 ring-foreground"
                        : "hover:bg-muted/50"
                    }`}
                    title={bg.label}
                  >
                    <div className={`w-6 h-6 rounded-full ${bg.color} border border-border`} />
                    <span className="text-xs text-muted-foreground">{bg.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
