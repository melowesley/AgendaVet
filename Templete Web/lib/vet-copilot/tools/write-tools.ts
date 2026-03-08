import { z } from 'zod'
import type { ClinicalActionPreview } from '../types'

export const writeTools = {
  draft_prescription: {
    description:
      'Gera rascunho de prescricao para revisao e confirmacao do veterinario. NAO insere no banco automaticamente.',
    parameters: z.object({
      petId: z.string().uuid().describe('ID do pet'),
      medication: z.string().describe('Nome do medicamento'),
      dosage: z.string().describe('Dosagem calculada (ex: 25 mg)'),
      frequency: z.string().describe('Frequencia (ex: BID, TID, SID)'),
      duration: z.string().describe('Duracao do tratamento (ex: 7 dias)'),
      notes: z.string().optional().describe('Instrucoes adicionais'),
    }),
    async execute({
      petId,
      medication,
      dosage,
      frequency,
      duration,
      notes,
    }: {
      petId: string
      medication: string
      dosage: string
      frequency: string
      duration: string
      notes?: string
    }): Promise<ClinicalActionPreview> {
      return {
        status: 'pending_confirmation',
        confirmationRequired: true,
        actionType: 'create_prescription',
        preview: {
          petId,
          medication,
          dosage,
          frequency,
          duration,
          notes: notes || '',
          createdAt: new Date().toISOString(),
        },
        message: `Rascunho de prescricao: ${medication} ${dosage} ${frequency} por ${duration}. Confirme para registrar.`,
      }
    },
  },

  draft_observation: {
    description:
      'Gera rascunho de observacao clinica para revisao e confirmacao do veterinario.',
    parameters: z.object({
      petId: z.string().uuid().describe('ID do pet'),
      observation: z.string().describe('Texto da observacao clinica'),
      type: z
        .enum(['consulta', 'retorno', 'cirurgia', 'internacao', 'emergencia'])
        .optional()
        .describe('Tipo de atendimento'),
    }),
    async execute({
      petId,
      observation,
      type,
    }: {
      petId: string
      observation: string
      type?: string
    }): Promise<ClinicalActionPreview> {
      return {
        status: 'pending_confirmation',
        confirmationRequired: true,
        actionType: 'create_observation',
        preview: {
          petId,
          observation,
          type: type || 'consulta',
          createdAt: new Date().toISOString(),
        },
        message: `Rascunho de observacao (${type || 'consulta'}). Confirme para registrar.`,
      }
    },
  },

  draft_clinical_summary: {
    description:
      'Gera resumo clinico estruturado da consulta atual para revisao do veterinario.',
    parameters: z.object({
      petId: z.string().uuid().describe('ID do pet'),
      chiefComplaint: z.string().describe('Queixa principal'),
      findings: z.string().describe('Achados do exame fisico'),
      assessment: z.string().describe('Avaliacao/diagnostico'),
      plan: z.string().describe('Plano terapeutico'),
    }),
    async execute({
      petId,
      chiefComplaint,
      findings,
      assessment,
      plan,
    }: {
      petId: string
      chiefComplaint: string
      findings: string
      assessment: string
      plan: string
    }): Promise<ClinicalActionPreview> {
      const summary = [
        `QUEIXA PRINCIPAL: ${chiefComplaint}`,
        `EXAME FISICO: ${findings}`,
        `AVALIACAO: ${assessment}`,
        `PLANO: ${plan}`,
      ].join('\n\n')

      return {
        status: 'pending_confirmation',
        confirmationRequired: true,
        actionType: 'create_clinical_summary',
        preview: {
          petId,
          chiefComplaint,
          findings,
          assessment,
          plan,
          formattedSummary: summary,
          createdAt: new Date().toISOString(),
        },
        message:
          'Resumo clinico gerado. Revise e confirme para registrar no prontuario.',
      }
    },
  },
}
