import { AppLayout } from '@/components/app-layout'
import { VetCopilotContent } from '@/components/vet-copilot/vet-copilot-content'

export default function VetCopilotPage() {
  return (
    <AppLayout breadcrumbs={[{ label: 'Vet AI' }]}>
      <VetCopilotContent />
    </AppLayout>
  )
}
