export function treatmentPrompt(condition: string) {
  return `
Sugira abordagens terapêuticas veterinárias para:

${condition}

Inclua:

• tratamento inicial
• manejo clínico
• monitoramento recomendado

Não prescreva doses sem confirmação veterinária.
`
}
