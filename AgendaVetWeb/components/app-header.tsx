'use client'

import { Menu, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Breadcrumb,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { useSidebar } from '@/components/ui/sidebar'
import { Input } from '@/components/ui/input'
import { useTheme } from 'next-themes'
import { Sun, Moon } from 'lucide-react'

interface AppHeaderProps {
  breadcrumbs?: { label: string; href?: string }[]
}

export function AppHeader({ breadcrumbs = [] }: AppHeaderProps) {
  const { toggleSidebar, isMobile } = useSidebar()
  const { theme, setTheme } = useTheme()
  const router = useRouter()

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-border/50 bg-background/80 backdrop-blur-md px-4 md:px-6 shadow-sm">
      {isMobile && (
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden text-foreground hover:bg-accent hover:text-accent-foreground"
          onClick={toggleSidebar}
          aria-label="Toggle menu"
        >
          <Menu className="size-5" />
        </Button>
      )}

      <div className="flex items-center gap-1 mr-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full hover:bg-accent"
          onClick={() => router.back()}
          title="Voltar"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full hover:bg-accent"
          onClick={() => router.forward()}
          title="Avançar"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>

      <Breadcrumb className="hidden md:flex flex-1">
        <BreadcrumbList>
          <BreadcrumbLink href="/" className="font-semibold text-primary">
            AgendaVet
          </BreadcrumbLink>

          {breadcrumbs.map((crumb, index) => (
            <span key={crumb.label} className="contents">
              <BreadcrumbSeparator className="text-muted-foreground" />
              {index === breadcrumbs.length - 1 || !crumb.href ? (
                <BreadcrumbPage className="text-foreground">{crumb.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink href={crumb.href} className="text-muted-foreground">{crumb.label}</BreadcrumbLink>
              )}
            </span>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-1 items-center justify-end gap-2 md:gap-6">
        {/* Botão tema - visível em mobile também */}
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full shrink-0"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        <div className="relative w-full max-w-[300px] hidden sm:block">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar pacientes, agendamentos..."
            className="w-full rounded-full bg-muted/50 pl-9 pr-12 text-sm border-border/50 focus-visible:ring-emerald-500"
          />
          <kbd className="pointer-events-none absolute right-2.5 top-2.5 hidden h-5 select-none items-center gap-1 rounded border border-border/50 bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 sm:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </div>
      </div>
    </header>
  )
}
