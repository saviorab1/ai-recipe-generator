export function request(ctx) {
  const { ingredients = [], question = "" } = ctx.args;

  // Construct the prompt with the provided ingredients and question
  const prompt = `\n\nHuman: ${question || `Suggest a recipe idea using these ingredients: ${ingredients.join(", ")}.`}\n\nAssistant:`;

  // Return the request configuration
  return {
    resourcePath: `/model/anthropic.claude-v2/invoke`,
    method: "POST",
    params: {
      headers: {
        "Content-Type": "application/json",
        "Accept": "*/*"
      },
      body: JSON.stringify({
        prompt: prompt,
        max_tokens_to_sample: 300,
        temperature: 0.5,
        top_k: 250,
        top_p: 1,
        stop_sequences: ["\n\nHuman:"],
        anthropic_version: "bedrock-2023-08-01"
      }),
    },
  };
}

export function response(ctx) {
  // Parse the response body
  const parsedBody = JSON.parse(ctx.result.body);
  // Extract the completion from the response
  const res = {
    body: parsedBody.completion,
  };
  // Return the response
  return res;
}