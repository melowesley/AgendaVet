'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Download, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export function PWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showInstallDialog, setShowInstallDialog] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Verificar se já está instalado
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // Capturar evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)
      // Mostrar dialog após 2 segundos
      setTimeout(() => setShowInstallDialog(true), 2000)
    }

    // Verificar se foi instalado
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setDeferredPrompt(null)
      setShowInstallDialog(false)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null)
    }
    setShowInstallDialog(false)
  }

  const handleDismiss = () => {
    setShowInstallDialog(false)
    // Não mostrar novamente por 7 dias
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())
  }

  // Verificar se foi dispensado recentemente
  const wasDismissed = () => {
    const dismissed = localStorage.getItem('pwa-install-dismissed')
    if (!dismissed) return false
    
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
    return parseInt(dismissed) > sevenDaysAgo
  }

  if (isInstalled || !deferredPrompt || wasDismissed()) {
    return null
  }

  return (
    <Dialog open={showInstallDialog} onOpenChange={setShowInstallDialog}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="size-5 text-emerald-500" />
            Instalar AgendaVet
          </DialogTitle>
          <DialogDescription>
            Instale o AgendaVet como um aplicativo no seu dispositivo para acesso rápido 
            e experiência offline.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            • Acesso rápido da tela inicial<br/>
            • Funciona offline<br/>
            • Sem barra de endereço
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleDismiss}>
              <X className="size-4 mr-1" />
              Agora não
            </Button>
            <Button onClick={handleInstall} className="bg-emerald-500 hover:bg-emerald-600">
              <Download className="size-4 mr-1" />
              Instalar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
