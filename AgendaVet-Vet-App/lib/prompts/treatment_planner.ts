import { BASE_PROMPT_TEMPLATE } from './veterinary_prompts';

export const TREATMENT_PLANNER_PROMPT = (diagnosis: string, patientStats: string) =>
    BASE_PROMPT_TEMPLATE(
        "Crie um plano de tratamento estruturado para o diagnóstico fornecido. Inclua categorias como: Medicamentoso (doses teóricas baseadas no peso), Suporte, Manejo Ambiental e Critérios de Reavaliação.",
        `Diagnóstico: ${diagnosis}\nDados do Paciente: ${patientStats}`
    );
