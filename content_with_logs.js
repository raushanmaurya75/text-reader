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

  // Check if the pressed keys match the question solving hotkey
  const isQuestionSolvingHotkeyPressed = (event) => {
    if (!settings.questionSolvingEnabled) {
      console.log("[Content] Question solving not enabled, returning false");
      return false;
    }
    
    const { questionSolvingHotkeyType, questionSolvingModifierKey, questionSolvingActionKey, questionSolvingSingleKey } = settings;
    console.log(`[Content] Question solving settings - Type: ${questionSolvingHotkeyType}, Modifier: ${questionSolvingModifierKey}, Action: ${questionSolvingActionKey}, Single: ${questionSolvingSingleKey}`);
    
    if (questionSolvingHotkeyType === "single") {
      // Single key mode - just check if the key matches
      const matches = event.key === questionSolvingSingleKey;
      console.log(`[Content] Question solving single key mode: event.key=${event.key}, questionSolvingSingleKey=${questionSolvingSingleKey}, matches=${matches}`);
      return matches;
    } else {
      // Combination mode - check modifier + action key
      let modifierPressed = false;
      switch (questionSolvingModifierKey) {
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
      const actionPressed = event.key === questionSolvingActionKey;
      const matches = modifierPressed && actionPressed;
      
      console.log(`[Content] Question solving combination mode: modifier=${modifierPressed}, action=${actionPressed}, matches=${matches}`);
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

  // Helper function to force aggressive DOM refresh
  const forceDOMRefresh = async () => {
    console.log('[Content] Forcing aggressive DOM refresh...');
    
    // Multiple reflow triggers
    for (let i = 0; i < 5; i++) {
      document.body.offsetHeight; // Trigger reflow
      document.documentElement.offsetHeight; // Trigger document reflow
      
      // Force layout recalculation
      const styles = window.getComputedStyle(document.body);
      const width = styles.width;
      const height = styles.height;
      
      // Small delay between refreshes
      await new Promise(resolve => setTimeout(resolve, 20));
    }
    
    // Clear any potential cached references
    if (window.getSelection) {
      window.getSelection().removeAllRanges();
    }
    
    console.log('[Content] DOM refresh completed');
  };

  // Helper function to clear stale states and cached references
  const clearStaleStates = async () => {
    console.log('[Content] Clearing stale states...');
    
    // Clear any existing selections globally
    const allChecked = document.querySelectorAll('input[type="radio"]:checked, input[type="checkbox"]:checked');
    if (allChecked.length > 0) {
      console.log(`[Content] Clearing ${allChecked.length} existing selections globally`);
      allChecked.forEach(input => {
        try {
          input.checked = false;
          input.dispatchEvent(new Event('change', { bubbles: true }));
          input.dispatchEvent(new Event('input', { bubbles: true }));
        } catch (err) {
          // Ignore errors during clearing
        }
      });
    }
    
    // Clear any focus states
    if (document.activeElement && document.activeElement !== document.body) {
      document.activeElement.blur();
    }
    
    // Reset any custom data attributes that might be stale
    const elementsWithData = document.querySelectorAll('[data-selected], [data-answered], [data-chosen]');
    elementsWithData.forEach(element => {
      try {
        element.removeAttribute('data-selected');
        element.removeAttribute('data-answered');
        element.removeAttribute('data-chosen');
      } catch (err) {
        // Ignore errors
      }
    });
    
    // Force garbage collection hint
    if (window.gc) {
      try {
        window.gc();
      } catch (err) {
        // Ignore if gc is not available
      }
    }
    
    console.log('[Content] Stale states cleared');
  };

  // Extract answer option from AI response
  const extractAnswerOption = (response) => {
    if (!response) return null;
    
    const cleanResponse = response.trim();
    console.log("[Content] Extracting answer from:", cleanResponse);
    
    // Handle very short responses (might be incomplete)
    if (cleanResponse.length < 2) {
      console.warn("[Content] Response too short, might be incomplete:", cleanResponse);
      return null;
    }
    
    // First, check if it's just a single letter (most common case)
    const singleLetter = cleanResponse.match(/^([A-Z])$/);
    if (singleLetter) {
      console.log("[Content] Found single letter answer:", singleLetter[1]);
      return singleLetter[1];
    }
    
    // Check for single letter at the start (ignoring any prefix) - more precise
    const letterAtStart = cleanResponse.match(/^([a-zA-Z])[\.\)\s]/);
    if (letterAtStart) {
      console.log("[Content] Found letter with punctuation:", letterAtStart[1]);
      return letterAtStart[1].toUpperCase();
    }
    
    // Fallback: check for letter at very start
    const letterAtVeryStart = cleanResponse.match(/^([a-zA-Z])/);
    if (letterAtVeryStart) {
      console.log("[Content] Found letter at very start:", letterAtVeryStart[1]);
      return letterAtVeryStart[1].toUpperCase();
    }
    
    // Look for patterns like "A)", "B.", "C:", "Option D", etc. - more precise patterns
    const patterns = [
      /^([a-zA-Z])[\.\)\s]/,           // A. or A) or A at start
      /\b([a-zA-Z])[\.\)\s]/,          // A. or A) or A as word boundary
      /Option\s+([a-zA-Z])/gi,         // Option A
      /Answer\s+([a-zA-Z])/gi,         // Answer A
      /Correct\s+([a-zA-Z])/gi,        // Correct A
      /([a-zA-Z])\s+is\s+correct/gi,   // A is correct
      /\b([a-zA-Z])\b/g                // Any standalone letter (last resort)
    ];
    
    for (const pattern of patterns) {
      const matches = cleanResponse.match(pattern);
      if (matches && matches.length > 0) {
        // Extract the letter from the first match
        const letter = matches[1] || matches[0].match(/[a-zA-Z]/);
        if (letter) {
          console.log("[Content] Found letter via pattern:", pattern.toString(), "->", letter[0]);
          return letter[0].toUpperCase();
        }
      }
    }
    
    // Handle checkbox-style answers (numbers, positions, descriptions)
    const checkboxPatterns = [
      /(\d+(?:st|nd|rd|th))/gi,           // 1st, 2nd, 3rd, 4th
      /(\d+)/g,                           // Just numbers
      /(first|second|third|fourth|fifth)/gi, // Position words
      /(option\s*\d+)/gi,                 // option 1, option 2
      /(choice\s*\d+)/gi                  // choice 1, choice 2
    ];
    
    for (const pattern of checkboxPatterns) {
      const matches = cleanResponse.match(pattern);
      if (matches && matches.length > 0) {
        console.log("[Content] Found checkbox-style answer:", matches[0]);
        return matches[0].toLowerCase(); // Return as lowercase for checkbox handling
      }
    }
    
    // Handle true/false answers
    const tfPatterns = [
      /\b(true|false|yes|no|correct|incorrect)\b/gi
    ];
    
    for (const pattern of tfPatterns) {
      const matches = cleanResponse.match(pattern);
      if (matches && matches.length > 0) {
        console.log("[Content] Found true/false answer:", matches[0]);
        return matches[0].toLowerCase();
      }
    }
    
    // Handle fill-in-the-blank answers (words, phrases)
    if (cleanResponse.length >= 2 && !cleanResponse.match(/[A-Z]\)|[A-Z]\.|[A-D]/)) {
      // This might be a fill-in-the-blank answer
      console.log("[Content] Possible fill-in-the-blank answer:", cleanResponse);
      
      // For fill-in-the-blank answers, return false to trigger clipboard fallback
      return null;
    }
    
    console.warn("[Content] Could not extract answer from response:", cleanResponse);
    return null;
  };

  // Find and click the MCQ option
  const selectMcqOption = async (answerLetter) => {
    if (!answerLetter) {
      console.warn("[Content] Could not extract answer option from AI response");
      return false;
    }
    
    console.log(`[Content] Looking for option ${answerLetter} to select`);
    
    // Aggressive DOM refresh and state clearing
    await forceDOMRefresh();
    await clearStaleStates();
    
    // Check if this is a checkbox-style answer (number, position word, etc.)
    const isCheckboxStyle = !/^[A-Z]$/i.test(answerLetter);
    
    if (isCheckboxStyle) {
      return await selectCheckboxOption(answerLetter);
    }
    
    // Traditional letter-based selection
    return selectLetterOption(answerLetter);
  };

  // Handle letter-based options (A, B, C, D)
  const selectLetterOption = (answerLetter) => {
    console.log(`[Content] Selecting letter option: ${answerLetter}`);
    
    // Force multiple DOM refresh cycles to ensure latest elements
    for (let i = 0; i < 3; i++) {
      document.body.offsetHeight; // Trigger reflow
      // Small delay to allow DOM to update
      const start = Date.now();
      while (Date.now() - start < 50) {
        // Wait 50ms
      }
    }
    
    // First, try to find any input elements (radio/checkbox) that might be related
    const allInputs = document.querySelectorAll('input[type="radio"], input[type="checkbox"]');
    console.log(`[Content] Found ${allInputs.length} input elements`);
    
    // Enhanced selectors for different website types
    const selectors = [
      // Standard HTML patterns
      `input[type="radio"][value*="${answerLetter}" i]`,
      `input[type="checkbox"][value*="${answerLetter}" i]`,
      `[data-answer*="${answerLetter}" i]`,
      `.option-${answerLetter.toLowerCase()}`,
      `*[data-option="${answerLetter}"]`,
      `input[name*="answer"][value*="${answerLetter}" i]`,
      `input[name*="choice"][value*="${answerLetter}" i]`,
      
      // Common educational platform patterns
      `input[id*="${answerLetter.toLowerCase()}"]`,
      `input[class*="${answerLetter.toLowerCase()}"]`,
      `*[id*="option"][id*="${answerLetter.toLowerCase()}" i]`,
      `*[class*="option"][class*="${answerLetter.toLowerCase()}" i]`,
      
      // Generic patterns
      `input[value*="${answerLetter}" i]`,
      `*[data-choice*="${answerLetter}" i]`,
      `*[data-answer*="${answerLetter}" i]`,
      
      // Framework-specific patterns (React, Vue, etc.)
      `[data-testid*="${answerLetter.toLowerCase()}"]`,
      `[data-test*="${answerLetter.toLowerCase()}"]`,
      `[aria-label*="${answerLetter}" i]`,
      `[title*="${answerLetter}" i]`
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
    
    // Enhanced label detection for different website types
    const labelSelectors = [
      'label',
      '.label',
      '.option-label',
      '.choice-label',
      '.answer-label',
      '[role="label"]',
      '[role="option"]',
      '.option',
      '.choice',
      '.answer-option',
      'div[class*="option"]',
      'span[class*="option"]',
      'li[class*="option"]',
      'td[class*="option"]'
    ];
    
    for (const selector of labelSelectors) {
      try {
        const elements = document.querySelectorAll(selector);
        console.log(`[Content] Checking ${elements.length} ${selector} elements`);
        
        for (const element of elements) {
          const text = element.textContent.trim();
          const elementVisible = element.getBoundingClientRect().width > 0 && element.getBoundingClientRect().height > 0;
          
          if (!elementVisible) continue;
          
          // Enhanced text matching patterns
          const patterns = [
            new RegExp(`^${answerLetter}[).\s]`, 'i'),           // A), A., A
            new RegExp(`^Option\s+${answerLetter}`, 'i'),          // Option A
            new RegExp(`^Choice\s+${answerLetter}`, 'i'),          // Choice A
            new RegExp(`^Answer\s+${answerLetter}`, 'i'),          // Answer A
            new RegExp(`\\(${answerLetter}[).\s]`, 'i'),          // (A), (A., (A
            new RegExp(`\\[${answerLetter}[].\s]`, 'i'),          // [A], [A., [A
            new RegExp(`^${answerLetter}\\s+[).:]`, 'i'),        // A), A., A:
            new RegExp(`\\b${answerLetter}\\b`, 'i')              // Standalone A
          ];
          
          for (const pattern of patterns) {
            if (pattern.test(text)) {
              try {
                element.click();
                console.log(`[Content] Successfully clicked ${selector} with pattern "${pattern}": ${text.substring(0, 50)}...`);
                return true;
              } catch (err) {
                console.log(`[Content] Failed to click ${selector}:`, err);
              }
            }
          }
        }
      } catch (err) {
        console.log(`[Content] Selector ${selector} failed:`, err);
      }
    }
    
    // Enhanced clickable element detection
    const clickableSelectors = [
      'button',
      'div[onclick]',
      'span[onclick]',
      '[role="button"]',
      '[role="option"]',
      '[role="radio"]',
      '[role="checkbox"]',
      '.btn',
      '.button',
      '.choice-btn',
      '.option-btn',
      'a[href*="#"]',
      '.clickable',
      '[tabindex="0"]',
      '.selectable',
      '.answer-choice'
    ];
    
    for (const selector of clickableSelectors) {
      try {
        const elements = document.querySelectorAll(selector);
        console.log(`[Content] Checking ${elements.length} ${selector} elements`);
        
        for (const element of elements) {
          const text = element.textContent.trim();
          const elementVisible = element.getBoundingClientRect().width > 0 && element.getBoundingClientRect().height > 0;
          
          if (!elementVisible) continue;
          
          // Enhanced text matching for clickable elements
          if (text === answerLetter || 
              text === answerLetter + ')' || 
              text === answerLetter + '.' || 
              text.startsWith(answerLetter + ' ') ||
              text.startsWith(answerLetter + ')') ||
              text.startsWith(answerLetter + '.') ||
              text.match(new RegExp(`^${answerLetter}[).\s]`, 'i')) ||
              text.match(new RegExp(`\\b${answerLetter}\\b`, 'i'))) {
            try {
              element.click();
              console.log(`[Content] Successfully clicked ${selector} with text: ${text}`);
              return true;
            } catch (err) {
              console.log(`[Content] Failed to click ${selector}:`, err);
            }
          }
        }
      } catch (err) {
        console.log(`[Content] Selector ${selector} failed:`, err);
      }
    }
    
    // Enhanced fallback: try any element with the answer letter
    const allElements = document.querySelectorAll('*');
    console.log(`[Content] Checking ${allElements.length} total elements as fallback`);
    
    for (const element of allElements) {
      if (element.children.length === 0) { // Only leaf nodes
        const text = element.textContent.trim();
        const elementVisible = element.getBoundingClientRect().width > 0 && element.getBoundingClientRect().height > 0;
        
        if (!elementVisible) continue;
        
        // Enhanced text matching for any element
        if (text === answerLetter || 
            text === answerLetter + ')' || 
            text === answerLetter + '.' || 
            text.match(new RegExp(`^${answerLetter}[).\s]`, 'i')) ||
            text.match(new RegExp(`\\b${answerLetter}\\b`, 'i'))) {
          try {
            // Try multiple click methods
            const clickMethods = [
              () => element.click(),
              () => { const event = new MouseEvent('click', { bubbles: true }); element.dispatchEvent(event); },
              () => { const event = new Event('click', { bubbles: true }); element.dispatchEvent(event); }
            ];
            
            for (const clickMethod of clickMethods) {
              try {
                clickMethod();
                console.log(`[Content] Successfully clicked element with text: ${text}`);
                return true;
              } catch (clickErr) {
                // Try next click method
                continue;
              }
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

  
  // Handle checkbox-style options (numbers, positions, true/false)
  const selectCheckboxOption = async (answerValue) => {
    console.log(`[Content] Selecting checkbox-style option: ${answerValue}`);
    
    // Aggressive DOM refresh
    for (let i = 0; i < 3; i++) {
      document.body.offsetHeight; // Trigger reflow
      const start = Date.now();
      while (Date.now() - start < 50) {
        // Wait 50ms
      }
    }
    
    // Check if this is a fill-in-the-blank answer (word/phrase)
    // But allow numbers (like "3") to pass through for checkbox selection
    if (answerValue.length >= 2 && !answerValue.match(/^\d+$/) && !answerValue.match(/first|second|third|fourth|fifth/) && !answerValue.match(/true|false|yes|no/)) {
      console.log(`[Content] Detected fill-in-the-blank answer: ${answerValue}`);
      // For fill-in-the-blank, return false to trigger clipboard fallback
      return false;
    }
    
    // Convert answer to position/number
    let targetPosition = null;
    let targetText = null;
    
    // Handle numeric answers
    if (answerValue.match(/^\d+$/)) {
      targetPosition = parseInt(answerValue) - 1; // Convert to 0-based index
    }
    // Handle ordinal answers (1st, 2nd, etc.)
    else if (answerValue.match(/\d+(?:st|nd|rd|th)/)) {
      const match = answerValue.match(/\d+/);
      targetPosition = parseInt(match[0]) - 1;
    }
    // Handle position words
    else if (answerValue.match(/first|second|third|fourth|fifth/)) {
      const positionMap = {
        'first': 0, 'second': 1, 'third': 2, 'fourth': 3, 'fifth': 4
      };
      targetPosition = positionMap[answerValue.toLowerCase()];
    }
    // Handle true/false
    else if (answerValue.match(/true|false|yes|no|correct|incorrect/)) {
      targetText = answerValue.toLowerCase();
    }
    
    // Find all checkboxes/radio buttons, but prioritize those near the question
    let checkboxes = document.querySelectorAll('input[type="checkbox"], input[type="radio"]');
    console.log(`[Content] Found ${checkboxes.length} checkboxes/radio buttons total`);
    
    // Filter out already checked/selected elements to avoid conflicts
    checkboxes = Array.from(checkboxes).filter(checkbox => !checkbox.checked);
    console.log(`[Content] Filtered to ${checkboxes.length} unchecked checkboxes/radio buttons`);
    
    // Try to find checkboxes associated with the current question
    // Look for checkboxes in the same container or nearby elements
    const questionContainerSelectors = [
      // Standard question containers
      '.question',
      '.quiz-question', 
      '.mcq-question',
      '[class*="question"]',
      
      // Educational platform specific containers
      '.quiz-container',
      '.question-container',
      '.test-question',
      '.exam-question',
      '.assessment-question',
      '.question-item',
      '.question-block',
      '.question-wrapper',
      '.question-box',
      '.question-card',
      
      // Common educational platform patterns
      '.problem',
      '.exercise',
      '.task',
      '.item',
      '.choice-container',
      '.option-container',
      '.answer-container',
      '.response-container',
      
      // Generic patterns
      '[class*="quiz"]',
      '[class*="test"]',
      '[class*="exam"]',
      '[class*="assessment"]',
      '[class*="problem"]',
      '[class*="exercise"]',
      '[class*="task"]',
      
      // Framework specific patterns
      '[data-question]',
      '[data-quiz]',
      '[data-test]',
      '[data-item]',
      '[data-problem]',
      
      // Role-based patterns
      '[role="group"]',
      '[role="radiogroup"]',
      '[role="list"]',
      '[role="region"]'
    ];
    
    let questionContainer = null;
    for (const selector of questionContainerSelectors) {
      questionContainer = document.querySelector(selector);
      if (questionContainer) {
        console.log(`[Content] Found question container: ${selector}`);
        break;
      }
    }
    
    if (questionContainer) {
      const nearbyCheckboxes = Array.from(questionContainer.querySelectorAll('input[type="checkbox"], input[type="radio"]'))
        .filter(checkbox => !checkbox.checked);
      if (nearbyCheckboxes.length > 0) {
        checkboxes = nearbyCheckboxes;
        console.log(`[Content] Found ${checkboxes.length} unchecked checkboxes near question container`);
      }
    }
    
    // If we still have too many checkboxes, try to find the most relevant ones
    if (checkboxes.length > 10) {
      // Look for checkboxes that are likely part of this question
      const relevantCheckboxes = Array.from(checkboxes).filter(checkbox => {
        const rect = checkbox.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        // Only consider checkboxes in the current viewport and not already checked
        return rect.top >= 0 && rect.top <= viewportHeight && !checkbox.checked;
      });
      
      if (relevantCheckboxes.length > 0 && relevantCheckboxes.length <= 10) {
        checkboxes = relevantCheckboxes;
        console.log(`[Content] Filtered to ${checkboxes.length} relevant unchecked checkboxes in viewport`);
      }
    }
    
    if (targetPosition !== null && targetPosition >= 0 && targetPosition < checkboxes.length) {
      // Select by position
      const targetCheckbox = checkboxes[targetPosition];
      try {
        // Double-check that the checkbox is still valid and not already checked
        const rect = targetCheckbox.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0 && !targetCheckbox.checked) {
          // Scroll into view if needed
          if (rect.top < 0 || rect.top > window.innerHeight) {
            targetCheckbox.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await new Promise(resolve => setTimeout(resolve, 300));
          }
          
          targetCheckbox.click();
          console.log(`[Content] Successfully clicked checkbox at position ${targetPosition + 1}`);
          return true;
        } else {
          console.log(`[Content] Checkbox at position ${targetPosition + 1} is already checked or not visible`);
        }
      } catch (err) {
        console.log(`[Content] Failed to click checkbox at position ${targetPosition + 1}:`, err);
      }
    }
    
    if (targetText) {
      // Select by text content (for true/false)
      for (const checkbox of checkboxes) {
        const label = checkbox.closest('label') || document.querySelector(`label[for="${checkbox.id}"]`);
        if (label) {
          const labelText = label.textContent.trim().toLowerCase();
          if (labelText.includes(targetText) && !checkbox.checked) {
            try {
              const rect = checkbox.getBoundingClientRect();
              if (rect.width > 0 && rect.height > 0) {
                checkbox.click();
                console.log(`[Content] Successfully clicked checkbox with text: ${targetText}`);
                return true;
              }
            } catch (err) {
              console.log(`[Content] Failed to click checkbox with text ${targetText}:`, err);
            }
          }
        }
      }
    }
    
    // Enhanced fallback: try to find checkboxes associated with numbered options
    if (targetPosition !== null) {
      // Look for numbered options with checkboxes - more precise detection
      const allElements = document.querySelectorAll('div, li, td, tr, p, span');
      let foundOptions = [];
      
      for (const element of allElements) {
        const text = element.textContent.trim();
        // Look for patterns like "1. Option text", "1) Option text", etc.
        const match = text.match(/^(\d+)[\.\)\s]\s*(.+)/);
        if (match) {
          const optionNumber = parseInt(match[1]);
          const optionText = match[2];
          
          // Check if this element or its children contain a checkbox
          let checkbox = element.querySelector('input[type="checkbox"], input[type="radio"]');
          
          // If not found, look in parent or sibling elements
          if (!checkbox) {
            checkbox = element.parentElement.querySelector('input[type="checkbox"], input[type="radio"]');
          }
          
          // If still not found, look in nearby elements
          if (!checkbox) {
            const parent = element.closest('li, tr, div');
            if (parent) {
              checkbox = parent.querySelector('input[type="checkbox"], input[type="radio"]');
            }
          }
          
          if (checkbox && !checkbox.checked) {
            foundOptions.push({ 
              element: element, 
              checkbox: checkbox, 
              text: text,
              number: optionNumber,
              optionText: optionText
            });
          }
        }
      }
      
      // Remove duplicates and sort by option number
      const uniqueOptions = foundOptions.filter((option, index, self) => 
        index === self.findIndex((t) => t.checkbox === option.checkbox)
      );
      
      uniqueOptions.sort((a, b) => a.number - b.number);
      
      console.log(`[Content] Found ${uniqueOptions.length} unique numbered options with checkboxes:`, 
        uniqueOptions.map(opt => ({number: opt.number, text: opt.optionText.substring(0, 20)})));
      
      if (targetPosition < uniqueOptions.length) {
        const targetOption = uniqueOptions[targetPosition];
        try {
          // Double-check checkbox is still valid and not checked
          const rect = targetOption.checkbox.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0 && !targetOption.checkbox.checked) {
            // Scroll the checkbox into view if needed
            if (rect.top < 0 || rect.top > window.innerHeight) {
              targetOption.checkbox.scrollIntoView({ behavior: 'smooth', block: 'center' });
              // Wait a bit for scroll to complete
              await new Promise(resolve => setTimeout(resolve, 500));
            }
            
            targetOption.checkbox.click();
            console.log(`[Content] Successfully clicked checkbox for option ${targetOption.number}: ${targetOption.optionText.substring(0, 30)}...`);
            return true;
          } else {
            console.log(`[Content] Checkbox for option ${targetOption.number} is already checked or not visible`);
          }
        } catch (err) {
          console.log(`[Content] Failed to click checkbox for option ${targetOption.number}:`, err);
        }
      } else {
        console.warn(`[Content] Target position ${targetPosition} is out of range. Found ${uniqueOptions.length} options.`);
      }
    }
    
    // Final fallback: try to find elements with checkbox symbols
    const checkboxSymbols = ['☐', '◯', '□', '○'];
    for (const symbol of checkboxSymbols) {
      const elements = document.querySelectorAll('*');
      for (const element of elements) {
        if (element.children.length === 0) { // Only leaf nodes
          const text = element.textContent.trim();
          if (text.includes(symbol)) {
            // Check if this element matches our target
            const allCheckboxElements = Array.from(document.querySelectorAll('*'))
              .filter(el => el.children.length === 0 && el.textContent.trim().includes(symbol));
            
            const index = allCheckboxElements.indexOf(element);
            if (targetPosition !== null && index === targetPosition) {
              try {
                const rect = element.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0) {
                  element.click();
                  console.log(`[Content] Successfully clicked checkbox symbol at position ${targetPosition + 1}`);
                  return true;
                }
              } catch (err) {
                console.log(`[Content] Failed to click checkbox symbol:`, err);
              }
            }
          }
        }
      }
    }
    
    console.warn(`[Content] Could not find checkbox option ${answerValue} to click`);
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
              let lastError = null;
              
              for (let attempt = 0; attempt < 5; attempt++) {
                try {
                  // Force DOM refresh before each attempt
                  document.body.offsetHeight;
                  
                  success = selectMcqOption(answerLetter);
                  if (success) {
                    console.info(`[Content] Successfully selected option ${answerLetter} on attempt ${attempt + 1}`);
                    break;
                  }
                } catch (err) {
                  lastError = err;
                  console.log(`[Content] Attempt ${attempt + 1} failed:`, err.message);
                }
                
                // Wait before retry with exponential backoff
                if (attempt < 4) {
                  const delay = Math.min(200 * Math.pow(1.5, attempt), 1000); // Max 1 second
                  await new Promise(resolve => setTimeout(resolve, delay));
                  console.log(`[Content] Retrying option selection (attempt ${attempt + 2}) after ${delay}ms`);
                }
              }
              
              if (!success) {
                console.warn(`[Content] Failed to select option ${answerLetter} after 5 attempts`);
                if (lastError) {
                  console.error(`[Content] Last error: ${lastError.message}`);
                }
                console.log(`[Content] Copying to clipboard as fallback`);
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
    const isQuestionSolvingHotkey = isQuestionSolvingHotkeyPressed(event);
    
    // Debug logging
    console.log(`[Content] Key pressed: ${event.key}, Alt: ${event.altKey}, Ctrl: ${event.ctrlKey}, Shift: ${event.shiftKey}, Meta: ${event.metaKey}`);
    console.log(`[Content] MCQ Enabled: ${settings.mcqEnabled}, MCQ Hotkey Type: ${settings.mcqHotkeyType}`);
    console.log(`[Content] Question Solving Enabled: ${settings.questionSolvingEnabled}, Question Solving Hotkey Type: ${settings.questionSolvingHotkeyType}`);
    console.log(`[Content] Regular hotkey: ${isRegularHotkey}, MCQ hotkey: ${isMcqHotkey}, Question solving hotkey: ${isQuestionSolvingHotkey}`);
    
    if (!isRegularHotkey && !isMcqHotkey && !isQuestionSolvingHotkey) {
      return;
    }

    if (isQuestionSolvingHotkey) {
      console.log("[Content] Processing question solving...");
      await handleQuestionSolving(event);
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

  // Question Solving Mode Functions
  const detectMcqQuestions = () => {
    const questions = [];
    const sensitivity = settings.questionDetectionSensitivity;
    
    // Enhanced detection patterns based on sensitivity and website types
    let patterns = [];
    if (sensitivity === "high") {
      patterns = [
        // Question patterns with options
        /\b(what|which|who|when|where|why|how|select|choose|identify|determine)\b.*\?[\s\S]*?([A-D]\)|[A-D]\.|[A-D]\s|option\s*[A-D])/gi,
        // Questions with multiple choice indicators
        /\b(what|which|who|when|where|why|how|select|choose|identify)\b.*\?/gi,
        // Multiple choice option patterns (enhanced)
        /\([A-D]\)/g,
        /\b[A-D]\)\s*/g,
        /\b[A-D]\.\s*/g,
        /\b[A-D]\s+/g,
        /option\s*[A-D]/gi,
        /\b(correct|answer|select)\s*[A-D]/gi,
        
        // Educational platform specific patterns
        /\b(choose|select|pick)\s*the\s*(correct|right|best|appropriate)/gi,
        /\b(which\s*of\s*the\s*following|which\s*one|select\s*the\s*following)/gi,
        /\b(select\s*all\s*that\s*apply|choose\s*all\s*that\s*apply)/gi,
        
        // Numbered options with letters (enhanced)
        /\d+\.\s*[A-D]\)/g,
        /\d+\.\s*[A-D]\./g,
        /\d+\)\s*[A-D]\)/g,
        /\d+\)\s*[A-D]\./g,
        
        // Checkbox and radio button patterns (enhanced)
        /\[\s*\]\s*/g,
        /\(\s*\)\s*/g,
        /☐\s*/g,
        /◯\s*/g,
        /□\s*/g,
        /○\s*/g,
        
        // Unnumbered option patterns (enhanced)
        /\b(first|second|third|fourth|fifth)\s+(option|choice)/gi,
        /\b(one|two|three|four|five)\s+(option|choice)/gi,
        
        // True/False patterns (enhanced)
        /\b(true|false|yes|no|correct|incorrect|right|wrong)/gi,
        
        // Fill in the blank patterns (enhanced)
        /_{3,}/g,
        /\.{3,}/g,
        /\b(blank|fill|complete)\s*the\s*blank/gi,
        
        // Common educational platform indicators
        /\b(question|quiz|test|exam|assessment)\b/gi,
        /\b(multiple\s*choice|mcq|choice\s*question)\b/gi,
        
        // Interactive element patterns
        /\b(click|select|tap|choose)\s*the\s*answer/gi,
        /\b(answer\s*option|response\s*option)\b/gi
      ];
    } else if (sensitivity === "medium") {
      patterns = [
        // Question patterns with options
        /\b(what|which|who|when|where|why|how)\b.*\?[\s\S]*?([A-D]\)|[A-D]\.|[A-D]\s)/gi,
        // Questions with question marks
        /\b(what|which|who|when|where|why|how)\b.*\?/gi,
        // Multiple choice option patterns
        /\([A-D]\)/g,
        /\b[A-D]\)\s*/g,
        /\b[A-D]\.\s*/g,
        /\b[A-D]\s+/g,
        // Common MCQ patterns
        /\b(which\s*of\s*the\s*following|which\s*one)/gi,
        // Numbered options with letters
        /\d+\.\s*[A-D]\)/g,
        // Checkbox patterns
        /\[\s*\]\s*/g,
        /\(\s*\)\s*/g,
        // True/False patterns
        /\b(true|false|yes|no)\b/gi,
        // Select all that apply
        /\b(select\s+all\s+that\s+apply)/gi
      ];
    } else { // low
      patterns = [
        // Strict question patterns with options
        /\b(what|which)\b.*\?[\s\S]*?([A-D]\)|[A-D]\.)/gi,
        // Simple questions with question marks
        /\b(what|which)\b.*\?/gi,
        // Only clear option patterns
        /\([A-D]\)/g,
        /\b[A-D]\)\s*/g,
        /\b[A-D]\.\s*/g,
        // Basic checkbox patterns
        /\[\s*\]\s*/g
      ];
    }
    
    // Find all elements that might contain questions
    const allElements = document.querySelectorAll('*');
    const questionElements = new Set();
    
    for (const element of allElements) {
      // Skip script, style, and hidden elements
      if (element.tagName === 'SCRIPT' || element.tagName === 'STYLE' || 
          element.offsetParent === null || element.hidden) {
        continue;
      }
      
      const text = element.textContent.trim();
      
      // Check if element has reasonable length and contains question indicators
      if (text.length > 15 && text.length < 2000) {
        let isQuestion = false;
        
        // Check for question patterns
        for (const pattern of patterns) {
          if (pattern.test(text)) {
            isQuestion = true;
            break;
          }
        }
        
        // Additional checks for better detection
        if (!isQuestion && sensitivity !== "low") {
          // Check for question mark with various option indicators
          const hasQuestionMark = text.includes('?');
          const hasOptions = text.match(/[A-D]\)/g) || 
                            text.match(/[A-D]\./g) || 
                            text.match(/option\s*[A-D]/gi) ||
                            text.match(/\[\s*\]/g) ||
                            text.match(/\(\s*\)/g) ||
                            text.match(/☐/g) ||
                            text.match(/◯/g);
          
          if (hasQuestionMark && hasOptions) {
            isQuestion = true;
          }
          
          // Check for common MCQ phrases with any option indicators
          if (text.match(/\b(choose|select|pick|answer)\b/gi) && hasOptions) {
            isQuestion = true;
          }
          
          // Check for checkbox/radio button elements
          const checkboxes = element.querySelectorAll('input[type="checkbox"], input[type="radio"]');
          if (checkboxes.length >= 2 && hasQuestionMark) {
            isQuestion = true;
          }
          
          // Check for true/false questions
          if (hasQuestionMark && text.match(/\b(true|false|yes|no)\b/gi)) {
            isQuestion = true;
          }
        }
        
        if (isQuestion) {
          // Check if element is actually visible
          const rect = element.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            questionElements.add(element);
          }
        }
      }
    }
    
    // Convert to array and add question data
    questionElements.forEach(element => {
      const rect = element.getBoundingClientRect();
      const questionText = element.textContent.trim();
      questions.push({
        element: element,
        text: questionText,
        rect: rect,
        score: calculateQuestionScore(questionText),
        checkboxes: element.querySelectorAll('input[type="checkbox"], input[type="radio"]').length,
        hasCheckboxes: element.querySelectorAll('input[type="checkbox"], input[type="radio"]').length > 0
      });
    });
    
    // Sort by score (higher score = better question)
    questions.sort((a, b) => b.score - a.score);
    
    console.log(`\n📊 [Content] QUESTION DETECTION RESULTS:`);
    console.log(`🔢 [Content] Total questions found: ${questions.length}`);
    
    if (questions.length > 0) {
      console.log('\n📋 [Content] ALL DETECTED QUESTIONS (ranked by score):');
      questions.forEach((q, index) => {
        console.log(`\n${index + 1}. 🎯 Score: ${q.score}`);
        console.log(`   📝 Text: "${q.text.substring(0, 100)}${q.text.length > 100 ? '...' : ''}"`);
        console.log(`   🔢 Checkboxes: ${q.checkboxes || 0}`);
        console.log(`   ☑️ Has Checkboxes: ${q.hasCheckboxes || false}`);
        console.log(`   📍 Position: top=${Math.round(q.rect.top)}, left=${Math.round(q.rect.left)}`);
      });
      
      console.log(`\n🏆 [Content] BEST QUESTION (selected for solving):`);
      console.log(`   🎯 Score: ${questions[0].score}`);
      console.log(`   📝 Text: "${questions[0].text}"`);
      console.log(`   🔢 Checkboxes: ${questions[0].checkboxes || 0}`);
      console.log(`   ☑️ Has Checkboxes: ${questions[0].hasCheckboxes || false}`);
    } else {
      console.log('\n❌ [Content] NO QUESTIONS DETECTED');
      console.log('💡 [Content] Possible reasons:');
      console.log('   • No questions visible on screen');
      console.log('   • Detection sensitivity too low');
      console.log('   • Questions don\'t match detection patterns');
      console.log('   • Page still loading');
    }
    
    return questions;
  };

  // Calculate question quality score
  const calculateQuestionScore = (text) => {
    let score = 0;
    
    // Question mark gives base score
    if (text.includes('?')) score += 10;
    
    // Question words add points
    const questionWords = ['what', 'which', 'who', 'when', 'where', 'why', 'how', 'select', 'choose', 'identify', 'determine'];
    questionWords.forEach(word => {
      if (text.toLowerCase().includes(word)) score += 5;
    });
    
    // Traditional option patterns add points
    const optionPatterns = [/\([A-D]\)/g, /\b[A-D]\)\s*/g, /\b[A-D]\.\s*/g, /\b[A-D]\s+/g];
    optionPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) score += matches.length * 3;
    });
    
    // Checkbox and radio patterns add points
    const checkboxPatterns = [/\[\s*\]/g, /\(\s*\)/g, /☐/g, /◯/g];
    checkboxPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) score += matches.length * 2;
    });
    
    // Unnumbered option patterns
    if (text.match(/\b(first|second|third|fourth|fifth)\s+(option|choice)/gi)) score += 6;
    if (text.match(/\b(one|two|three|four|five)\s+(option|choice)/gi)) score += 4;
    
    // True/False patterns
    if (text.match(/\b(true|false|yes|no|correct|incorrect)\b/gi)) score += 4;
    
    // Fill in the blank patterns
    if (text.match(/_{3,}/g) || text.match(/\.{3,}/g)) score += 3;
    
    // Select all that apply patterns
    if (text.match(/\b(select\s+all\s+that\s+apply|choose\s+all\s+that\s+apply)/gi)) score += 7;
    
    // Common MCQ phrases add points
    if (text.match(/\b(which\s*of\s*the\s*following|which\s*one|select\s*the\s*following)/gi)) score += 8;
    if (text.match(/\b(choose|select|pick|answer)\s*the\s*(correct|right|best|appropriate)/gi)) score += 6;
    
    // Length penalty (too short or too long)
    if (text.length < 30) score -= 5;
    if (text.length > 1000) score -= 5;
    
    // Multiple options bonus
    const optionCount = (text.match(/[A-D]/g) || []).length;
    if (optionCount >= 2) score += optionCount * 2;
    
    // Checkbox count bonus
    const checkboxCount = (text.match(/\[\s*\]/g) || []).length + (text.match(/\(\s*\)/g) || []).length;
    if (checkboxCount >= 2) score += checkboxCount * 2;
    
    return Math.max(0, score);
  };

  const findBestQuestion = () => {
    const questions = detectMcqQuestions();
    if (questions.length === 0) {
      console.log('[Content] No questions detected, trying broader search...');
      // Try a broader search with lower threshold
      return findQuestionsWithBroaderSearch();
    }
    
    // Find the question closest to the center of the viewport with highest score
    const viewportCenter = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2
    };
    
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
      
      // Calculate combined score (question score + proximity bonus)
      const proximityBonus = Math.max(0, 100 - distance / 10); // Closer = higher bonus
      const combinedScore = question.score + proximityBonus;
      
      console.log(`[Content] Question score: ${question.score}, proximity: ${proximityBonus.toFixed(2)}, combined: ${combinedScore.toFixed(2)}`);
      
      if (combinedScore > bestScore) {
        bestScore = combinedScore;
        bestQuestion = question;
      }
    }
    
    console.log(`[Content] Best question selected with score: ${bestScore.toFixed(2)}`);
    return bestQuestion;
  };

  // Broader search for questions when initial detection fails
  const findQuestionsWithBroaderSearch = () => {
    console.log('\n🔍 [Content] PERFORMING BROADER QUESTION SEARCH...');
    console.log('🔎 [Content] Using relaxed detection criteria');
    const questions = [];
    let elementsChecked = 0;
    
    // Look for any element with question mark
    const allElements = document.querySelectorAll('*');
    console.log(`📊 [Content] Checking ${allElements.length} elements on page...`);
    
    for (const element of allElements) {
      elementsChecked++;
      
      // Skip script, style, and hidden elements
      if (element.tagName === 'SCRIPT' || element.tagName === 'STYLE' || 
          element.offsetParent === null || element.hidden) {
        continue;
      }
      
      const text = element.textContent.trim();
      
      // Very broad check for any question-like content
      if (text.length > 20 && text.length < 1500 && text.includes('?')) {
        // Check if it has any option-like content
        const hasOptions = text.match(/[A-D]/g) || 
                          text.match(/\d+\./g) || 
                          text.match(/option/gi) ||
                          text.match(/choose|select|answer/gi);
        
        if (hasOptions) {
          const rect = element.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            const score = calculateQuestionScore(text);
            questions.push({
              element: element,
              text: text,
              rect: rect,
              score: score
            });
            
            console.log(`✅ [Content] Found potential question (score: ${score}): "${text.substring(0, 80)}..."`);
          }
        }
      }
    }
    
    console.log(`📊 [Content] Broader search completed. Checked ${elementsChecked} elements.`);
    console.log(`🔢 [Content] Found ${questions.length} potential questions with broader criteria`);
    
    if (questions.length > 0) {
      // Sort by score and return the best one
      questions.sort((a, b) => b.score - a.score);
      console.log(`\n🏆 [Content] BEST QUESTION FROM BROADER SEARCH:`);
      console.log(`   🎯 Score: ${questions[0].score}`);
      console.log(`   📝 Text: "${questions[0].text}"`);
      console.log(`   📍 Position: top=${Math.round(questions[0].rect.top)}, left=${Math.round(questions[0].rect.left)}`);
      return questions[0];
    }
    
    console.log('\n❌ [Content] BROADER SEARCH: No questions found even with relaxed criteria');
    console.log('💡 [Content] Suggestions:');
    console.log('   • Try scrolling to make questions visible');
    console.log('   • Wait for page to fully load');
    console.log('   • Check if page actually contains MCQ questions');
    console.log('   • Try manual text selection instead');
    
    return null;
  };

  const solveQuestion = async (question) => {
    console.log('[Content] Solving question:', question.text);
    
    if (!chrome.runtime || !chrome.runtime.sendMessage) {
      throw new Error('Extension context not available');
    }
    
    // Aggressive DOM refresh and state clearing
    await forceDOMRefresh();
    await clearStaleStates();
    
    // Additional state clearing in question area
    const questionContainerSelectors = [
      '.question', '.quiz-question', '.mcq-question', '[class*="question"]',
      '.quiz-container', '.question-container', '.test-question', '.exam-question',
      '.assessment-question', '.question-item', '.question-block', '.question-wrapper',
      '.question-box', '.question-card', '.problem', '.exercise', '.task', '.item',
      '.choice-container', '.option-container', '.answer-container', '.response-container',
      '[class*="quiz"]', '[class*="test"]', '[class*="exam"]', '[class*="assessment"]',
      '[class*="problem"]', '[class*="exercise"]', '[class*="task"]',
      '[data-question]', '[data-quiz]', '[data-test]', '[data-item]', '[data-problem]',
      '[role="group"]', '[role="radiogroup"]', '[role="list"]', '[role="region"]'
    ];
    
    let questionArea = question.element;
    for (const selector of questionContainerSelectors) {
      const container = question.element.closest(selector);
      if (container) {
        questionArea = container;
        console.log(`[Content] Found question area: ${selector}`);
        break;
      }
    }
    
    // Multiple passes to clear selections in question area
    for (let pass = 0; pass < 3; pass++) {
      const existingSelections = questionArea.querySelectorAll('input[type="radio"]:checked, input[type="checkbox"]:checked');
      if (existingSelections.length > 0) {
        console.log(`[Content] Pass ${pass + 1}: Clearing ${existingSelections.length} existing selections in question area`);
        existingSelections.forEach(input => {
          try {
            input.checked = false;
            // Trigger multiple events to ensure UI updates
            input.dispatchEvent(new Event('change', { bubbles: true }));
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('click', { bubbles: true }));
          } catch (err) {
            console.log('[Content] Failed to clear existing selection:', err);
          }
        });
        
        // Small delay between passes
        await new Promise(resolve => setTimeout(resolve, 50));
      } else {
        break; // No more selections to clear
      }
    }
    
    // Add delay if configured
    if (settings.autoSolveDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, settings.autoSolveDelay * 1000));
    }
    
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: "PROCESS_MCQ_TEXT",
          payload: { text: question.text }
        },
        async (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          
          if (!response || !response.success) {
            reject(new Error(response?.error || "Unknown error"));
            return;
          }
          
          console.log('[Content] MCQ AI response:', response.data);
          
          // Extract answer option and click it
          const answerLetter = extractAnswerOption(response.data);
          if (answerLetter) {
            console.log(`[Content] Extracted answer: ${answerLetter}, attempting to select...`);
            
            // Try multiple times with delays for dynamic content
            let success = false;
            let lastError = null;
            
            for (let attempt = 0; attempt < 5; attempt++) {
              try {
                // Force DOM refresh before each attempt
                document.body.offsetHeight;
                
                success = selectMcqOption(answerLetter);
                if (success) {
                  console.info(`[Content] Successfully selected option ${answerLetter} on attempt ${attempt + 1}`);
                  break;
                }
              } catch (err) {
                lastError = err;
                console.log(`[Content] Attempt ${attempt + 1} failed:`, err.message);
              }
              
              // Wait before retry with exponential backoff
              if (attempt < 4) {
                const delay = Math.min(200 * Math.pow(1.5, attempt), 1000); // Max 1 second
                await new Promise(resolve => setTimeout(resolve, delay));
                console.log(`[Content] Retrying option selection (attempt ${attempt + 2}) after ${delay}ms`);
              }
            }
            
            if (success) {
              console.info(`[Content] Successfully selected option ${answerLetter}`);
              resolve(answerLetter);
            } else {
              console.warn(`[Content] Failed to select option ${answerLetter} after 5 attempts`);
              if (lastError) {
                console.error(`[Content] Last error: ${lastError.message}`);
              }
              // Try to copy to clipboard as fallback
              try {
                await navigator.clipboard.writeText(response.data);
                console.log('[Content] Answer copied to clipboard as fallback');
                resolve(answerLetter);
              } catch (clipboardError) {
                console.error('[Content] Failed to copy to clipboard:', clipboardError);
                reject(new Error('Failed to select option and copy to clipboard'));
              }
            }
          } else {
            console.warn('[Content] Could not extract answer option');
            // If we can't extract the answer, copy the full response to clipboard
            try {
              await navigator.clipboard.writeText(response.data);
              console.log('[Content] Full response copied to clipboard as fallback');
              resolve(response.data);
            } catch (clipboardError) {
              console.error('[Content] Failed to copy to clipboard:', clipboardError);
              reject(new Error('Could not extract answer and failed to copy to clipboard'));
            }
          }
        }
      );
    });
  };

  const handleQuestionSolving = async (event) => {
    console.log('='.repeat(80));
    console.log('🚀 [Content] QUESTION SOLVING MODE ACTIVATED');
    console.log('='.repeat(80));
    console.log('[Content] Question solving hotkey triggered');
    event.preventDefault();

    try {
      console.log('\n🔍 [Content] STEP 1: Detecting questions on page...');
      
      // Find the best question on the page
      const question = findBestQuestion();
      if (!question) {
        console.log('\n❌ [Content] RESULT: No MCQ questions detected on the page');
        console.log('💡 [Content] TIP: Try adjusting detection sensitivity in options');
        console.log('💡 [Content] TIP: Make sure questions are visible on screen');
        console.log('='.repeat(80));
        return;
      }

      console.log('\n✅ [Content] STEP 2: Question detected successfully!');
      console.log('📝 [Content] QUESTION TEXT:', question.text);
      console.log('🎯 [Content] QUESTION SCORE:', question.score);
      console.log('📍 [Content] QUESTION POSITION:', {
        top: Math.round(question.rect.top),
        left: Math.round(question.rect.left),
        width: Math.round(question.rect.width),
        height: Math.round(question.rect.height)
      });
      console.log('🔢 [Content] CHECKBOXES FOUND:', question.checkboxes || 0);
      console.log('☑️ [Content] HAS CHECKBOXES:', question.hasCheckboxes || false);
      
      console.log('\n🤖 [Content] STEP 3: Sending question to AI for analysis...');
      
      // Solve the question
      await solveQuestion(question);
      console.log('\n✅ [Content] STEP 4: Question solved successfully!');
      console.log('🎉 [Content] RESULT: Question processing completed');
      console.log('='.repeat(80));
      
    } catch (error) {
      console.error('\n❌ [Content] ERROR: Question solving failed');
      console.error('🔥 [Content] ERROR DETAILS:', error.message);
      console.error('📍 [Content] ERROR STACK:', error.stack);
      console.log('💡 [Content] TIP: Check if API key is set correctly');
      console.log('💡 [Content] TIP: Try refreshing the page');
      console.log('='.repeat(80));
    }
  };

  // Initialize
  const init = async () => {
    await loadSettings();
    window.addEventListener("keydown", handleKeydown, true);
    const hotkeyDesc = settings.hotkeyType === "single" ? settings.singleKey : `${settings.modifierKey}+${settings.actionKey}`;
    console.log(`[Content] ${hotkeyDesc} listener attached.`);
    
    // Initialize question solving mode
    if (settings.questionSolvingEnabled) {
      console.log('[Content] Question Solving Mode enabled with hotkey');
      const questionSolvingHotkeyDesc = settings.questionSolvingHotkeyType === "single" ? settings.questionSolvingSingleKey : `${settings.questionSolvingModifierKey}+${settings.questionSolvingActionKey}`;
      console.log(`[Content] Question solving hotkey: ${questionSolvingHotkeyDesc}`);
      
      // Set up dynamic content observer for question changes
      setupQuestionObserver();
    }
  };

  // Set up observer to detect when questions change
  const setupQuestionObserver = () => {
    console.log('[Content] Setting up aggressive question content observer');
    
    // Create a MutationObserver to watch for content changes
    const observer = new MutationObserver((mutations) => {
      let hasSignificantChange = false;
      let hasQuestionChange = false;
      let hasInputChange = false;
      
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Check if any added nodes contain question-like content
          for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const text = node.textContent || '';
              if (text.includes('?') || text.match(/\d+\./) || text.includes('option') || text.match(/[A-D]\)/)) {
                hasSignificantChange = true;
                hasQuestionChange = true;
                console.log('[Content] Detected new question content:', text.substring(0, 100));
                break;
              }
              
              // Also check for new input elements (checkboxes/radio buttons)
              const inputs = node.querySelectorAll ? node.querySelectorAll('input[type="checkbox"], input[type="radio"]') : [];
              if (inputs.length > 0) {
                hasSignificantChange = true;
                hasInputChange = true;
                console.log(`[Content] Detected ${inputs.length} new input elements`);
              }
              
              // Check for new button-like elements that might be options
              const buttons = node.querySelectorAll ? node.querySelectorAll('button, [role="button"], [role="option"]') : [];
              if (buttons.length > 0) {
                hasSignificantChange = true;
                console.log(`[Content] Detected ${buttons.length} new button elements`);
              }
            }
          }
        }
        
        if (mutation.type === 'characterData' && mutation.target.parentNode) {
          const text = mutation.target.textContent || '';
          if (text.includes('?') || text.match(/\d+\./) || text.match(/[A-D]\)/)) {
            hasSignificantChange = true;
            console.log('[Content] Detected text change in question:', text.substring(0, 100));
          }
        }
        
        // Check for attribute changes that might indicate question state changes
        if (mutation.type === 'attributes') {
          const element = mutation.target;
          if (element.classList.contains('question') || element.classList.contains('quiz') || element.textContent.includes('?')) {
            hasQuestionChange = true;
            console.log('[Content] Detected question attribute change:', mutation.attributeName);
          }
          
          // Check for changes in input elements
          if (element.tagName === 'INPUT' && (element.type === 'radio' || element.type === 'checkbox')) {
            hasInputChange = true;
            console.log('[Content] Detected input element change');
          }
        }
      }
      
      if (hasSignificantChange || hasQuestionChange || hasInputChange) {
        console.log('[Content] Detected significant content change, triggering aggressive refresh');
        
        // Force immediate DOM refresh and state clearing
        setTimeout(async () => {
          console.log('[Content] Performing aggressive refresh due to content change');
          await forceDOMRefresh();
          await clearStaleStates();
          console.log('[Content] Aggressive refresh completed, ready for new detection');
          
          // Additional auto-clear if this was a question change
          if (hasQuestionChange) {
            const allChecked = document.querySelectorAll('input[type="radio"]:checked, input[type="checkbox"]:checked');
            if (allChecked.length > 0) {
              console.log(`[Content] Auto-clearing ${allChecked.length} existing selections due to question change`);
              allChecked.forEach(input => {
                try {
                  input.checked = false;
                  input.dispatchEvent(new Event('change', { bubbles: true }));
                  input.dispatchEvent(new Event('input', { bubbles: true }));
                } catch (err) {
                  // Ignore errors during auto-clear
                }
              });
            }
          }
        }, 50); // Shorter delay for more responsive detection
      }
    });
    
    // Start observing the entire document with comprehensive options
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'disabled', 'checked', 'selected', 'data-*']
    });
    
    console.log('[Content] Aggressive question observer started with comprehensive monitoring');
  };

  // Listen for settings changes
  chrome.storage.onChanged.addListener(async (changes, namespace) => {
    if (namespace === "local" && (
      changes.hotkeyType || changes.modifierKey || changes.actionKey || changes.singleKey ||
      changes.mcqEnabled || changes.mcqHotkeyType || changes.mcqModifierKey || changes.mcqActionKey || changes.mcqSingleKey ||
      changes.questionSolvingEnabled || changes.questionSolvingHotkeyType || changes.questionSolvingModifierKey || changes.questionSolvingActionKey || changes.questionSolvingSingleKey || changes.autoSolveDelay || changes.questionDetectionSensitivity
    )) {
      await loadSettings();
      console.log("[Content] Settings updated:", settings);
      
      // Log question solving mode changes
      if (changes.questionSolvingEnabled || changes.questionSolvingHotkeyType) {
        if (settings.questionSolvingEnabled) {
          const questionSolvingHotkeyDesc = settings.questionSolvingHotkeyType === "single" ? settings.questionSolvingSingleKey : `${settings.questionSolvingModifierKey}+${settings.questionSolvingActionKey}`;
          console.log(`[Content] Question solving mode updated. Hotkey: ${questionSolvingHotkeyDesc}`);
        } else {
          console.log("[Content] Question solving mode disabled");
        }
      }
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

  // Test function for debugging question detection
  window.testQuestionDetection = () => {
    console.log("[Content] Testing question detection...");
    const questions = detectMcqQuestions();
    console.log(`[Content] Found ${questions.length} questions:`);
    questions.forEach((q, index) => {
      console.log(`Question ${index + 1}: Score=${q.score}, Text="${q.text.substring(0, 100)}..."`);
    });
    
    const bestQuestion = findBestQuestion();
    if (bestQuestion) {
      console.log(`[Content] Best question: Score=${bestQuestion.score}, Text="${bestQuestion.text}"`);
    } else {
      console.log("[Content] No best question found");
    }
    
    return questions;
  };

  // Manual refresh function for users to call when auto-solving fails
  window.forceRefreshAndClear = async () => {
    console.log("=".repeat(80));
    console.log("🔄 [Content] MANUAL FORCE REFRESH AND CLEAR");
    console.log("=".repeat(80));
    
    try {
      console.log('[Content] Starting manual force refresh...');
      
      // Perform aggressive refresh and state clearing
      await forceDOMRefresh();
      await clearStaleStates();
      
      // Additional clearing of any remaining selections
      const allInputs = document.querySelectorAll('input[type="radio"], input[type="checkbox"]');
      console.log(`[Content] Found ${allInputs.length} input elements to check`);
      
      let clearedCount = 0;
      allInputs.forEach(input => {
        if (input.checked) {
          try {
            input.checked = false;
            input.dispatchEvent(new Event('change', { bubbles: true }));
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('click', { bubbles: true }));
            clearedCount++;
          } catch (err) {
            console.log('[Content] Failed to clear input:', err);
          }
        }
      });
      
      console.log(`[Content] Manually cleared ${clearedCount} selections`);
      
      // Clear any focus
      if (document.activeElement && document.activeElement !== document.body) {
        document.activeElement.blur();
      }
      
      // Test question detection after refresh
      const questions = detectMcqQuestions();
      console.log(`[Content] After refresh: detected ${questions.length} questions`);
      
      console.log('\n✅ [Content] MANUAL REFRESH COMPLETED');
      console.log('💡 [Content] Try auto-solving again now');
      console.log('💡 [Content] If still failing, run testWebsiteCompatibility() for analysis');
      
    } catch (error) {
      console.error('❌ [Content] MANUAL REFRESH FAILED:', error);
    }
    
    console.log("=".repeat(80));
  };

  // Test function for website compatibility analysis
  window.testWebsiteCompatibility = async () => {
    console.log("=".repeat(80));
    console.log("🌐 [Content] WEBSITE COMPATIBILITY ANALYSIS");
    console.log("=".repeat(80));
    
    try {
      // Test 1: Basic input detection
      console.log('\n🔍 [Content] TEST 1: Basic Input Detection');
      const allInputs = document.querySelectorAll('input[type="radio"], input[type="checkbox"]');
      console.log(`[Content] Found ${allInputs.length} radio/checkbox inputs`);
      
      const allButtons = document.querySelectorAll('button, [role="button"], [role="option"]');
      console.log(`[Content] Found ${allButtons.length} button-like elements`);
      
      const allLabels = document.querySelectorAll('label, [role="label"]');
      console.log(`[Content] Found ${allLabels.length} label-like elements`);
      
      // Test 2: Question container detection
      console.log('\n📦 [Content] TEST 2: Question Container Detection');
      const containerSelectors = [
        '.question', '.quiz-question', '.mcq-question', '[class*="question"]',
        '.quiz-container', '.question-container', '.test-question', '.exam-question',
        '.assessment-question', '.question-item', '.question-block', '.question-wrapper',
        '.question-box', '.question-card', '.problem', '.exercise', '.task', '.item',
        '.choice-container', '.option-container', '.answer-container', '.response-container',
        '[class*="quiz"]', '[class*="test"]', '[class*="exam"]', '[class*="assessment"]',
        '[class*="problem"]', '[class*="exercise"]', '[class*="task"]',
        '[data-question]', '[data-quiz]', '[data-test]', '[data-item]', '[data-problem]',
        '[role="group"]', '[role="radiogroup"]', '[role="list"]', '[role="region"]'
      ];
      
      let foundContainers = [];
      for (const selector of containerSelectors) {
        const containers = document.querySelectorAll(selector);
        if (containers.length > 0) {
          foundContainers.push({ selector: selector, count: containers.length });
          console.log(`[Content] Found ${containers.length} containers with selector: ${selector}`);
        }
      }
      
      // Test 3: Option pattern detection
      console.log('\n🎯 [Content] TEST 3: Option Pattern Detection');
      const optionPatterns = [
        /\([A-D]\)/g,
        /\b[A-D]\)\s*/g,
        /\b[A-D]\.\s*/g,
        /\b[A-D]\s+/g,
        /option\s*[A-D]/gi,
        /\[\s*\]\s*/g,
        /\(\s*\)\s*/g,
        /☐\s*/g,
        /◯\s*/g
      ];
      
      const bodyText = document.body.textContent || '';
      optionPatterns.forEach((pattern, index) => {
        const matches = bodyText.match(pattern);
        if (matches && matches.length > 0) {
          console.log(`[Content] Pattern ${index + 1} found ${matches.length} matches: ${pattern}`);
        }
      });
      
      // Test 4: Question detection
      console.log('\n❓ [Content] TEST 4: Question Detection');
      const questions = detectMcqQuestions();
      console.log(`[Content] Detected ${questions.length} questions`);
      
      if (questions.length > 0) {
        questions.slice(0, 3).forEach((q, index) => {
          console.log(`[Content] Question ${index + 1}: "${q.text.substring(0, 100)}..." (score: ${q.score})`);
        });
      }
      
      // Test 5: Selection simulation
      console.log('\n🖱️ [Content] TEST 5: Selection Simulation');
      const testAnswers = ['A', 'B', 'C', 'D'];
      let selectionResults = [];
      
      for (const answer of testAnswers) {
        const success = selectMcqOption(answer);
        selectionResults.push({ answer: answer, success: success });
        console.log(`[Content] Selection test for "${answer}": ${success ? 'SUCCESS' : 'FAILED'}`);
        
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Test 6: Website analysis
      console.log('\n📊 [Content] TEST 6: Website Analysis');
      const url = window.location.href;
      const domain = window.location.hostname;
      console.log(`[Content] Current URL: ${url}`);
      console.log(`[Content] Domain: ${domain}`);
      
      // Check for common educational platforms
      const platformPatterns = [
        /coursera/i,
        /udemy/i,
        /edx/i,
        /khan/i,
        /quizlet/i,
        /study/i,
        /learn/i,
        /education/i,
        /school/i,
        /university/i,
        /college/i,
        /academy/i,
        /training/i,
        /course/i
      ];
      
      let detectedPlatform = null;
      for (const pattern of platformPatterns) {
        if (pattern.test(url) || pattern.test(domain) || pattern.test(document.title)) {
          detectedPlatform = pattern.source.replace(/\/i$/, '');
          break;
        }
      }
      
      if (detectedPlatform) {
        console.log(`[Content] Detected educational platform: ${detectedPlatform}`);
      } else {
        console.log('[Content] No specific educational platform detected');
      }
      
      // Summary
      console.log('\n📋 [Content] COMPATIBILITY SUMMARY:');
      console.log(`[Content] • Input elements: ${allInputs.length}`);
      console.log(`[Content] • Button elements: ${allButtons.length}`);
      console.log(`[Content] • Label elements: ${allLabels.length}`);
      console.log(`[Content] • Question containers: ${foundContainers.length}`);
      console.log(`[Content] • Detected questions: ${questions.length}`);
      console.log(`[Content] • Successful selections: ${selectionResults.filter(r => r.success).length}/${selectionResults.length}`);
      
      // Recommendations
      console.log('\n💡 [Content] RECOMMENDATIONS:');
      if (allInputs.length === 0) {
        console.log('[Content] • No radio/checkbox inputs found - this site may use custom click handlers');
      }
      if (questions.length === 0) {
        console.log('[Content] • No questions detected - try increasing detection sensitivity');
      }
      if (selectionResults.filter(r => r.success).length === 0) {
        console.log('[Content] • No successful selections - this site may need custom selectors');
      }
      if (foundContainers.length === 0) {
        console.log('[Content] • No question containers found - site may use non-standard structure');
      }
      
      console.log('\n✅ [Content] WEBSITE COMPATIBILITY ANALYSIS COMPLETED');
      
    } catch (error) {
      console.error('❌ [Content] COMPATIBILITY ANALYSIS FAILED:', error);
    }
    
    console.log("=".repeat(80));
  };

  // Test function for debugging auto-solving issues
  window.testAutoSolvingSequence = async () => {
    console.log("=".repeat(80));
    console.log("🧪 [Content] TESTING AUTO-SOLVING SEQUENCE");
    console.log("=".repeat(80));
    
    try {
      // Test 1: Question detection
      console.log('\n🔍 [Content] TEST 1: Question Detection');
      const questions = detectMcqQuestions();
      console.log(`[Content] Found ${questions.length} questions`);
      
      if (questions.length === 0) {
        console.log('❌ [Content] No questions found - cannot proceed with test');
        return;
      }
      
      // Test 2: Best question selection
      console.log('\n🎯 [Content] TEST 2: Best Question Selection');
      const bestQuestion = findBestQuestion();
      if (bestQuestion) {
        console.log(`✅ [Content] Best question selected: "${bestQuestion.text.substring(0, 100)}..."`);
      } else {
        console.log('❌ [Content] No best question found');
        return;
      }
      
      // Test 3: DOM element freshness
      console.log('\n🔄 [Content] TEST 3: DOM Element Freshness');
      const checkboxesBefore = document.querySelectorAll('input[type="checkbox"], input[type="radio"]');
      console.log(`[Content] Found ${checkboxesBefore.length} input elements before refresh`);
      
      // Force DOM refresh
      document.body.offsetHeight;
      
      const checkboxesAfter = document.querySelectorAll('input[type="checkbox"], input[type="radio"]');
      console.log(`[Content] Found ${checkboxesAfter.length} input elements after refresh`);
      
      // Test 4: Selection state clearing
      console.log('\n🧹 [Content] TEST 4: Selection State Clearing');
      const checkedBefore = document.querySelectorAll('input[type="radio"]:checked, input[type="checkbox"]:checked');
      console.log(`[Content] Found ${checkedBefore.length} checked elements before clearing`);
      
      if (checkedBefore.length > 0) {
        checkedBefore.forEach(input => {
          input.checked = false;
          input.dispatchEvent(new Event('change', { bubbles: true }));
        });
        
        const checkedAfter = document.querySelectorAll('input[type="radio"]:checked, input[type="checkbox"]:checked');
        console.log(`[Content] Found ${checkedAfter.length} checked elements after clearing`);
      }
      
      // Test 5: Option selection simulation
      console.log('\n🎯 [Content] TEST 5: Option Selection Simulation');
      const testAnswer = "A"; // Test with letter A
      console.log(`[Content] Testing selection of option "${testAnswer}"`);
      
      const selectionSuccess = selectMcqOption(testAnswer);
      console.log(`[Content] Selection test result: ${selectionSuccess ? 'SUCCESS' : 'FAILED'}`);
      
      // Test 6: Observer functionality
      console.log('\n👁️ [Content] TEST 6: Observer Functionality');
      console.log('[Content] MutationObserver should be active and monitoring for changes');
      console.log('[Content] Try changing questions on the page to test observer responsiveness');
      
      console.log('\n✅ [Content] AUTO-SOLVING TEST COMPLETED');
      console.log('💡 [Content] If all tests pass, the auto-solving should work for subsequent questions');
      console.log('💡 [Content] Check console logs for detailed information about each test');
      
    } catch (error) {
      console.error('❌ [Content] AUTO-SOLVING TEST FAILED:', error);
    }
    
    console.log("=".repeat(80));
  };

  // Test function for solving current question
  window.testSolveCurrentQuestion = async () => {
    console.log("[Content] Testing solve current question...");
    const question = findBestQuestion();
    if (question) {
      try {
        await solveQuestion(question);
        console.log("[Content] Question solved successfully");
      } catch (error) {
        console.error("[Content] Error solving question:", error);
      }
    } else {
      console.log("[Content] No question found to solve");
    }
  };

  // Test function for textbox pasting
  window.testTextboxPasting = async () => {
    console.log("=".repeat(80));
    console.log("🧪 [Content] TESTING TEXTBOX PASTING");
    console.log("=".repeat(80));
    
    const testAnswer = "This is a test answer for textbox pasting.";
    console.log(`[Content] Testing with answer: "${testAnswer}"`);
    
    const success = await selectSubjectiveAnswer(testAnswer);
    
    if (success) {
      console.log("✅ [Content] TEST RESULT: Textbox pasting successful!");
    } else {
      console.log("❌ [Content] TEST RESULT: Textbox pasting failed!");
      console.log("💡 [Content] Debugging info:");
      
      // Check what input fields are available
      const allInputs = document.querySelectorAll('input, textarea, [contenteditable="true"]');
      console.log(`[Content] Total input elements found: ${allInputs.length}`);
      
      allInputs.forEach((input, index) => {
        const rect = input.getBoundingClientRect();
        console.log(`[Content] Input ${index + 1}:`, {
          tag: input.tagName,
          type: input.type || 'N/A',
          id: input.id || 'N/A',
          name: input.name || 'N/A',
          placeholder: input.placeholder || 'N/A',
          visible: rect.width > 0 && rect.height > 0,
          disabled: input.disabled,
          readOnly: input.readOnly,
          value: input.value ? (input.value.length > 20 ? input.value.substring(0, 20) + '...' : input.value) : '(empty)'
        });
      });
    }
    
    console.log("=".repeat(80));
  };

  // Test function to find all input fields
  window.findAllInputs = () => {
    console.log("=".repeat(80));
    console.log("🔍 [Content] FINDING ALL INPUT FIELDS");
    console.log("=".repeat(80));
    
    const inputs = document.querySelectorAll('input, textarea, [contenteditable="true"]');
    console.log(`[Content] Found ${inputs.length} input elements:`);
    
    inputs.forEach((input, index) => {
      const rect = input.getBoundingClientRect();
      const styles = window.getComputedStyle(input);
      
      console.log(`\n${index + 1}. 📝 ${input.tagName.toLowerCase()}${input.type ? `[type="${input.type}"]` : ''}`);
      console.log(`   🆔 ID: "${input.id || 'N/A'}"`);
      console.log(`   📛 Name: "${input.name || 'N/A'}"`);
      console.log(`   💭 Placeholder: "${input.placeholder || 'N/A'}"`);
      console.log(`   👁️ Visible: ${rect.width > 0 && rect.height > 0}`);
      console.log(`   🚫 Disabled: ${input.disabled}`);
      console.log(`   🔒 ReadOnly: ${input.readOnly}`);
      console.log(`   📏 Display: ${styles.display}`);
      console.log(`   👻 Visibility: ${styles.visibility}`);
      console.log(`   📍 Position: top=${Math.round(rect.top)}, left=${Math.round(rect.left)}`);
      console.log(`   📦 Size: ${Math.round(rect.width)}x${Math.round(rect.height)}`);
      console.log(`   📄 Current value: "${input.value ? (input.value.length > 50 ? input.value.substring(0, 50) + '...' : input.value) : '(empty)'}"`);
    });
    
    console.log("\n💡 [Content] TIP: Use testTextboxPasting() to test pasting into these inputs");
    console.log("=".repeat(80));
  };

  init();
})();
