export async function logAIUsage(data: any) {
  console.log("AI LOG:", {
    model: data.model,
    prompt: data.prompt,
    response: data.response,
    timestamp: new Date()
  })
}
