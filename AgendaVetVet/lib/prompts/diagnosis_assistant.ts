import { BASE_PROMPT_TEMPLATE } from './veterinary_prompts';

export const DIAGNOSIS_ASSISTANT_PROMPT = (clinicalSigns: string, history: string) =>
    BASE_PROMPT_TEMPLATE(
        "Atue como um assistente de diagnóstico. Liste as hipóteses diagnósticas mais prováveis e sugira exames complementares (sangue, imagem, citologia) para confirmação.",
        `Sinais Clínicos: ${clinicalSigns}\nHistórico: ${history}`
    );
