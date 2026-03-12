export function diagnosisPrompt(data: string) {
  return `
Analise o seguinte caso clínico veterinário:

${data}

Forneça:

• possíveis diagnósticos diferenciais
• nível de probabilidade
• exames recomendados

Isso é apenas suporte clínico.
`
}
