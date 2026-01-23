(() => {
  // Get settings from storage
  const getSettings = () =>
    new Promise((resolve) => {
      chrome.storage.local.get([
        "hotkeyType", "modifierKey", "actionKey", "singleKey",
        "mcqEnabled", "mcqHotkeyType", "mcqModifierKey", "mcqActionKey", "mcqSingleKey"
      ], (result) => {
        resolve({
          hotkeyType: result.hotkeyType || "combination",
          modifierKey: result.modifierKey || "alt",
          actionKey: result.actionKey || "Enter",
          singleKey: result.singleKey || "Enter",
          mcqEnabled: result.mcqEnabled || false,
          mcqHotkeyType: result.mcqHotkeyType || "combination",
          mcqModifierKey: result.mcqModifierKey || "alt",
          mcqActionKey: result.mcqActionKey || "m",
          mcqSingleKey: result.mcqSingleKey || "m"
        });
      });
    });

  let settings = { 
    hotkeyType: "combination", modifierKey: "alt", actionKey: "Enter", singleKey: "Enter",
    mcqEnabled: false, mcqHotkeyType: "combination", mcqModifierKey: "alt", mcqActionKey: "m", mcqSingleKey: "m"
  };

  // Load settings
  const loadSettings = async () => {
    settings = await getSettings();
    console.log("[Content] Settings loaded:", settings);
  };

  // Check if the pressed keys match the regular hotkey
  const isHotkeyPressed = (event) => {
    const { hotkeyType, modifierKey, actionKey, singleKey } = settings;
    
    if (hotkeyType === "single") {
      // Single key mode - just check if the key matches
      return event.key === singleKey;
    } else {
      // Combination mode - check modifier + action key
      let modifierPressed = false;
      switch (modifierKey) {
        case "alt":
          modifierPressed = event.altKey;
          break;
        case "ctrl":
          modifierPressed = event.ctrlKey;
          break;
        case "shift":
          modifierPressed = event.shiftKey;
          break;
        case "meta":
          modifierPressed = event.metaKey;
          break;
      }
      
      // Check action key
      const actionPressed = event.key === actionKey;
      
      return modifierPressed && actionPressed;
    }
  };

  // Check if the pressed keys match the MCQ hotkey
  const isMcqHotkeyPressed = (event) => {
    if (!settings.mcqEnabled) {
      console.log("[Content] MCQ not enabled, returning false");
      return false;
    }
    
    const { mcqHotkeyType, mcqModifierKey, mcqActionKey, mcqSingleKey } = settings;
    console.log(`[Content] MCQ settings - Type: ${mcqHotkeyType}, Modifier: ${mcqModifierKey}, Action: ${mcqActionKey}, Single: ${mcqSingleKey}`);
    
    if (mcqHotkeyType === "single") {
      // Single key mode - just check if the key matches
      const matches = event.key === mcqSingleKey;
      console.log(`[Content] Single key mode: event.key=${event.key}, mcqSingleKey=${mcqSingleKey}, matches=${matches}`);
      return matches;
    } else {
      // Combination mode - check modifier + action key
      let modifierPressed = false;
      switch (mcqModifierKey) {
        case "alt":
          modifierPressed = event.altKey;
          break;
        case "ctrl":
          modifierPressed = event.ctrlKey;
          break;
        case "shift":
          modifierPressed = event.shiftKey;
          break;
        case "meta":
          modifierPressed = event.metaKey;
          break;
      }
      
      // Check action key
      const actionPressed = event.key === mcqActionKey;
      const matches = modifierPressed && actionPressed;
      
      console.log(`[Content] Combination mode: modifier=${modifierPressed}, action=${actionPressed}, matches=${matches}`);
      return matches;
    }
  };

  const getSelectedText = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return "";
    }
    
    // Get only the actual selected range, not the entire page
    const range = selection.getRangeAt(0);
    let selectedText = range.toString();
    
    // Preserve formatting by default - just trim outer whitespace
    selectedText = selectedText.trim();
    
    // Limit to reasonable length to avoid sending entire pages
    if (selectedText.length > 5000) {
      console.warn("[Content] Selection too long, truncating to 5000 characters");
      return selectedText.substring(0, 5000);
    }
    
    return selectedText;
  };

  // Extract answer option from AI response
  const extractAnswerOption = (response) => {
    if (!response) return null;
    
    const cleanResponse = response.trim();
    console.log("[Content] Extracting answer from:", cleanResponse);
    
    // First, check if it's just a single letter (most common case)
    const singleLetter = cleanResponse.match(/^([A-Z])$/);
    if (singleLetter) {
      console.log("[Content] Found single letter answer:", singleLetter[1]);
      return singleLetter[1];
    }
    
    // Check for single letter at the start (ignoring any prefix)
    const letterAtStart = cleanResponse.match(/^.*?([A-Z])/);
    if (letterAtStart) {
      console.log("[Content] Found letter at start:", letterAtStart[1]);
      return letterAtStart[1];
    }
    
    // Look for patterns like "A)", "B.", "C:", "Option D", etc.
    const patterns = [
      /([A-Z])\s*[).]/g,           // A) or A. or A:
      /Option\s*([A-Z])/gi,        // Option A
      /Answer\s*([A-Z])/gi,        // Answer A
      /Correct\s*([A-Z])/gi,       // Correct A
      /([A-Z])\s*is\s*correct/gi,  // A is correct
      /\b([A-Z])\b/g               // Any standalone letter
    ];
    
    for (const pattern of patterns) {
      const matches = cleanResponse.match(pattern);
      if (matches && matches.length > 0) {
        // Extract the letter from the first match
        const letter = matches[0].match(/[A-Z]/);
        if (letter) {
          console.log("[Content] Found letter via pattern:", letter[0]);
          return letter[0].toUpperCase();
        }
      }
    }
    
    console.warn("[Content] Could not extract answer from response:", cleanResponse);
    return null;
  };

  // Find and click the MCQ option
  const selectMcqOption = (answerLetter) => {
    if (!answerLetter) {
      console.warn("[Content] Could not extract answer option from AI response");
      return false;
    }
    
    console.log(`[Content] Looking for option ${answerLetter} to select`);
    
    // First, try to find any input elements (radio/checkbox) that might be related
    const allInputs = document.querySelectorAll('input[type="radio"], input[type="checkbox"]');
    console.log(`[Content] Found ${allInputs.length} input elements`);
    
    // Try different selectors to find MCQ options
    const selectors = [
      `input[type="radio"][value*="${answerLetter}"]`,
      `input[type="checkbox"][value*="${answerLetter}"]`,
      `[data-answer*="${answerLetter}"]`,
      `.option-${answerLetter.toLowerCase()}`,
      `*[data-option="${answerLetter}"]`,
      `input[name*="answer"][value*="${answerLetter}"]`,
      `input[name*="choice"][value*="${answerLetter}"]`
    ];
    
    for (const selector of selectors) {
      try {
        const element = document.querySelector(selector);
        if (element) {
          // Check if element is visible and clickable
          const rect = element.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            element.click();
            console.log(`[Content] Successfully clicked option ${answerLetter} via selector: ${selector}`);
            return true;
          } else {
            console.log(`[Content] Element found but not visible: ${selector}`);
          }
        }
      } catch (err) {
        console.log(`[Content] Selector ${selector} failed:`, err);
      }
    }
    
    // Try to find labels containing the answer letter
    const labels = document.querySelectorAll('label');
    console.log(`[Content] Found ${labels.length} label elements`);
    
    for (const label of labels) {
      const labelText = label.textContent.trim();
      if (labelText.startsWith(answerLetter + ')') || 
          labelText.startsWith(answerLetter + '.') ||
          labelText.startsWith(answerLetter + ' ') ||
          labelText.includes('Option ' + answerLetter) ||
          labelText.match(new RegExp(`^${answerLetter}[).\\s]`, 'i'))) {
        try {
          // Check if label is visible
          const rect = label.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            label.click();
            console.log(`[Content] Successfully clicked label containing option ${answerLetter}: ${labelText.substring(0, 50)}...`);
            return true;
          } else {
            console.log(`[Content] Label found but not visible: ${labelText.substring(0, 50)}...`);
          }
        } catch (err) {
          console.log(`[Content] Failed to click label:`, err);
        }
      }
    }
    
    // Try to find any clickable element with the answer letter
    const clickableElements = document.querySelectorAll('button, div[onclick], span[onclick], [role="button"], [role="option"]');
    console.log(`[Content] Found ${clickableElements.length} clickable elements`);
    
    for (const element of clickableElements) {
      const text = element.textContent.trim();
      if (text === answerLetter || text === answerLetter + ')' || text === answerLetter + '.' || text.startsWith(answerLetter + ' ')) {
        try {
          const rect = element.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            element.click();
            console.log(`[Content] Successfully clicked clickable element with text: ${text}`);
            return true;
          }
        } catch (err) {
          console.log(`[Content] Failed to click clickable element:`, err);
        }
      }
    }
    
    // Last resort: try any element with the answer letter
    const allElements = document.querySelectorAll('*');
    for (const element of allElements) {
      if (element.children.length === 0) { // Only leaf nodes
        const text = element.textContent.trim();
        if (text === answerLetter || text === answerLetter + ')' || text === answerLetter + '.') {
          try {
            const rect = element.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              element.click();
              console.log(`[Content] Successfully clicked element with text: ${text}`);
              return true;
            }
          } catch (err) {
            // Continue trying
          }
        }
      }
    }
    
    console.warn(`[Content] Could not find option ${answerLetter} to click`);
    return false;
  };

  const handleRegularText = async (event, selectedText) => {
    const hotkeyDesc = settings.hotkeyType === "single" ? settings.singleKey : `${settings.modifierKey}+${settings.actionKey}`;
    console.log(`[Content] ${hotkeyDesc} detected with text:`, selectedText);
    event.preventDefault();

    try {
      console.log("[Content] Sending message to background...");
      
      if (!chrome.runtime || !chrome.runtime.sendMessage) {
        console.warn("[Content] Extension context not available - please reload the extension");
        return;
      }
      
      try {
        chrome.runtime.id;
      } catch (contextErr) {
        console.warn("[Content] Extension context invalidated - please reload the extension");
        return;
      }
      
      chrome.runtime.sendMessage(
        {
          type: "PROCESS_SELECTED_TEXT",
          payload: { text: selectedText }
        },
        async (response) => {
          if (chrome.runtime.lastError) {
            if (chrome.runtime.lastError.message.includes("Extension context invalidated")) {
              console.warn("[Content] Extension context invalidated - please reload the extension");
              return;
            }
            console.error("AI response error:", chrome.runtime.lastError.message);
            return;
          }
          
          console.log("[Content] Received response:", response);
          try {
            if (!response || !response.success) {
              console.error("AI response error:", response?.error || "Unknown error");
              return;
            }

            console.log("[Content] Attempting to copy to clipboard:", response.data);
            
            try {
              await navigator.clipboard.writeText(response.data);
              console.info("[Content] AI response copied to clipboard using navigator.clipboard.");
            } catch (clipboardErr) {
              console.warn("[Content] navigator.clipboard failed, trying fallback:", clipboardErr);
              
              try {
                const textArea = document.createElement("textarea");
                textArea.value = response.data;
                textArea.style.position = "fixed";
                textArea.style.opacity = "0";
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand("copy");
                document.body.removeChild(textArea);
                console.info("[Content] AI response copied to clipboard using fallback method.");
              } catch (fallbackErr) {
                console.error("[Content] Both clipboard methods failed:", fallbackErr);
                throw fallbackErr;
              }
            }
          } catch (err) {
            console.error("Handler error:", err);
          }
        }
      );
    } catch (err) {
      if (err.message && err.message.includes("Extension context invalidated")) {
        console.warn("[Content] Extension context invalidated - please reload the extension");
        return;
      } else {
        console.error("[Content] Unexpected error:", err);
      }
    }
  };

  const handleMcqText = async (event, selectedText) => {
    const mcqHotkeyDesc = settings.mcqHotkeyType === "single" ? settings.mcqSingleKey : `${settings.mcqModifierKey}+${settings.mcqActionKey}`;
    console.log(`[Content] MCQ ${mcqHotkeyDesc} detected with text:`, selectedText);
    event.preventDefault();

    try {
      console.log("[Content] Sending MCQ message to background...");
      
      if (!chrome.runtime || !chrome.runtime.sendMessage) {
        console.warn("[Content] Extension context not available - please reload the extension");
        return;
      }
      
      try {
        chrome.runtime.id;
      } catch (contextErr) {
        console.warn("[Content] Extension context invalidated - please reload the extension");
        return;
      }
      
      chrome.runtime.sendMessage(
        {
          type: "PROCESS_MCQ_TEXT",
          payload: { text: selectedText }
        },
        async (response) => {
          if (chrome.runtime.lastError) {
            if (chrome.runtime.lastError.message.includes("Extension context invalidated")) {
              console.warn("[Content] Extension context invalidated - please reload the extension");
              return;
            }
            console.error("MCQ AI response error:", chrome.runtime.lastError.message);
            return;
          }
          
          console.log("[Content] Received MCQ response:", response);
          try {
            if (!response || !response.success) {
              console.error("MCQ AI response error:", response?.error || "Unknown error");
              return;
            }

            console.log("[Content] MCQ AI response:", response.data);
            
            // Wait a moment for any dynamic content to load
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Extract answer option and click it
            const answerLetter = extractAnswerOption(response.data);
            if (answerLetter) {
              console.log(`[Content] Extracted answer: ${answerLetter}, attempting to select...`);
              
              // Try multiple times with delays for dynamic content
              let success = false;
              for (let attempt = 0; attempt < 3; attempt++) {
                success = selectMcqOption(answerLetter);
                if (success) {
                  console.info(`[Content] Successfully selected option ${answerLetter} on attempt ${attempt + 1}`);
                  break;
                }
                
                // Wait before retry
                if (attempt < 2) {
                  await new Promise(resolve => setTimeout(resolve, 200));
                  console.log(`[Content] Retrying option selection (attempt ${attempt + 2})`);
                }
              }
              
              if (!success) {
                console.warn(`[Content] Failed to select option ${answerLetter} after 3 attempts, copying to clipboard instead`);
                await navigator.clipboard.writeText(response.data);
              }
            } else {
              console.warn("[Content] Could not extract answer option, copying to clipboard");
              await navigator.clipboard.writeText(response.data);
            }
          } catch (err) {
            console.error("MCQ Handler error:", err);
          }
        }
      );
    } catch (err) {
      if (err.message && err.message.includes("Extension context invalidated")) {
        console.warn("[Content] Extension context invalidated - please reload the extension");
        return;
      } else {
        console.error("[Content] Unexpected MCQ error:", err);
      }
    }
  };

  const handleKeydown = async (event) => {
    const isRegularHotkey = isHotkeyPressed(event);
    const isMcqHotkey = isMcqHotkeyPressed(event);
    
    // Debug logging
    console.log(`[Content] Key pressed: ${event.key}, Alt: ${event.altKey}, Ctrl: ${event.ctrlKey}, Shift: ${event.shiftKey}, Meta: ${event.metaKey}`);
    console.log(`[Content] MCQ Enabled: ${settings.mcqEnabled}, MCQ Hotkey Type: ${settings.mcqHotkeyType}`);
    console.log(`[Content] Regular hotkey: ${isRegularHotkey}, MCQ hotkey: ${isMcqHotkey}`);
    
    if (!isRegularHotkey && !isMcqHotkey) {
      return;
    }

    const selectedText = getSelectedText();
    if (!selectedText) {
      if (isRegularHotkey) {
        const hotkeyDesc = settings.hotkeyType === "single" ? settings.singleKey : `${settings.modifierKey}+${settings.actionKey}`;
        console.log(`[Content] ${hotkeyDesc} pressed but no text selected.`);
      } else if (isMcqHotkey) {
        const mcqHotkeyDesc = settings.mcqHotkeyType === "single" ? settings.mcqSingleKey : `${settings.mcqModifierKey}+${settings.mcqActionKey}`;
        console.log(`[Content] MCQ ${mcqHotkeyDesc} pressed but no text selected.`);
      }
      return;
    }

    if (isRegularHotkey) {
      console.log("[Content] Processing regular text...");
      await handleRegularText(event, selectedText);
    } else if (isMcqHotkey) {
      console.log("[Content] Processing MCQ text...");
      await handleMcqText(event, selectedText);
    }
  };

  // Initialize
  const init = async () => {
    await loadSettings();
    window.addEventListener("keydown", handleKeydown, true);
    const hotkeyDesc = settings.hotkeyType === "single" ? settings.singleKey : `${settings.modifierKey}+${settings.actionKey}`;
    console.log(`[Content] ${hotkeyDesc} listener attached.`);
  };

  // Listen for settings changes
  chrome.storage.onChanged.addListener(async (changes, namespace) => {
    if (namespace === "local" && (
      changes.hotkeyType || changes.modifierKey || changes.actionKey || changes.singleKey ||
      changes.mcqEnabled || changes.mcqHotkeyType || changes.mcqModifierKey || changes.mcqActionKey || changes.mcqSingleKey
    )) {
      await loadSettings();
      console.log("[Content] Settings updated:", settings);
    }
  });

  // Test function for debugging MCQ
  window.testMcqSelection = () => {
    console.log("[Content] Testing MCQ selection...");
    const testAnswer = "A";
    const success = selectMcqOption(testAnswer);
    console.log(`[Content] Test result for option ${testAnswer}:`, success);
  };

  // Test function for debugging answer extraction
  window.testAnswerExtraction = (response) => {
    console.log("[Content] Testing answer extraction...");
    const answer = extractAnswerOption(response);
    console.log(`[Content] Extracted answer:`, answer);
    return answer;
  };

  init();
})();
