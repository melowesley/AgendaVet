export function symptomPrompt(symptoms: string) {
  return `
Analise os seguintes sintomas em um paciente veterinário:

${symptoms}

Forneça:

Possíveis causas

Diagnósticos diferenciais

Exames recomendados

Nunca forneça diagnóstico definitivo.
`
}
