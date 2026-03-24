import Link from 'next/link'
import { PawPrint } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="text-center max-w-md w-full">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-900/30">
            <PawPrint className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>

        <h1 className="text-4xl font-bold tracking-tight mb-3">AgendaVet</h1>
        <p className="text-muted-foreground mb-10">
          Gestão veterinária simples e eficiente. Escolha como deseja acessar.
        </p>

        <div className="flex flex-col gap-4">
          <Button asChild size="lg" className="bg-emerald-600 hover:bg-emerald-700 h-14 text-base">
            <Link href="/login/vet">Sou Secretário / Veterinário</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-14 text-base">
            <Link href="/login/tutor">Sou Tutor</Link>
          </Button>
          <Button asChild size="lg" variant="ghost" className="h-12 text-sm text-muted-foreground">
            <Link href="/login">Já tenho conta (acesso direto)</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
