// Get settings from storage
const getSettings = () =>
  new Promise((resolve) => {
    chrome.storage.local.get([
      "provider", "groqApiKey", "groqModel", "geminiApiKey", "geminiModel",
      "openaiApiKey", "openaiModel", "openrouterApiKey", "openrouterModel",
      "customInstruction", "imageSolvingInstruction"
    ], (result) => {
      resolve(result);
    });
  });

// Image cropping helper
function base64ToBlob(base64Str, mimeType = 'image/jpeg') {
  const b64 = base64Str.split(',')[1] || base64Str;
  const byteCharacters = atob(b64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], {type: mimeType});
}

async function cropImageBase64(dataUrl, region, dpr, scrollX, scrollY, innerWidth, innerHeight) {
  try {
    const blob = base64ToBlob(dataUrl, 'image/jpeg');
    const bitmap = await createImageBitmap(blob);

    const scaleX = innerWidth ? (bitmap.width / innerWidth) : dpr;
    const scaleY = innerHeight ? (bitmap.height / innerHeight) : dpr;

    // Generous padding (20px in screen space) ensures edge text, exponents, and options are never cropped
    const padX = Math.round(20 * scaleX);
    const padY = Math.round(20 * scaleY);

    const rawVx = (region.x - scrollX) * scaleX;
    const rawVy = (region.y - scrollY) * scaleY;

    const vx = Math.max(0, rawVx - padX);
    const vy = Math.max(0, rawVy - padY);
    let vw = (region.width * scaleX) + (padX * 2);
    let vh = (region.height * scaleY) + (padY * 2);

    if (vx + vw > bitmap.width) vw = bitmap.width - vx;
    if (vy + vh > bitmap.height) vh = bitmap.height - vy;

    if (vw <= 0 || vh <= 0) return dataUrl;

    // Full native resolution so no text or math symbols are blurred or truncated
    const canvas = new OffscreenCanvas(vw, vh);
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bitmap, vx, vy, vw, vh, 0, 0, vw, vh);
    
    // Quality 0.88 delivers razor-sharp text and formulas
    const croppedBlob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.88 });
    
    // Convert blob to base64
    const buffer = await croppedBlob.arrayBuffer();
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return 'data:image/jpeg;base64,' + btoa(binary);
  } catch (err) {
    console.error("Cropping failed, returning full image", err);
    return dataUrl;
  }
}

