export function request(ctx) {
  try {
    const { ingredients = [], question = "" } = ctx.args;

    // Build text prompt
    const textPrompt = question || `Suggest a recipe idea using these ingredients: ${ingredients.join(", ")}.`;
    
    console.log("Ingredients:", ingredients);
    console.log("Text prompt:", textPrompt);

    // Return the request configuration for Claude 3.5 Sonnet
    return {
      resourcePath: `/model/anthropic.claude-3-5-sonnet-20241022-v2:0/invoke`,
      method: "POST",
      params: {
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          anthropic_version: "bedrock-2023-05-31",
          max_tokens: 200,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: textPrompt
                }
              ]
            }
          ]
        }),
      },
    };
  } catch (error) {
    console.error("Error in request function:", error);
    // Return a direct error response instead of throwing
    return {
      error: `Request error: ${error.message || "Unknown error"}`,
      body: null
    };
  }
}

export function response(ctx) {
  try {
    // Log the raw result
    console.log("Raw result:", ctx.result ? JSON.stringify(ctx.result).substring(0, 200) + "..." : "undefined");
    
    // Check if we got a result at all
    if (!ctx.result) {
      console.error("No result object received");
      return {
        body: null,
        error: "No response received from Bedrock"
      };
    }
    
    // Check for HTTP error
    if (ctx.result.statusCode >= 400) {
      console.error(`HTTP error ${ctx.result.statusCode}`);
      return {
        body: null,
        error: `HTTP error ${ctx.result.statusCode}: ${ctx.result.body || "No error details"}`
      };
    }
    
    // Check for empty body
    if (!ctx.result.body) {
      console.error("Empty response body");
      return {
        body: null,
        error: "Empty response from Bedrock"
      };
    }
    
    // Try to parse the body
    let parsedBody;
    try {
      parsedBody = JSON.parse(ctx.result.body);
      console.log("Parsed response structure:", Object.keys(parsedBody).join(', '));
    } catch (parseError) {
      console.error("Failed to parse JSON response:", parseError);
      return {
        body: null,
        error: `Failed to parse response: ${parseError.message}`
      };
    }
    
    // Extract output from Claude 3.5 Sonnet response
    if (parsedBody) {
      // First try the standard Claude 3.5 response format
      if (parsedBody.content && Array.isArray(parsedBody.content)) {
        for (const contentItem of parsedBody.content) {
          if (contentItem.type === 'text') {
            return {
              body: contentItem.text,
              error: null
            };
          }
        }
      }
      
      // Fallback for older model versions
      if (parsedBody.completion) {
        return {
          body: parsedBody.completion,
          error: null
        };
      }
      
      // Another fallback for different formats
      if (parsedBody.output) {
        return {
          body: typeof parsedBody.output === 'string' ? parsedBody.output : JSON.stringify(parsedBody.output),
          error: null
        };
      }
      
      // Log available keys for debugging
      const keys = Object.keys(parsedBody);
      console.log("Available keys in response:", keys.join(', '));
      
      // Return the full response body as a fallback
      return {
        body: null,
        error: `Unexpected response format. Available fields: ${keys.join(', ')}`
      };
    }
    
    return {
      body: null,
      error: "Could not process Bedrock response"
    };
  } catch (error) {
    console.error("Unhandled error in response handler:", error);
    return {
      body: null,
      error: `Response handler error: ${error.message || "Unknown error"}`
    };
  }
}