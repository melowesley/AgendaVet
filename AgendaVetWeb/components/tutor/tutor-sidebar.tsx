'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard,
  PawPrint,
  Calendar,
  DollarSign,
  User,
  Settings,
  LogOut,
  MessageSquare,
  HeartPulse,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'

const navItems = [
  { title: 'Início', href: '/tutor/dashboard', icon: LayoutDashboard },
  { title: 'Meus Pets', href: '/tutor/pets', icon: PawPrint },
  { title: 'Agendamentos', href: '/tutor/agendamentos', icon: Calendar },
  { title: 'Financeiro', href: '/tutor/financeiro', icon: DollarSign },
  { title: 'Chat IA', href: '/tutor/chat', icon: MessageSquare },
]

const bottomNavItems = [
  { title: 'Perfil', href: '/tutor/perfil', icon: User },
  { title: 'Configurações', href: '/tutor/configuracoes', icon: Settings },
]

export function TutorSidebar() {
  const pathname = usePathname()
  const { setOpenMobile } = useSidebar()
  const [tutorName, setTutorName] = useState<string | null>(null)

  useEffect(() => {
    const fetchTutor = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const name = session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || null
        setTutorName(name)
      }
    }
    fetchTutor()
  }, [])

  const handleNavClick = () => {
    setOpenMobile(false)
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/tutor/login'
  }

  return (
    <Sidebar className="border-r border-sidebar-border/50 bg-sidebar/80 backdrop-blur-md">
      <SidebarHeader className="border-b border-sidebar-border/50 px-4 py-4">
        <Link
          href="/tutor/dashboard"
          className="flex items-center gap-3 transition-opacity hover:opacity-80"
          onClick={handleNavClick}
        >
          <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <HeartPulse className="size-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">AgendaVet</span>
            <span className="text-xs font-medium text-sidebar-foreground/60">Área do Tutor</span>
          </div>
        </Link>

        {tutorName && (
          <div className="mt-3 flex items-center gap-2 px-1">
            <div className="flex size-7 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-500 text-xs font-bold">
              {tutorName.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs text-sidebar-foreground/70 truncate">{tutorName}</span>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5 px-2 py-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href ||
                  (item.href !== '/tutor/dashboard' && pathname.startsWith(item.href))
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className={`h-10 transition-all duration-200 text-sm ${isActive
                        ? 'bg-gradient-to-r from-emerald-500/15 to-transparent border-l-2 border-emerald-500 text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/20'
                        : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent'
                      }`}
                    >
                      <Link href={item.href} onClick={handleNavClick}>
                        <item.icon className={`size-4 ${isActive ? 'text-emerald-500' : ''}`} />
                        <span className={isActive ? 'font-medium' : ''}>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/50">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="px-2 py-2">
              {bottomNavItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href)
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className={`h-10 transition-all duration-200 text-sm ${isActive
                        ? 'bg-gradient-to-r from-emerald-500/15 to-transparent border-l-2 border-emerald-500 text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/20'
                        : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent'
                      }`}
                    >
                      <Link href={item.href} onClick={handleNavClick}>
                        <item.icon className={`size-4 ${isActive ? 'text-emerald-500' : ''}`} />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={handleLogout}
                  className="h-10 transition-all duration-200 text-sm text-sidebar-foreground/70 hover:text-red-500 hover:bg-red-500/10 cursor-pointer"
                >
                  <LogOut className="size-4" />
                  <span>Sair</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarFooter>
    </Sidebar>
  )
}
