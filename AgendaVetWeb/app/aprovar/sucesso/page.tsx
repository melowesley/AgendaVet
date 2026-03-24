import { CheckCircle, PawPrint } from 'lucide-react'

export default function AprovarSucessoPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow p-8 text-center">
        <div className="flex items-center gap-2 mb-6 justify-center">
          <PawPrint className="h-6 w-6 text-emerald-600" />
          <span className="font-bold text-lg">AgendaVet</span>
        </div>
        <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Acesso aprovado!</h2>
        <p className="text-muted-foreground text-sm">
          O secretário já pode fazer login e acessar o sistema.
        </p>
      </div>
    </div>
  )
}
