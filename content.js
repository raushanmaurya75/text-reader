(() => {
  // Get settings from storage
  const getSettings = () =>
    new Promise((resolve) => {
      chrome.storage.local.get([
        "hotkeyType", "modifierKey", "actionKey", "singleKey",
        "mcqEnabled", "mcqHotkeyType", "mcqModifierKey", "mcqActionKey", "mcqSingleKey",
        "questionSolvingEnabled", "questionSolvingHotkeyType", "questionSolvingModifierKey", "questionSolvingActionKey", "questionSolvingSingleKey", "autoSolveDelay", "questionDetectionSensitivity"
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
          mcqSingleKey: result.mcqSingleKey || "m",
          questionSolvingEnabled: result.questionSolvingEnabled || false,
          questionSolvingHotkeyType: result.questionSolvingHotkeyType || "combination",
          questionSolvingModifierKey: result.questionSolvingModifierKey || "alt",
          questionSolvingActionKey: result.questionSolvingActionKey || "s",
          questionSolvingSingleKey: result.questionSolvingSingleKey || "s",
          autoSolveDelay: result.autoSolveDelay || 0,
          questionDetectionSensitivity: result.questionDetectionSensitivity || "medium"
        });
      });
    });

  let settings = { 
    hotkeyType: "combination", modifierKey: "alt", actionKey: "Enter", singleKey: "Enter",
    mcqEnabled: false, mcqHotkeyType: "combination", mcqModifierKey: "alt", mcqActionKey: "m", mcqSingleKey: "m",
    questionSolvingEnabled: false, questionSolvingHotkeyType: "combination", questionSolvingModifierKey: "alt", questionSolvingActionKey: "s", questionSolvingSingleKey: "s", autoSolveDelay: 0, questionDetectionSensitivity: "medium"
  };

  // Load settings
  const loadSettings = async () => {
    settings = await getSettings();
  };

  // Check if the pressed keys match the regular hotkey
  const isHotkeyPressed = (event) => {
    const { hotkeyType, modifierKey, actionKey, singleKey } = settings;
    
    if (hotkeyType === "single") {
      return event.key === singleKey;
    } else {
      let modifierPressed = false;
      switch (modifierKey) {
        case "alt": modifierPressed = event.altKey; break;
        case "ctrl": modifierPressed = event.ctrlKey; break;
        case "shift": modifierPressed = event.shiftKey; break;
        case "meta": modifierPressed = event.metaKey; break;
      }
      const actionPressed = event.key === actionKey;
      return modifierPressed && actionPressed;
    }
  };

  // Check if the pressed keys match the MCQ hotkey
  const isMcqHotkeyPressed = (event) => {
    if (!settings.mcqEnabled) return false;
    
    const { mcqHotkeyType, mcqModifierKey, mcqActionKey, mcqSingleKey } = settings;
    
    if (mcqHotkeyType === "single") {
      return event.key === mcqSingleKey;
    } else {
      let modifierPressed = false;
      switch (mcqModifierKey) {
        case "alt": modifierPressed = event.altKey; break;
        case "ctrl": modifierPressed = event.ctrlKey; break;
        case "shift": modifierPressed = event.shiftKey; break;
        case "meta": modifierPressed = event.metaKey; break;
      }
      const actionPressed = event.key === mcqActionKey;
      return modifierPressed && actionPressed;
    }
  };

  // Check if the pressed keys match the question solving hotkey
  const isQuestionSolvingHotkeyPressed = (event) => {
    if (!settings.questionSolvingEnabled) return false;
    
    const { questionSolvingHotkeyType, questionSolvingModifierKey, questionSolvingActionKey, questionSolvingSingleKey } = settings;
    
    if (questionSolvingHotkeyType === "single") {
      return event.key === questionSolvingSingleKey;
    } else {
      let modifierPressed = false;
      switch (questionSolvingModifierKey) {
        case "alt": modifierPressed = event.altKey; break;
        case "ctrl": modifierPressed = event.ctrlKey; break;
        case "shift": modifierPressed = event.shiftKey; break;
        case "meta": modifierPressed = event.metaKey; break;
      }
      const actionPressed = event.key === questionSolvingActionKey;
      return modifierPressed && actionPressed;
    }
  };

  const getSelectedText = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return "";
    
    const range = selection.getRangeAt(0);
    let selectedText = range.toString();
    selectedText = selectedText.trim();
    
    if (selectedText.length > 5000) {
      return selectedText.substring(0, 5000);
    }
    
    return selectedText;
  };

  // Extract answer option from AI response
  const extractAnswerOption = (response) => {
    if (!response) return null;
    
    const cleanResponse = response.trim();
    
    if (cleanResponse.length < 2) {
      return null;
    }
    
    // Single letter
    const singleLetter = cleanResponse.match(/^([A-Z])$/);
    if (singleLetter) {
      return singleLetter[1];
    }
    
    // Letter with punctuation at start
    const letterAtStart = cleanResponse.match(/^([a-zA-Z])[\.\)\s]/);
    if (letterAtStart) {
      return letterAtStart[1].toUpperCase();
    }
    
    // First letter
    const letterAtVeryStart = cleanResponse.match(/^([a-zA-Z])/);
    if (letterAtVeryStart) {
      return letterAtVeryStart[1].toUpperCase();
    }
    
    // Patterns
    const patterns = [
      /^([a-zA-Z])[\.\)\s]/,
      /\b([a-zA-Z])[\.\)\s]/,
      /Option\s+([a-zA-Z])/gi,
      /Answer\s+([a-zA-Z])/gi,
      /\b([a-zA-Z])\b/g
    ];
    
    for (const pattern of patterns) {
      const matches = cleanResponse.match(pattern);
      if (matches && matches.length > 0) {
        const letter = matches[1] || matches[0].match(/[a-zA-Z]/);
        if (letter) {
          return letter[0].toUpperCase();
        }
      }
    }
    
    // Checkbox-style answers
    const checkboxPatterns = [
      /(\d+(?:st|nd|rd|th))/gi,
      /(\d+)/g,
      /(first|second|third|fourth|fifth)/gi
    ];
    
    for (const pattern of checkboxPatterns) {
      const matches = cleanResponse.match(pattern);
      if (matches && matches.length > 0) {
        return matches[0].toLowerCase();
      }
    }
    
    // True/false
    const tfPatterns = [/\b(true|false|yes|no|correct|incorrect)\b/gi];
    for (const pattern of tfPatterns) {
      const matches = cleanResponse.match(pattern);
      if (matches && matches.length > 0) {
        return matches[0].toLowerCase();
      }
    }
    
    return null;
  };

  // Find and click the MCQ option
  const selectMcqOption = async (answerLetter) => {
    if (!answerLetter) return false;
    
    const isCheckboxStyle = !/^[A-Z]$/i.test(answerLetter);
    
    if (isCheckboxStyle) {
      return await selectCheckboxOption(answerLetter);
    }
    
    return selectLetterOption(answerLetter);
  };

  // Handle letter-based options (A, B, C, D)
  const selectLetterOption = (answerLetter) => {
    const allInputs = document.querySelectorAll('input[type="radio"], input[type="checkbox"]');
    
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
          const rect = element.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            element.click();
            return true;
          }
        }
      } catch (err) {
        // Continue trying
      }
    }
    
    const labels = document.querySelectorAll('label');
    for (const label of labels) {
      const labelText = label.textContent.trim();
      if (labelText.startsWith(answerLetter + ')') || 
          labelText.startsWith(answerLetter + '.') ||
          labelText.startsWith(answerLetter + ' ') ||
          labelText.includes('Option ' + answerLetter) ||
          labelText.match(new RegExp(`^${answerLetter}[).\\s]`, 'i'))) {
        try {
          const rect = label.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            label.click();
            return true;
          }
        } catch (err) {
          // Continue trying
        }
      }
    }
    
    const clickableElements = document.querySelectorAll('button, div[onclick], span[onclick], [role="button"], [role="option"]');
    for (const element of clickableElements) {
      const text = element.textContent.trim();
      if (text === answerLetter || text === answerLetter + ')' || text === answerLetter + '.' || text.startsWith(answerLetter + ' ')) {
        try {
          const rect = element.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            element.click();
            return true;
          }
        } catch (err) {
          // Continue trying
        }
      }
    }
    
    const allElements = document.querySelectorAll('*');
    for (const element of allElements) {
      if (element.children.length === 0) {
        const text = element.textContent.trim();
        if (text === answerLetter || text === answerLetter + ')' || text === answerLetter + '.') {
          try {
            const rect = element.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              element.click();
              return true;
            }
          } catch (err) {
            // Continue trying
          }
        }
      }
    }
    
    return false;
  };

  // Handle checkbox-style options
  const selectCheckboxOption = async (answerValue) => {
    // Fill-in-the-blank
    if (answerValue.length >= 2 && !answerValue.match(/^\d+$/) && 
        !answerValue.match(/first|second|third|fourth|fifth/) && 
        !answerValue.match(/true|false|yes|no/)) {
      return false;
    }
    
    // Numeric answers
    let targetPosition = null;
    if (answerValue.match(/^\d+$/)) {
      targetPosition = parseInt(answerValue) - 1;
    } else if (answerValue.match(/\d+(?:st|nd|rd|th)/)) {
      const match = answerValue.match(/\d+/);
      targetPosition = parseInt(match[0]) - 1;
    } else if (answerValue.match(/first|second|third|fourth|fifth/)) {
      const positionMap = { 'first': 0, 'second': 1, 'third': 2, 'fourth': 3, 'fifth': 4 };
      targetPosition = positionMap[answerValue.toLowerCase()];
    }
    
    const checkboxes = document.querySelectorAll('input[type="checkbox"], input[type="radio"]');
    
    if (targetPosition !== null && targetPosition >= 0 && targetPosition < checkboxes.length) {
      const targetCheckbox = checkboxes[targetPosition];
      try {
        const rect = targetCheckbox.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          targetCheckbox.click();
          return true;
        }
      } catch (err) {
        // Continue trying
      }
    }
    
    return false;
  };

  const handleRegularText = async (event, selectedText) => {
    event.preventDefault();

    try {
      if (!chrome.runtime || !chrome.runtime.sendMessage) {
        return;
      }
      
      chrome.runtime.sendMessage(
        { type: "PROCESS_SELECTED_TEXT", payload: { text: selectedText } },
        async (response) => {
          if (chrome.runtime.lastError) {
            return;
          }
          
          if (!response || !response.success) {
            return;
          }

          try {
            await navigator.clipboard.writeText(response.data);
          } catch (clipboardErr) {
            // Fallback method
            try {
              const textArea = document.createElement("textarea");
              textArea.value = response.data;
              textArea.style.position = "fixed";
              textArea.style.opacity = "0";
              document.body.appendChild(textArea);
              textArea.select();
              document.execCommand("copy");
              document.body.removeChild(textArea);
            } catch (fallbackErr) {
              // Silent failure
            }
          }
        }
      );
    } catch (err) {
      // Silent error handling
    }
  };

  const handleMcqText = async (event, selectedText) => {
    event.preventDefault();

    try {
      if (!chrome.runtime || !chrome.runtime.sendMessage) {
        return;
      }
      
      chrome.runtime.sendMessage(
        { type: "PROCESS_MCQ_TEXT", payload: { text: selectedText } },
        async (response) => {
          if (chrome.runtime.lastError) {
            return;
          }
          
          if (!response || !response.success) {
            return;
          }
          
          const answerLetter = extractAnswerOption(response.data);
          if (answerLetter) {
            const success = await selectMcqOption(answerLetter);
            if (!success) {
              try {
                await navigator.clipboard.writeText(response.data);
              } catch (clipboardErr) {
                // Silent failure
              }
            }
          } else {
            try {
              await navigator.clipboard.writeText(response.data);
            } catch (clipboardErr) {
              // Silent failure
            }
          }
        }
      );
    } catch (err) {
      // Silent error handling
    }
  };

  // Question detection
  const detectMcqQuestions = () => {
    const questions = [];
    const sensitivity = settings.questionDetectionSensitivity;
    
    let patterns = [];
    if (sensitivity === "high") {
      patterns = [
        /\b(what|which|who|when|where|why|how|select|choose|identify|determine)\b.*\?/gi,
        /\([A-D]\)/g, /\b[A-D]\)\s*/g, /\b[A-D]\.\s*/g,
        /\[\s*\]\s*/g, /\(\s*\)/g,
        /\b(true|false|yes|no|correct|incorrect)\b/gi
      ];
    } else if (sensitivity === "medium") {
      patterns = [
        /\b(what|which|who|when|where|why|how)\b.*\?/gi,
        /\([A-D]\)/g, /\b[A-D]\)\s*/g, /\b[A-D]\.\s*/g,
        /\[\s*\]\s*/g
      ];
    } else {
      patterns = [/\b(what|which)\b.*\?/gi, /\([A-D]\)/g];
    }
    
    const allElements = document.querySelectorAll('*');
    const questionElements = new Set();
    
    for (const element of allElements) {
      if (element.tagName === 'SCRIPT' || element.tagName === 'STYLE' || 
          element.offsetParent === null || element.hidden) {
        continue;
      }
      
      const text = element.textContent.trim();
      if (text.length > 15 && text.length < 2000) {
        let isQuestion = false;
        
        for (const pattern of patterns) {
          if (pattern.test(text)) {
            isQuestion = true;
            break;
          }
        }
        
        if (!isQuestion && sensitivity !== "low") {
          const hasQuestionMark = text.includes('?');
          const hasOptions = text.match(/[A-D]\)/g) || text.match(/\[\s*\]/g);
          
          if (hasQuestionMark && hasOptions) {
            isQuestion = true;
          }
          
          const checkboxes = element.querySelectorAll('input[type="checkbox"], input[type="radio"]');
          if (checkboxes.length >= 2 && hasQuestionMark) {
            isQuestion = true;
          }
          
          if (hasQuestionMark && text.match(/\b(true|false|yes|no)\b/gi)) {
            isQuestion = true;
          }
        }
        
        if (isQuestion) {
          const rect = element.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            questionElements.add(element);
          }
        }
      }
    }
    
    questionElements.forEach(element => {
      const rect = element.getBoundingClientRect();
      questions.push({
        element: element,
        text: element.textContent.trim(),
        rect: rect,
        score: calculateQuestionScore(element.textContent.trim())
      });
    });
    
    questions.sort((a, b) => b.score - a.score);
    
    return questions;
  };

  const calculateQuestionScore = (text) => {
    let score = 0;
    
    if (text.includes('?')) score += 10;
    
    const questionWords = ['what', 'which', 'who', 'when', 'where', 'why', 'how', 'select', 'choose', 'identify', 'determine'];
    questionWords.forEach(word => {
      if (text.toLowerCase().includes(word)) score += 5;
    });
    
    const optionPatterns = [/\([A-D]\)/g, /\b[A-D]\)\s*/g, /\b[A-D]\.\s*/g, /\b[A-D]\s+/g];
    optionPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) score += matches.length * 3;
    });
    
    const checkboxPatterns = [/\[\s*\]/g, /\(\s*\)/g, /☐/g, /◯/g];
    checkboxPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) score += matches.length * 2;
    });
    
    if (text.length < 30) score -= 5;
    if (text.length > 1000) score -= 5;
    
    const optionCount = (text.match(/[A-D]/g) || []).length;
    if (optionCount >= 2) score += optionCount * 2;
    
    const checkboxCount = (text.match(/\[\s*\]/g) || []).length + (text.match(/\(\s*\)/g) || []).length;
    if (checkboxCount >= 2) score += checkboxCount * 2;
    
    return Math.max(0, score);
  };

  const findBestQuestion = () => {
    const questions = detectMcqQuestions();
    if (questions.length === 0) {
      return null;
    }
    
    const viewportCenter = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    let bestQuestion = null;
    let bestScore = -1;
    
    for (const question of questions) {
      const questionCenter = {
        x: question.rect.left + question.rect.width / 2,
        y: question.rect.top + question.rect.height / 2
      };
      
      const distance = Math.sqrt(
        Math.pow(questionCenter.x - viewportCenter.x, 2) +
        Math.pow(questionCenter.y - viewportCenter.y, 2)
      );
      
      const proximityBonus = Math.max(0, 100 - distance / 10);
      const combinedScore = question.score + proximityBonus;
      
      if (combinedScore > bestScore) {
        bestScore = combinedScore;
        bestQuestion = question;
      }
    }
    
    return bestQuestion;
  };

  const solveQuestion = async (question) => {
    if (!chrome.runtime || !chrome.runtime.sendMessage) {
      throw new Error('Extension context not available');
    }
    
    if (settings.autoSolveDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, settings.autoSolveDelay * 1000));
    }
    
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        { type: "PROCESS_MCQ_TEXT", payload: { text: question.text } },
        async (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          
          if (!response || !response.success) {
            reject(new Error(response?.error || "Unknown error"));
            return;
          }
          
          const answerLetter = extractAnswerOption(response.data);
          if (answerLetter) {
            const success = await selectMcqOption(answerLetter);
            if (success) {
              resolve(answerLetter);
            } else {
              try {
                await navigator.clipboard.writeText(response.data);
                resolve(answerLetter);
              } catch (clipboardError) {
                reject(new Error('Failed to select option and copy to clipboard'));
              }
            }
          } else {
            try {
              await navigator.clipboard.writeText(response.data);
              resolve(response.data);
            } catch (clipboardError) {
              reject(new Error('Could not extract answer and failed to copy to clipboard'));
            }
          }
        }
      );
    });
  };

  const handleQuestionSolving = async (event) => {
    event.preventDefault();

    try {
      const question = findBestQuestion();
      if (!question) {
        return;
      }
      
      await solveQuestion(question);
      
    } catch (error) {
      // Silent error handling
    }
  };

  const handleKeydown = async (event) => {
    const isRegularHotkey = isHotkeyPressed(event);
    const isMcqHotkey = isMcqHotkeyPressed(event);
    const isQuestionSolvingHotkey = isQuestionSolvingHotkeyPressed(event);
    
    if (!isRegularHotkey && !isMcqHotkey && !isQuestionSolvingHotkey) {
      return;
    }

    if (isQuestionSolvingHotkey) {
      await handleQuestionSolving(event);
      return;
    }

    const selectedText = getSelectedText();
    if (!selectedText) {
      if (isRegularHotkey) {
        const hotkeyDesc = settings.hotkeyType === "single" ? settings.singleKey : `${settings.modifierKey}+${settings.actionKey}`;
      } else if (isMcqHotkey) {
        const mcqHotkeyDesc = settings.mcqHotkeyType === "single" ? settings.mcqSingleKey : `${settings.mcqModifierKey}+${settings.mcqActionKey}`;
      }
      return;
    }

    if (isRegularHotkey) {
      await handleRegularText(event, selectedText);
    } else if (isMcqHotkey) {
      await handleMcqText(event, selectedText);
    }
  };

  // Initialize
  const init = async () => {
    await loadSettings();
    window.addEventListener("keydown", handleKeydown, true);
    
    if (settings.questionSolvingEnabled) {
      const questionSolvingHotkeyDesc = settings.questionSolvingHotkeyType === "single" ? settings.questionSolvingSingleKey : `${settings.questionSolvingModifierKey}+${settings.questionSolvingActionKey}`;
    }
  };

  // Listen for settings changes
  chrome.storage.onChanged.addListener(async (changes, namespace) => {
    if (namespace === "local" && (
      changes.hotkeyType || changes.modifierKey || changes.actionKey || changes.singleKey ||
      changes.mcqEnabled || changes.mcqHotkeyType || changes.mcqModifierKey || changes.mcqActionKey || changes.mcqSingleKey ||
      changes.questionSolvingEnabled || changes.questionSolvingHotkeyType || changes.questionSolvingModifierKey || changes.questionSolvingActionKey || changes.questionSolvingSingleKey || changes.autoSolveDelay || changes.questionDetectionSensitivity
    )) {
      await loadSettings();
    }
  });

  init();
})();
