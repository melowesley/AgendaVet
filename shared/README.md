# AgendaVet Shared

Pacote compartilhado com tipos, utilitários e constantes do AgendaVet.

## Estrutura

```
shared/
├── types.ts          # Tipos TypeScript compartilhados
├── utils.ts          # Funções utilitárias
├── constants.ts      # Constantes da aplicação
├── index.ts          # Exportações principais
├── package.json      # Configuração do pacote
└── README.md         # Documentação
```

## Uso

### No projeto Web (AgendaVetWeb)

```typescript
// Importar tipos
import { Pet, Owner, Appointment } from '@agendavet/shared/types'

// Importar utilitários
import { formatDate, formatCurrency, cn } from '@agendavet/shared/utils'

// Importar constantes
import { SPECIES, APPOINTMENT_TYPES } from '@agendavet/shared/constants'

// Importar tudo
import * as Shared from '@agendavet/shared'
```

### Nos projetos Mobile (AgendaVetVet, AgendaVetTutor)

```typescript
// Importar tipos
import { Pet, Owner, Appointment } from '../../shared/types'

// Importar utilitários
import { formatDate, formatCurrency } from '../../shared/utils'

// Importar constantes
import { SPECIES, APPOINTMENT_TYPES } from '../../shared/constants'
```

## Instalação

### Como pacote local (recomendado)

1. No projeto principal:
```bash
cd shared
npm install
```

2. Nos projetos que usam:
```bash
npm install ../shared
```

### Como referência direta

Adicionar no `package.json` dos projetos:
```json
{
  "dependencies": {
    "@agendavet/shared": "file:../shared"
  }
}
```

## Desenvolvimento

```bash
cd shared
npm install
npm run dev  # Watch mode
npm run build
npm run type-check
npm run lint
```

## Conteúdo

### Tipos (`types.ts`)

- **Pet**: Informações do animal
- **Owner**: Informações do tutor
- **Appointment**: Agendamentos
- **MedicalRecord**: Prontuário veterinário
- **VetCopilotMessage**: Mensagens do AI
- **VetCopilotConversation**: Conversas do AI
- **AIModel**: Modelos de IA disponíveis
- **Notification**: Notificações
- **Clinic**: Configurações da clínica

### Utilitários (`utils.ts`)

- **Formatação**: `formatDate`, `formatCurrency`, `formatPhone`
- **Validação**: `validateEmail`, `validatePhone`, `validateCPF`
- **Cores**: `getStatusColor`, `getSpeciesColor`
- **Data**: `addDays`, `isToday`, `getDaysUntil`
- **Storage**: `setStorageItem`, `getStorageItem`
- **API**: `apiRequest`, `createApiUrl`
- **Veterinária**: `calculateNextVaccination`, `getVaccinationStatus`

### Constantes (`constants.ts`)

- **APP_CONFIG**: Configurações gerais
- **SPECIES**: Espécies animais com emojis
- **APPOINTMENT_TYPES**: Tipos de agendamento
- **APPOINTMENT_STATUS**: Status de agendamento
- **MEDICAL_RECORD_TYPES**: Tipos de prontuário
- **AI_MODELS**: Modelos de IA com especializações
- **VACCINATION_SCHEDULES**: Calendários de vacinação
- **ERROR_MESSAGES**: Mensagens de erro padrão
- **SUCCESS_MESSAGES**: Mensagens de sucesso padrão

## Deploy

O pacote é publicado localmente e compartilhado entre os projetos através do sistema de arquivos ou npm local.

## Contribuição

1. Faça as alterações nos arquivos correspondentes
2. Teste em todos os projetos que usam
3. Atualie a versão se necessário
4. Comite as mudanças
