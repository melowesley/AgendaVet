'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  PawPrint,
  Users,
  Calendar,
  FileText,
  MessageSquare,
  Settings,
  Stethoscope,
  BarChart3,
  ShoppingBag,
  Bot,
} from 'lucide-react'
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
  { title: 'Visão Geral', href: '/', icon: LayoutDashboard },
  { title: 'Pacientes', href: '/pets', icon: PawPrint },
  { title: 'Tutores', href: '/owners', icon: Users },
  { title: 'Agenda', href: '/appointments', icon: Calendar },
  { title: 'Prontuários', href: '/medical-records', icon: FileText },
  { title: 'Analytics', href: '/analytics', icon: BarChart3 },
  { title: 'Produtos & Serviços', href: '/products-services', icon: ShoppingBag },
  { title: 'Assistente IA', href: '/assistant', icon: MessageSquare },
  { title: 'AI Control Tower', href: '/ai-control', icon: Bot },
  { title: 'Área do Tutor (App)', href: 'https://agendavet-tutor.vercel.app', icon: Users, external: true },
  { title: 'Área do Vet (App)', href: 'https://agendavet-vet.vercel.app', icon: Stethoscope, external: true },
]

const bottomNavItems = [
  { title: 'Configurações', href: '/settings', icon: Settings },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { setOpenMobile } = useSidebar()

  const handleNavClick = () => {
    setOpenMobile(false)
  }

  return (
    <Sidebar className="border-r border-sidebar-border/50 bg-sidebar/80 backdrop-blur-md">
      <SidebarHeader className="border-b border-sidebar-border/50 px-4 py-4">
        <Link
          href="/"
          className="flex items-center gap-3 transition-opacity hover:opacity-80"
          onClick={handleNavClick}
        >
          <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <PawPrint className="size-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">AgendaVet</span>
            <span className="text-xs font-medium text-sidebar-foreground/60">Gestão Veterinária</span>
          </div>

        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5 px-2 py-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href ||
                  (item.href !== '/' && pathname.startsWith(item.href))
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className={`h-10 transition-all duration-200 ${isActive ? 'bg-gradient-to-r from-emerald-500/15 to-transparent border-l-2 border-emerald-500 text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/20' : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent'}`}
                    >
                      <Link
                        href={item.href}
                        onClick={handleNavClick}
                        target={item.external ? "_blank" : undefined}
                        rel={item.external ? "noopener noreferrer" : undefined}
                      >
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
                const isActive = pathname === item.href ||
                  (item.href !== '/' && pathname.startsWith(item.href))
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className={`h-10 transition-all duration-200 ${isActive ? 'bg-gradient-to-r from-emerald-500/15 to-transparent border-l-2 border-emerald-500 text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/20' : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent'}`}
                    >
                      <Link href={item.href} onClick={handleNavClick}>
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarFooter>
    </Sidebar>
  )
}