// Call Groq API (Text & Vision supported via qwen/qwen3.8-27b)
const callGroq = async (text, apiKey, model, customInstruction, imageUrl = null) => {
  const systemPrompt = customInstruction || "You are a helpful assistant that rewrites text succinctly.";
  const selectedModel = model || "openai/gpt-oss-120b";

  let userContent;
  if (imageUrl) {
    userContent = [
      { type: "text", text: typeof text === "string" ? text : String(text || "") },
      { type: "image_url", image_url: { url: imageUrl } }
    ];
  } else {
    userContent = typeof text === "string" ? text : String(text || "");
  }

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    signal: AbortSignal.timeout(38000),
    body: JSON.stringify({
      model: selectedModel,
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: userContent
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
const callGemini = async (text, apiKey, model, customInstruction, imageUrl = null) => {
  const systemPrompt = customInstruction || "You are a helpful assistant that rewrites text succinctly.";

  const parts = [{ text: `${systemPrompt}\n\nUser: ${text}` }];
  if (imageUrl) {
    const base64Data = imageUrl.split(',')[1];
    parts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: base64Data
      }
    });
  }

  const cleanKey = apiKey ? apiKey.trim() : "";
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${cleanKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": cleanKey
    },
    signal: AbortSignal.timeout(38000),
    body: JSON.stringify({
      contents: [{
        parts: parts
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
const callOpenAI = async (text, apiKey, model, customInstruction, imageUrl = null) => {
  const systemPrompt = customInstruction || "You are a helpful assistant that rewrites text succinctly.";

  const userContent = imageUrl 
    ? [ { type: "text", text: text }, { type: "image_url", image_url: { url: imageUrl } } ]
    : text;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    signal: AbortSignal.timeout(38000),
    body: JSON.stringify({
      model: model,
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: userContent
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

// Call OpenRouter API (Vision & Text)
const callOpenRouter = async (text, apiKey, model, customInstruction, imageUrl = null) => {
  const systemPrompt = customInstruction || "You are a helpful visual and text assistant.";
  const selectedModel = model || "meta-llama/llama-3.2-11b-vision-instruct";

  const userContent = imageUrl 
    ? [ { type: "text", text: text }, { type: "image_url", image_url: { url: imageUrl } } ]
    : text;

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://github.com/text-reader",
      "X-Title": "Text Reader"
    },
    signal: AbortSignal.timeout(38000),
    body: JSON.stringify({
      model: selectedModel,
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: userContent
        }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter request failed: ${errorText}`);
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
        const { provider, groqApiKey, groqModel, geminiApiKey, geminiModel, openaiApiKey, openaiModel, openrouterApiKey, openrouterModel, customInstruction } = settings;

        let result = "";
        if (groqApiKey) {
          result = await callGroq(request.payload.text, groqApiKey, groqModel, customInstruction);
        } else if (openrouterApiKey) {
          result = await callOpenRouter(request.payload.text, openrouterApiKey, openrouterModel, customInstruction);
        } else if (geminiApiKey) {
          result = await callGemini(request.payload.text, geminiApiKey, geminiModel, customInstruction);
        } else if (openaiApiKey) {
          result = await callOpenAI(request.payload.text, openaiApiKey, openaiModel, customInstruction);
        } else {
          throw new Error("No API key configured for Text Processing. Please set your Groq API Key in settings.");
        }

        sendResponse({ success: true, data: result });
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true; // Keep message channel open for async response
  }

  // Process MCQ/Math questions from image
  if (request.type === "PROCESS_IMAGE_QUESTION") {
    (async () => {
      try {
        const settings = await getSettings();
        const { provider, groqApiKey, groqModel, geminiApiKey, geminiModel, openaiApiKey, openaiModel, openrouterApiKey, openrouterModel, imageSolvingInstruction } = settings;

        // Take a screenshot with optimized quality (80) to cut payload size significantly
        const dataUrl = await new Promise((resolve, reject) => {
          chrome.tabs.captureVisibleTab(null, { format: 'jpeg', quality: 80 }, (imgUrl) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              resolve(imgUrl);
            }
          });
        });

        const { region, dpr, scrollX, scrollY, innerWidth, innerHeight } = request.payload;
        let finalImageUrl = dataUrl;
        
        if (region) {
          finalImageUrl = await cropImageBase64(dataUrl, region, dpr, scrollX, scrollY, innerWidth, innerHeight);
        }

        const defaultImagePrompt = `You are an expert at solving multiple choice questions, math problems, and academic questions with exceptional accuracy. Solve the problem presented in the attached image.
        
CRITICAL INSTRUCTIONS:
1. Examine the image carefully. Extract all relevant text and understand the question being asked.
2. For math problems:
   - Show your step-by-step calculations and reasoning
   - Perform all arithmetic operations accurately
   - Verify your answer against the given options
3. For conceptual MCQ questions:
   - Quickly verify the correct option against the question
   - Give the direct answer — do NOT explain why other options are wrong
   - Keep it brief and to the point
4. After providing your reasoning, you MUST end with a single line in this EXACT format:
   FINAL ANSWER: [letter or number]
   
   Where [letter or number] is ONLY:
   - A single letter (A, B, C, or D) if options are labeled with letters
   - A single number (1, 2, 3, or 4) if options are numbered
   - Nothing else - no punctuation, no extra text`;

        const prompt = imageSolvingInstruction?.trim() || defaultImagePrompt;
        const systemPrompt = "You are an expert visual & problem solving assistant.";

        let result = "";
        let geminiError = null;

        // 1. Primary Image Solver: Try Google Gemini (Sanitized to live 2026 models)
        if (geminiApiKey) {
          const sanitizedGemini = (!geminiModel || geminiModel.startsWith("gemini-1") || geminiModel.startsWith("gemini-2") || geminiModel === "gemini-3.6-flash") 
            ? "gemini-3.5-flash-lite" 
            : geminiModel;
          try {
            result = await callGemini(prompt, geminiApiKey, sanitizedGemini, systemPrompt, finalImageUrl);
          } catch (err) {
            console.warn("[Image Feature] Gemini primary error:", err.message);
            geminiError = err;
            
            // If Gemini hits 429 (rate limit) or 503 (high demand) -> Auto-forward the ACTUAL image to Groq Vision!
            if (groqApiKey) {
              console.log("[Image Feature] Gemini busy/rate-limited. Forwarding image to Groq Vision (qwen/qwen3.8-27b)...");
              try {
                result = await callGroq(prompt, groqApiKey, "qwen/qwen3.8-27b", systemPrompt, finalImageUrl);
                geminiError = null;
              } catch (groqErr) {
                console.warn("[Image Feature] Groq Vision fallback error:", groqErr.message);
              }
            }
          }
        }

        // 2. Fallback to Groq Vision if Gemini was skipped or failed
        if (!result && groqApiKey) {
          try {
            console.log("[Image Feature] Trying Groq Vision fallback (qwen/qwen3.8-27b)...");
            result = await callGroq(prompt, groqApiKey, "qwen/qwen3.8-27b", systemPrompt, finalImageUrl);
          } catch (groqErr) {
            console.warn("[Image Feature] Final Groq fallback error:", groqErr.message);
          }
        }

        // 3. Fallback to OpenRouter Vision Model if still no result
        if (!result && openrouterApiKey) {
          try {
            const activeOpenRouterModel = (!openrouterModel || openrouterModel === "google/gemini-3.6-flash" || openrouterModel === "google/gemini-2.5-flash") 
              ? "google/gemini-2.0-flash-001" 
              : openrouterModel;
            result = await callOpenRouter(prompt, openrouterApiKey, activeOpenRouterModel, systemPrompt, finalImageUrl);
          } catch (err) {
            console.error("[Image Feature] OpenRouter fallback error:", err.message);
            throw new Error(`Both Gemini & OpenRouter failed. Gemini: ${geminiError?.message || 'N/A'}. OpenRouter: ${err.message}`);
          }
        }

        // 3. Fallback to OpenAI if configured
        if (!result && openaiApiKey) {
          result = await callOpenAI(prompt, openaiApiKey, openaiModel || "gpt-4o-mini", systemPrompt, finalImageUrl);
        }

        if (!result) {
          if (geminiError) {
            throw new Error(`Gemini Error: ${geminiError.message}. Please configure an OpenRouter API Key in options for automatic backup.`);
          }
          throw new Error("No API key configured for Image Feature. Please set your Google AI Studio Key or OpenRouter API Key in options.");
        }

        sendResponse({ success: true, data: result });
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true;
  }

  // Process MCQ/Math questions from text
  if (request.type === "PROCESS_MCQ_TEXT") {
    (async () => {
      try {
        const settings = await getSettings();
        const { provider, groqApiKey, groqModel, geminiApiKey, geminiModel, openaiApiKey, openaiModel } = settings;

        // Specialized prompt for MCQ and math problems with detailed reasoning
        const mcqPrompt = `You are an expert at solving multiple choice questions, math problems, and academic questions with exceptional accuracy.

CRITICAL INSTRUCTIONS:
1. Read the question carefully and understand what is being asked
2. For math problems:
   - Show your step-by-step calculations and reasoning
   - Perform all arithmetic operations accurately
   - Double-check your work for calculation errors
   - Verify your answer against the given options
3. For conceptual MCQ questions:
   - Analyze each option carefully
   - Explain why incorrect options are wrong
   - Explain why the correct option is right
   - Use your knowledge to provide accurate reasoning
4. After providing your complete reasoning and logic, you MUST end with a single line in this EXACT format:
   FINAL ANSWER: [letter or number]
   
   Where [letter or number] is ONLY:
   - A single letter (A, B, C, or D) if options are labeled with letters
   - A single number (1, 2, 3, or 4) if options are numbered
   - Nothing else - no punctuation, no extra text

EXAMPLES:

Question: "What is 15 × 12? A) 150 B) 180 C) 200 D) 165"
Your response:
Let me calculate 15 × 12 step by step:
15 × 12 = 15 × (10 + 2)
= (15 × 10) + (15 × 2)
= 150 + 30
= 180

Checking the options:
A) 150 - This would be 15 × 10, incorrect
B) 180 - This matches our calculation, correct
C) 200 - Too high
D) 165 - This is 15 × 11, incorrect

FINAL ANSWER: B

Question: "Which planet is closest to the Sun? 1) Venus 2) Mercury 3) Earth 4) Mars"
Your response:
Let me analyze each option:
1) Venus - This is the second planet from the Sun
2) Mercury - This is the first planet from the Sun, closest to it
3) Earth - This is the third planet from the Sun
4) Mars - This is the fourth planet from the Sun

Mercury orbits the Sun at an average distance of about 58 million km, making it the closest planet to the Sun.

FINAL ANSWER: 2

Now solve this question with complete reasoning and end with "FINAL ANSWER: [letter/number]":`;

        let result = "";
        if (groqApiKey) {
          result = await callGroq(request.payload.text, groqApiKey, groqModel, mcqPrompt);
        } else if (openrouterApiKey) {
          result = await callOpenRouter(request.payload.text, openrouterApiKey, openrouterModel, mcqPrompt);
        } else if (geminiApiKey) {
          result = await callGemini(request.payload.text, geminiApiKey, geminiModel, mcqPrompt);
        } else if (openaiApiKey) {
          result = await callOpenAI(request.payload.text, openaiApiKey, openaiModel, mcqPrompt);
        } else {
          throw new Error("Missing Groq API key for Text Feature. Please set your Groq API Key in settings.");
        }

        sendResponse({ success: true, data: result });
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true; // Keep message channel open for async response
  }
});

