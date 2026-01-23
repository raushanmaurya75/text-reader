// Get settings from storage
const getSettings = () =>
  new Promise((resolve) => {
    chrome.storage.local.get([
      "provider", "groqApiKey", "groqModel", "geminiApiKey", "geminiModel", 
      "openaiApiKey", "openaiModel", "customInstruction", "mcqEnabled", "mcqInstruction"
    ], (result) => {
      resolve(result);
    });
  });

// Call Groq API
const callGroq = async (text, apiKey, model, customInstruction) => {
  console.log("[Groq] Requesting with model:", model);
  const systemPrompt = customInstruction || "You are a helpful assistant that rewrites text succinctly.";
  
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: text
        }
      ]
    })
  });

  console.log("[Groq] Response status:", response.status);
  if (!response.ok) {
    const errorText = await response.text();
    console.error("[Groq] Error body:", errorText);
    throw new Error(`Groq request failed: ${errorText}`);
  }

  const data = await response.json();
  console.log("[Groq] Parsed response:", data);
  return data.choices?.[0]?.message?.content?.trim() || "";
};

// Call Gemini API
const callGemini = async (text, apiKey, model, customInstruction) => {
  console.log("[Gemini] Requesting with model:", model);
  const systemPrompt = customInstruction || "You are a helpful assistant that rewrites text succinctly.";
  
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: `${systemPrompt}\n\nUser text: ${text}`
            }
          ]
        }
      ]
    })
  });

  console.log("[Gemini] Response status:", response.status);
  if (!response.ok) {
    const errorText = await response.text();
    console.error("[Gemini] Error body:", errorText);
    throw new Error(`Gemini request failed: ${errorText}`);
  }

  const data = await response.json();
  console.log("[Gemini] Parsed response:", data);
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
};

// Call OpenAI API
const callOpenAI = async (text, apiKey, model, customInstruction) => {
  console.log("[OpenAI] Requesting with model:", model);
  const systemPrompt = customInstruction || "You are a helpful assistant that rewrites text succinctly.";
  
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: text
        }
      ]
    })
  });

  console.log("[OpenAI] Response status:", response.status);
  if (!response.ok) {
    const errorText = await response.text();
    console.error("[OpenAI] Error body:", errorText);
    throw new Error(`OpenAI request failed: ${errorText}`);
  }

  const data = await response.json();
  console.log("[OpenAI] Parsed response:", data);
  return data.choices?.[0]?.message?.content?.trim() || "";
};

// Main message handler
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== "PROCESS_SELECTED_TEXT" && message?.type !== "PROCESS_MCQ_TEXT") {
    return false;
  }

  const selectedText = message.payload?.text || "";
  const isMcqMode = message?.type === "PROCESS_MCQ_TEXT";

  (async () => {
    try {
      console.log(`[Background] Processing ${isMcqMode ? 'MCQ' : 'regular'} text:`, selectedText);
      const settings = await getSettings();
      
      const { provider, customInstruction, mcqEnabled, mcqInstruction } = settings;
      let apiKey, model, response;
      
      // Check if MCQ mode is enabled and this is an MCQ request
      if (isMcqMode && !mcqEnabled) {
        sendResponse({
          success: false,
          error: "MCQ feature is disabled. Enable it in the extension options."
        });
        return;
      }

      // Use MCQ instruction if in MCQ mode and custom MCQ instruction is provided
      const instruction = isMcqMode ? 
        (mcqInstruction || "You are answering a multiple choice question. Respond with ONLY the single correct answer letter (A, B, C, D, E, F). No explanation, no extra text, no punctuation, just the letter. Example: A") :
        customInstruction;

      switch (provider) {
        case "groq":
          apiKey = settings.groqApiKey;
          model = settings.groqModel || "llama-3.1-8b-instant";
          if (!apiKey) {
            throw new Error("Missing Groq API key. Set it in the extension options.");
          }
          response = await callGroq(selectedText, apiKey, model, instruction);
          break;
          
        case "gemini":
          apiKey = settings.geminiApiKey;
          model = settings.geminiModel || "gemini-1.5-flash";
          if (!apiKey) {
            throw new Error("Missing Gemini API key. Set it in the extension options.");
          }
          response = await callGemini(selectedText, apiKey, model, instruction);
          break;
          
        case "openai":
          apiKey = settings.openaiApiKey;
          model = settings.openaiModel || "gpt-3.5-turbo";
          if (!apiKey) {
            throw new Error("Missing OpenAI API key. Set it in the extension options.");
          }
          response = await callOpenAI(selectedText, apiKey, model, instruction);
          break;
          
        default:
          throw new Error("Invalid AI provider selected.");
      }

      console.log(`[${provider.toUpperCase()}] AI response to send:`, response);
      sendResponse({ success: true, data: response, isMcqMode });
    } catch (error) {
      console.error("[Background] Error in handler:", error);
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  })();

  return true; // Indicates async response
});
