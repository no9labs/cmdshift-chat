"use client"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Sun, Moon, Monitor, Check } from "lucide-react"
import { useTheme } from "@/hooks/useTheme"

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()

  const getThemeIcon = () => {
    switch (theme) {
      case "light":
        return <Sun className="size-4" />
      case "dark":
        return <Moon className="size-4" />
      case "system":
        return <Monitor className="size-4" />
      default:
        return <Monitor className="size-4" />
    }
  }

  const themes = [
    {
      value: "light" as const,
      label: "Light",
      icon: Sun,
    },
    {
      value: "dark" as const,
      label: "Dark",
      icon: Moon,
    },
    {
      value: "system" as const,
      label: "System",
      icon: Monitor,
    },
  ]

  return (
    <div className={className}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-900 shadow-sm dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-900"
          >
          {getThemeIcon()}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 shadow-lg"
      >
        {themes.map((themeOption) => {
          const IconComponent = themeOption.icon
          return (
            <DropdownMenuItem
              key={themeOption.value}
              onClick={() => setTheme(themeOption.value)}
              className="flex items-center gap-2 text-zinc-900 dark:text-zinc-50 hover:!bg-zinc-100 dark:hover:!bg-zinc-900 cursor-pointer"
            >
              <IconComponent className="size-4" />
              <span>{themeOption.label}</span>
              {theme === themeOption.value && <Check className="size-4 ml-auto text-zinc-900 dark:text-zinc-50" />}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
    </div>
  )
}
