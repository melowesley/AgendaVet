import Link from 'next/link';

export default function AppsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              📱 AgendaVet Apps
            </h1>
            <p className="text-xl text-gray-600">
              Baixe nossos aplicativos móveis para uma experiência completa
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* App Tutor */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="text-center mb-6">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🐾</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">AgendaVet Tutor</h2>
                <p className="text-gray-600">Para tutores de pets</p>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm text-gray-700">
                  <span className="text-green-500 mr-2">✅</span>
                  Gerencie seus pets
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <span className="text-green-500 mr-2">✅</span>
                  Agende consultas
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <span className="text-green-500 mr-2">✅</span>
                  Acompanhe histórico médico
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <span className="text-green-500 mr-2">✅</span>
                  Receba notificações
                </div>
              </div>

              <div className="space-y-3">
                <Link
                  href="https://play.google.com/store/apps/details?id=com.agendavet.tutor"
                  className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg text-center transition-colors"
                >
                  📱 Download Android
                </Link>
                <Link
                  href="https://apps.apple.com/app/agendavet-tutor"
                  className="block w-full bg-gray-800 hover:bg-gray-900 text-white font-semibold py-3 px-6 rounded-lg text-center transition-colors"
                >
                  🍎 Download iOS
                </Link>
              </div>
            </div>

            {/* App Vet */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="text-center mb-6">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🩺</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">AgendaVet Vet</h2>
                <p className="text-gray-600">Para veterinários</p>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm text-gray-700">
                  <span className="text-green-500 mr-2">✅</span>
                  Gerencie pacientes
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <span className="text-green-500 mr-2">✅</span>
                  IA para diagnóstico
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <span className="text-green-500 mr-2">✅</span>
                  Prescrições digitais
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <span className="text-green-500 mr-2">✅</span>
                  Funciona offline
                </div>
              </div>

              <div className="space-y-3">
                <Link
                  href="https://play.google.com/store/apps/details?id=com.agendavet.vet"
                  className="block w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg text-center transition-colors"
                >
                  📱 Download Android
                </Link>
                <Link
                  href="https://apps.apple.com/store/apps/details?id=com.agendavet.vet"
                  className="block w-full bg-gray-800 hover:bg-gray-900 text-white font-semibold py-3 px-6 rounded-lg text-center transition-colors"
                >
                  🍎 Download iOS
                </Link>
              </div>
            </div>
          </div>

          {/* Features Comparison */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <h3 className="text-2xl font-bold text-center text-gray-800 mb-6">
              📊 Comparação de Funcionalidades
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-4 py-3 text-left">Funcionalidade</th>
                    <th className="border border-gray-300 px-4 py-3 text-center">Web</th>
                    <th className="border border-gray-300 px-4 py-3 text-center">App Tutor</th>
                    <th className="border border-gray-300 px-4 py-3 text-center">App Vet</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">Gerenciar pets/pacientes</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">✅</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">✅</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">✅</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2">Agendamento</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">✅</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">✅</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">✅</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">Histórico médico</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">✅</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">✅</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">✅</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2">IA para diagnóstico</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">❌</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">❌</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">✅</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">Funcionamento offline</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">❌</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">✅</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">✅</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="text-center">
            <Link
              href="/"
              className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
            >
              🏠 Voltar ao AgendaVet Web
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
