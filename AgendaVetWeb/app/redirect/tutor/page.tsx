'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function TutorRedirect() {
  const [isAppInstalled, setIsAppInstalled] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAppInstallation = async () => {
      if (typeof window !== 'undefined') {
        // Verificar se está em dispositivo mobile
        const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        if (!isMobile) {
          // Desktop: redirecionar para versão web
          router.push('/tutor-web');
          return;
        }

        // Mobile: tentar abrir app
        const appScheme = 'agendavettutorapp://';
        const appStoreUrl = 'https://play.google.com/store/apps/details?id=com.agendavet.tutor';
        const webUrl = `${window.location.origin}/tutor-web`;

        try {
          // Tentar abrir app
          window.location.href = appScheme;

          // Se não conseguir abrir, redirecionar para store após timeout
          setTimeout(() => {
            window.location.href = appStoreUrl;
          }, 2000);
        } catch (error) {
          // Fallback para web
          window.location.href = webUrl;
        }
      }
    };

    checkAppInstallation();
  }, [router]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Abrindo AgendaVet Tutor</h2>
          <p className="text-gray-600">Se o app não abrir automaticamente, você será redirecionado para a loja.</p>
        </div>
      </div>
    );
  }

  return null;
}
