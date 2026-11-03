import { useState, useEffect } from "react"
import { Wifi, WifiOff, Bell, Calendar } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface NavbarProps {
  title: string
  subtitle?: string
}

export function Navbar({ title, subtitle }: NavbarProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [currentDate, setCurrentDate] = useState("")

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    const now = new Date()
    setCurrentDate(
      new Intl.DateTimeFormat("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(now)
    )

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  return (
    <header className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between shrink-0">
      <div>
        <h2 className="text-xl font-bold text-slate-800 leading-tight">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {/* Network & Offline Readiness Indicator */}
        <div className="flex items-center gap-2">
          {isOnline ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <Wifi className="h-3.5 w-3.5" />
              <span>En ligne (Sync active)</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium">
              <WifiOff className="h-3.5 w-3.5" />
              <span>Mode Hors-ligne (File d'attente locale)</span>
            </div>
          )}
        </div>

        {/* Current Date */}
        <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 border-l border-slate-200 pl-4">
          <Calendar className="h-4 w-4 text-slate-400" />
          <span className="capitalize">{currentDate}</span>
        </div>
      </div>
    </header>
  )
}
