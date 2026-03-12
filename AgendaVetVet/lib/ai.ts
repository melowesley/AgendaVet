import { routeAIRequest } from "./ai/router"
import { contextBuilder } from "./ai/context"
import { VET_COPILOT_SYSTEM_PROMPT } from "./ai/prompts"

export async function askVetAI(input: string, context?: any) {
    let clinicalContext = "";
    
    // Auto-gather context if petId is provided
    if (context?.petId) {
        clinicalContext = await contextBuilder.build(context.petId);
    }

    const fullPrompt = `${VET_COPILOT_SYSTEM_PROMPT}\n${clinicalContext}\n\nUser Question: ${input}`;

    return await routeAIRequest(fullPrompt, context)
}
