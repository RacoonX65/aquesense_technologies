"use server"

// Server action for Hugging Face API calls
export async function generateAIResponse(prompt: string): Promise<string> {
  try {
    const apiKey = process.env.HUGGING_FACE_API_KEY // Use server-side env variable (no NEXT_PUBLIC_)

    if (!apiKey) {
      console.warn("Hugging Face API key not found")
      return "I'm currently running in rule-based mode. Ask me about your water quality parameters!"
    }

    const response = await fetch("https://api-inference.huggingface.co/models/microsoft/DialoGPT-large", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_length: 300,
          temperature: 0.7,
          do_sample: true,
          top_p: 0.9,
        },
      }),
    })

    if (response.ok) {
      const result = await response.json()
      if (result.generated_text) {
        return result.generated_text
      }
    }

    // Fallback if API call fails
    return "I couldn't connect to my advanced AI capabilities. Let me help with your water quality using my built-in knowledge!"
  } catch (error) {
    console.error("Hugging Face API error:", error)
    return "I'm having trouble connecting to my AI capabilities. Please ask about specific water parameters like pH or temperature."
  }
}

// Server action to check API availability
export async function checkAPIAvailability(): Promise<boolean> {
  try {
    const apiKey = process.env.HUGGING_FACE_API_KEY

    if (!apiKey) {
      return false
    }

    const response = await fetch("https://api-inference.huggingface.co/models/microsoft/DialoGPT-large", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        inputs: "Test connection",
        parameters: {
          max_length: 50,
          temperature: 0.7,
        },
      }),
    })

    return response.ok
  } catch (error) {
    console.error("API availability check failed:", error)
    return false
  }
}
