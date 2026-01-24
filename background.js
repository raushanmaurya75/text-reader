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

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq request failed: ${errorText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
};

// Call Gemini API
const callGemini = async (text, apiKey, model, customInstruction) => {
  const systemPrompt = customInstruction || "You are a helpful assistant that rewrites text succinctly.";
  
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `${systemPrompt}\n\nUser: ${text}`
        }]
      }]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini request failed: ${errorText}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
};

// Call OpenAI API
const callOpenAI = async (text, apiKey, model, customInstruction) => {
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

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI request failed: ${errorText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
};

// Process selected text
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "PROCESS_SELECTED_TEXT") {
    (async () => {
      try {
        const settings = await getSettings();
        const { provider, groqApiKey, groqModel, geminiApiKey, geminiModel, openaiApiKey, openaiModel, customInstruction } = settings;
        
        let result = "";
        if (provider === "groq" && groqApiKey) {
          result = await callGroq(request.payload.text, groqApiKey, groqModel, customInstruction);
        } else if (provider === "gemini" && geminiApiKey) {
          result = await callGemini(request.payload.text, geminiApiKey, geminiModel, customInstruction);
        } else if (provider === "openai" && openaiApiKey) {
          result = await callOpenAI(request.payload.text, openaiApiKey, openaiModel, customInstruction);
        } else {
          throw new Error("No valid API configuration found");
        }
        
        sendResponse({ success: true, data: result });
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true; // Keep message channel open for async response
  }
  
  if (request.type === "PROCESS_MCQ_TEXT") {
    (async () => {
      try {
        const settings = await getSettings();
        const { provider, groqApiKey, groqModel, geminiApiKey, geminiModel, openaiApiKey, openaiModel, mcqInstruction } = settings;
        
        let result = "";
        if (provider === "groq" && groqApiKey) {
          result = await callGroq(request.payload.text, groqApiKey, groqModel, mcqInstruction || "You are answering a multiple choice question. If the question has lettered options (A, B, C, D), respond with ONLY the single correct answer letter. If it's a fill-in-the-blank with numbered options, respond with the option number. If it's true/false, respond with 'true' or 'false'. If it's a checkbox-style question, respond with the position (first, second, third, etc.). No explanation, no extra text. Examples: A, 2, true, first");
        } else if (provider === "gemini" && geminiApiKey) {
          result = await callGemini(request.payload.text, geminiApiKey, geminiModel, mcqInstruction || "You are answering a multiple choice question. If the question has lettered options (A, B, C, D), respond with ONLY the single correct answer letter. If it's a fill-in-the-blank with numbered options, respond with the option number. If it's true/false, respond with 'true' or 'false'. If it's a checkbox-style question, respond with the position (first, second, third, etc.). No explanation, no extra text. Examples: A, 2, true, first");
        } else if (provider === "openai" && openaiApiKey) {
          result = await callOpenAI(request.payload.text, openaiApiKey, openaiModel, mcqInstruction || "You are answering a multiple choice question. If the question has lettered options (A, B, C, D), respond with ONLY the single correct answer letter. If it's a fill-in-the-blank with numbered options, respond with the option number. If it's true/false, respond with 'true' or 'false'. If it's a checkbox-style question, respond with the position (first, second, third, etc.). No explanation, no extra text. Examples: A, 2, true, first");
        } else {
          throw new Error("No valid API configuration found");
        }
        
        sendResponse({ success: true, data: result });
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true; // Keep message channel open for async response
  }
});
