import { z } from 'zod'
import { contextBuilder } from '../context-builder'

export const searchTools = {
  search_clinical_knowledge: {
    description:
      'Busca em base de conhecimento veterinario (protocolos, literatura, medicamentos) usando RAG.',
    parameters: z.object({
      query: z.string().describe('Pergunta ou termo de busca clinico'),
      species: z.string().optional().describe('Especie para filtrar resultados'),
      clinicId: z.string().optional().describe('ID da clinica para busca contextual'),
    }),
    async execute({
      query,
      species,
      clinicId,
    }: {
      query: string
      species?: string
      clinicId?: string
    }) {
      const ragContext = clinicId
        ? await contextBuilder.fetchRAGContext(
            `${query}${species ? ` ${species}` : ''}`,
            clinicId
          )
        : ''

      if (ragContext) {
        return { query, species, results: ragContext, source: 'rag' }
      }

      return {
        query,
        species,
        results: [],
        note: 'Base RAG sem resultados. O modelo usara conhecimento interno.',
        references: [
          'WSAVA Guidelines (wsava.org)',
          'AAHA Guidelines (aaha.org)',
          "Plumb's Veterinary Drug Handbook",
          'VIN - Veterinary Information Network (vin.com)',
        ],
      }
    },
  },
}
