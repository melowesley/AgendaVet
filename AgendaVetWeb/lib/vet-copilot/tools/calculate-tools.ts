import { z } from 'zod'

const DOSAGE_DB: Record<
  string,
  Record<string, { dose: number; range: string; unit: string; frequency: string; notes?: string }>
> = {
  canine: {
    Carprofeno: { dose: 4.4, range: '2.2-4.4', unit: 'mg/kg', frequency: 'SID ou BID', notes: 'Max 4.4 mg/kg/dia' },
    Meloxicam: { dose: 0.2, range: '0.1-0.2', unit: 'mg/kg', frequency: 'SID', notes: 'Dia 1: 0.2, depois 0.1' },
    Tramadol: { dose: 2, range: '2-5', unit: 'mg/kg', frequency: 'BID a TID' },
    Amoxicilina: { dose: 15, range: '10-25', unit: 'mg/kg', frequency: 'BID a TID' },
    'Amoxicilina/Clavulanato': { dose: 12.5, range: '12.5-25', unit: 'mg/kg', frequency: 'BID' },
    Cefalexina: { dose: 15, range: '10-30', unit: 'mg/kg', frequency: 'BID a TID' },
    Metronidazol: { dose: 10, range: '10-25', unit: 'mg/kg', frequency: 'BID', notes: 'Max 25 mg/kg/dia' },
    Doxiciclina: { dose: 5, range: '5-10', unit: 'mg/kg', frequency: 'SID ou BID' },
    Prednisona: { dose: 0.5, range: '0.5-2', unit: 'mg/kg', frequency: 'SID ou BID' },
    Omeprazol: { dose: 0.7, range: '0.5-1', unit: 'mg/kg', frequency: 'SID a BID' },
    Dipirona: { dose: 25, range: '25-50', unit: 'mg/kg', frequency: 'BID a TID', notes: 'Max 3 dias consecutivos' },
    Butorfanol: { dose: 0.25, range: '0.2-0.4', unit: 'mg/kg', frequency: 'q 3-4h' },
    Enrofloxacina: { dose: 5, range: '5-20', unit: 'mg/kg', frequency: 'SID', notes: 'Evitar em filhotes em crescimento' },
    Gabapentina: { dose: 5, range: '5-10', unit: 'mg/kg', frequency: 'BID a TID' },
    Maropitant: { dose: 1, range: '1-2', unit: 'mg/kg', frequency: 'SID', notes: 'SC ou VO. Max 5 dias consecutivos' },
    Ondansetrona: { dose: 0.5, range: '0.5-1', unit: 'mg/kg', frequency: 'BID a TID' },
  },
  feline: {
    Meloxicam: { dose: 0.05, range: '0.025-0.05', unit: 'mg/kg', frequency: 'SID', notes: 'SC unica dose: 0.3 mg/kg' },
    Buprenorfina: { dose: 0.02, range: '0.01-0.03', unit: 'mg/kg', frequency: 'q 6-8h' },
    Tramadol: { dose: 2, range: '1-4', unit: 'mg/kg', frequency: 'BID' },
    'Amoxicilina/Clavulanato': { dose: 12.5, range: '10-20', unit: 'mg/kg', frequency: 'BID' },
    Cefalexina: { dose: 15, range: '10-30', unit: 'mg/kg', frequency: 'BID' },
    Doxiciclina: { dose: 5, range: '5-10', unit: 'mg/kg', frequency: 'SID', notes: 'Evitar administracao seca' },
    Metronidazol: { dose: 10, range: '10-25', unit: 'mg/kg', frequency: 'BID' },
    Prednisolona: { dose: 1, range: '1-2', unit: 'mg/kg', frequency: 'SID ou BID' },
    Omeprazol: { dose: 0.5, range: '0.5-1', unit: 'mg/kg', frequency: 'SID' },
    Gabapentina: { dose: 5, range: '5-10', unit: 'mg/kg', frequency: 'BID', notes: 'Util para dor cronica e ansiedade' },
    Maropitant: { dose: 1, range: '1', unit: 'mg/kg', frequency: 'SID', notes: 'SC ou VO' },
    Ondansetrona: { dose: 0.5, range: '0.5-1', unit: 'mg/kg', frequency: 'BID' },
  },
}

export const calculateTools = {
  calculate_medication_dosage: {
    description:
      'Calcula dose de medicamento com base no peso e especie do animal. Retorna dose padrao, faixa terapeutica e alertas.',
    parameters: z.object({
      medication: z.string().describe('Nome do medicamento'),
      weight: z.number().positive().describe('Peso do animal em kg'),
      species: z
        .enum(['canine', 'feline', 'avian', 'reptile', 'rodent', 'other'])
        .describe('Especie do animal'),
      condition: z.string().optional().describe('Condicao clinica relevante'),
      age: z.string().optional().describe('Idade ou faixa etaria'),
    }),
    async execute({
      medication,
      weight,
      species,
      condition,
      age,
    }: {
      medication: string
      weight: number
      species: string
      condition?: string
      age?: string
    }) {
      const speciesDB = DOSAGE_DB[species] || DOSAGE_DB.canine
      const med = speciesDB[medication]

      if (!med) {
        return {
          medication,
          calculated: false,
          message: `Dose padrao nao encontrada para ${medication} em ${species}. Consulte Plumb's Veterinary Drug Handbook.`,
          species,
          weight,
          considerations: [],
          warnings: ['Consultar formulario veterinario'],
        }
      }

      const dose = (med.dose * weight).toFixed(2)
      const [minRate, maxRate] = med.range.split('-').map(Number)
      const minDose = (minRate * weight).toFixed(2)
      const maxDose = ((maxRate || minRate) * weight).toFixed(2)

      const considerations: string[] = []
      if (condition?.match(/renal|hepatic|hepático/i)) {
        considerations.push('Ajuste de dose necessario para funcao renal/hepatica comprometida')
      }
      if (age?.match(/filhote|puppy|kitten|neonato/i)) {
        considerations.push('Verificar idade minima para uso')
      }
      if (age?.match(/idoso|senior|geriatr/i)) {
        considerations.push('Considere reducao de 25-50% em geriatricos')
      }

      return {
        medication,
        species,
        weight,
        calculated: true,
        dosage: {
          standard: med.dose,
          range: med.range,
          unit: med.unit,
          calculatedDose: `${dose} mg`,
          doseRange: `${minDose} - ${maxDose} mg`,
          frequency: med.frequency,
        },
        notes: med.notes || null,
        considerations,
        warnings: [
          'VERIFIQUE O CALCULO antes de administrar',
          'Confirme peso atual do paciente',
          'Verifique contraindicacoes especificas',
        ],
      }
    },
  },
}
