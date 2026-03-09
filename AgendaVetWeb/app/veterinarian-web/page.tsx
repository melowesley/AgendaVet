import Link from 'next/link';

export default function VetWeb() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              🩺 AgendaVet Veterinário
            </h1>
            <p className="text-gray-600">
              Versão web limitada - Baixe o app para acesso completo
            </p>
          </div>

          <div className="space-y-4 mb-8">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 mb-2">Funcionalidades Web:</h3>
              <ul className="text-sm text-green-700 space-y-1">
                <li>✅ Visualizar pacientes e tutores</li>
                <li>✅ Ver histórico médico</li>
                <li>✅ Agendar consultas</li>
                <li>✅ Assistência básica com IA (limitada)</li>
                <li>❌ Recursos offline avançados (requer app)</li>
                <li>❌ Funcionalidades de emergência (requer app)</li>
              </ul>
            </div>
          </div>

          <div className="space-y-4">
            <Link
              href="https://play.google.com/store/apps/details?id=com.agendavet.vet"
              className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              📱 Baixar App Android
            </Link>

            <Link
              href="https://apps.apple.com/store/apps/details?id=com.agendavet.vet"
              className="inline-block bg-gray-800 hover:bg-gray-900 text-white font-semibold py-3 px-6 rounded-lg transition-colors ml-4"
            >
              🍎 Baixar App iOS
            </Link>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <Link
              href="/"
              className="text-green-600 hover:text-green-800 font-medium"
            >
              ← Voltar ao AgendaVet Web
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
