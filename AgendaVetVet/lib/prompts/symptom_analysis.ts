import { BASE_PROMPT_TEMPLATE } from './veterinary_prompts';

export const SYMPTOM_ANALYSIS_PROMPT = (symptoms: string) =>
    BASE_PROMPT_TEMPLATE(
        "Analise os seguintes sintomas e forneça possíveis diagnósticos diferenciais, nível de urgência e próximos passos.",
        symptoms
    );

export const URGENCY_LEVELS = {
    EMERGENCY: "CRÍTICO/EMERGÊNCIA: Procure atendimento IMEDIATO.",
    URGENT: "URGENTE: Consulta dentro das próximas 12-24 horas.",
    ROUTINE: "ROTINA: Agende uma consulta eletiva.",
    MONITOR: "MONITORAMENTO: Observe em casa e reporte mudanças."
};
