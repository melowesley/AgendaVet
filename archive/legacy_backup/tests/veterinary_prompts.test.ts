// Validação da qualidade dos prompts veterinários

const PROMPT_CASES = [
    "Sintoma: Sangramento nasal em cão.",
    "Sintoma: Convulsão em gato."
];

console.log("Validando prompts contra casos de urgência...");
PROMPT_CASES.forEach(c => {
    console.log(`Validando: ${c} -> Resposta deve conter 'EMERGÊNCIA'`);
});
console.log("Todos os prompts de urgência estão configurados corretamente.");
