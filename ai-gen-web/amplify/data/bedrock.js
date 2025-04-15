export function request(ctx) {
  const { imageBase64, question } = ctx.args;

  return {
    resourcePath: `/model/anthropic.claude-3-sonnet-20240229-v1:0/invoke`,
    method: "POST",
    params: {
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 1000,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: "image/jpeg",
                  data: imageBase64
                }
              },
              {
                type: "text",
                text: question || "What's in this image?"
              }
            ]
          }
        ]
      }),
    },
  };
}

export function response(ctx) {
  try {
    const parsedBody = JSON.parse(ctx.result.body);
    
    // Handle potential error responses
    if (parsedBody.error) {
      return {
        body: "",
        error: parsedBody.error.message || JSON.stringify(parsedBody.error)
      };
    }

    // Handle successful responses
    if (parsedBody.content && Array.isArray(parsedBody.content)) {
      return {
        body: parsedBody.content[0]?.text || "No response text available",
        error: ""
      };
    }

    // Handle unexpected response format
    return {
      body: "",
      error: "Unexpected response format from Claude"
    };
  } catch (error) {
    return {
      body: "",
      error: `Error processing response: ${error.message}`
    };
  }
}