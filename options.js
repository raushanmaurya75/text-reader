// DOM Elements
const providerSelect = document.getElementById("provider");
const groqConfig = document.getElementById("groq-config");
const geminiConfig = document.getElementById("gemini-config");
const openaiConfig = document.getElementById("openai-config");
const saveButton = document.getElementById("saveButton");
const resetButton = document.getElementById("resetButton");
const status = document.getElementById("status");
const currentHotkeySpan = document.getElementById("currentHotkey");

// Provider-specific inputs
const groqApiKey = document.getElementById("groqApiKey");
const groqModel = document.getElementById("groqModel");
const geminiApiKey = document.getElementById("geminiApiKey");
const geminiModel = document.getElementById("geminiModel");
const openaiApiKey = document.getElementById("openaiApiKey");
const openaiModel = document.getElementById("openaiModel");

// Other inputs
const customInstruction = document.getElementById("customInstruction");
const hotkeyType = document.getElementById("hotkeyType");
const modifierKey = document.getElementById("modifierKey");
const actionKey = document.getElementById("actionKey");
const singleKey = document.getElementById("singleKey");
const combinationHotkey = document.getElementById("combinationHotkey");
const singleHotkey = document.getElementById("singleHotkey");
const currentSingleHotkeySpan = document.getElementById("currentSingleHotkey");

// MCQ elements
const mcqEnabled = document.getElementById("mcqEnabled");
const mcqInstruction = document.getElementById("mcqInstruction");
const mcqHotkeyType = document.getElementById("mcqHotkeyType");
const mcqModifierKey = document.getElementById("mcqModifierKey");
const mcqActionKey = document.getElementById("mcqActionKey");
const mcqSingleKey = document.getElementById("mcqSingleKey");
const mcqCombinationHotkey = document.getElementById("mcqCombinationHotkey");
const mcqSingleHotkey = document.getElementById("mcqSingleHotkey");
const currentMcqHotkeySpan = document.getElementById("currentMcqHotkey");
const currentMcqSingleHotkeySpan = document.getElementById("currentMcqSingleHotkey");

// Question solving mode elements
const questionSolvingEnabled = document.getElementById("questionSolvingEnabled");
const questionSolvingHotkeyType = document.getElementById("questionSolvingHotkeyType");
const questionSolvingModifierKey = document.getElementById("questionSolvingModifierKey");
const questionSolvingActionKey = document.getElementById("questionSolvingActionKey");
const questionSolvingSingleKey = document.getElementById("questionSolvingSingleKey");
const questionSolvingCombinationHotkey = document.getElementById("questionSolvingCombinationHotkey");
const questionSolvingSingleHotkey = document.getElementById("questionSolvingSingleHotkey");
const currentQuestionSolvingHotkeySpan = document.getElementById("currentQuestionSolvingHotkey");
const currentQuestionSolvingSingleHotkeySpan = document.getElementById("currentQuestionSolvingSingleHotkey");

// Auto-solve delay and sensitivity elements
const autoSolveDelay = document.getElementById("autoSolveDelay");
const questionDetectionSensitivity = document.getElementById("questionDetectionSensitivity");

// Default settings
const defaultSettings = {
  provider: "groq",
  groqApiKey: "",
  groqModel: "llama-3.1-8b-instant",
  geminiApiKey: "",
  geminiModel: "gemini-1.5-flash",
  openaiApiKey: "",
  openaiModel: "gpt-3.5-turbo",
  customInstruction: "Rewrite the following text to be more concise and clear:",
  hotkeyType: "combination",
  modifierKey: "alt",
  actionKey: "Enter",
  singleKey: "Enter",
  mcqEnabled: false,
  mcqInstruction: "If lettered options (A, B, C, D), respond with ONLY the letter. If numbered options, respond with the number. If true/false, respond with 'true' or 'false'. If fill-in-the-blank, provide the word/phrase. No explanation.",
  mcqHotkeyType: "combination",
  mcqModifierKey: "alt",
  mcqActionKey: "m",
  mcqSingleKey: "m",
  questionSolvingEnabled: false,
  questionSolvingHotkeyType: "combination",
  questionSolvingModifierKey: "alt",
  questionSolvingActionKey: "s",
  questionSolvingSingleKey: "s",
  autoSolveDelay: 0,
  questionDetectionSensitivity: "medium"
};

// Load settings from storage
const loadSettings = async () => {
  try {
    const result = await chrome.storage.local.get(Object.keys(defaultSettings));
    const settings = { ...defaultSettings, ...result };
    
    // Set provider
    providerSelect.value = settings.provider;
    
    // Set API keys and models
    groqApiKey.value = settings.groqApiKey || "";
    groqModel.value = settings.groqModel || defaultSettings.groqModel;
    geminiApiKey.value = settings.geminiApiKey || "";
    geminiModel.value = settings.geminiModel || defaultSettings.geminiModel;
    openaiApiKey.value = settings.openaiApiKey || "";
    openaiModel.value = settings.openaiModel || defaultSettings.openaiModel;
    
    // Set custom instruction
    customInstruction.value = settings.customInstruction || defaultSettings.customInstruction;
    
    // Set hotkey settings
    hotkeyType.value = settings.hotkeyType || defaultSettings.hotkeyType;
    modifierKey.value = settings.modifierKey || defaultSettings.modifierKey;
    actionKey.value = settings.actionKey || defaultSettings.actionKey;
    singleKey.value = settings.singleKey || defaultSettings.singleKey;
    
    // Set MCQ settings
    mcqEnabled.checked = settings.mcqEnabled || false;
    mcqInstruction.value = settings.mcqInstruction || defaultSettings.mcqInstruction;
    mcqHotkeyType.value = settings.mcqHotkeyType || defaultSettings.mcqHotkeyType;
    mcqModifierKey.value = settings.mcqModifierKey || defaultSettings.mcqModifierKey;
    mcqActionKey.value = settings.mcqActionKey || defaultSettings.mcqActionKey;
    mcqSingleKey.value = settings.mcqSingleKey || defaultSettings.mcqSingleKey;
    
    // Set question solving mode settings
    questionSolvingEnabled.checked = settings.questionSolvingEnabled || false;
    questionSolvingHotkeyType.value = settings.questionSolvingHotkeyType || defaultSettings.questionSolvingHotkeyType;
    questionSolvingModifierKey.value = settings.questionSolvingModifierKey || defaultSettings.questionSolvingModifierKey;
    questionSolvingActionKey.value = settings.questionSolvingActionKey || defaultSettings.questionSolvingActionKey;
    questionSolvingSingleKey.value = settings.questionSolvingSingleKey || defaultSettings.questionSolvingSingleKey;
    
    // Set auto-solve delay and sensitivity
    autoSolveDelay.value = settings.autoSolveDelay || defaultSettings.autoSolveDelay;
    questionDetectionSensitivity.value = settings.questionDetectionSensitivity || defaultSettings.questionDetectionSensitivity;
    
    // Update UI
    updateProviderConfig();
    updateHotkeyUI();
    updateMcqHotkeyUI();
    updateQuestionSolvingHotkeyUI();
    updateCurrentHotkeyDisplay();
  } catch (error) {
    showStatus("Error loading settings", "error");
  }
};

// Save settings to storage
const saveSettings = async () => {
  try {
    const settings = {
      provider: providerSelect.value,
      groqApiKey: groqApiKey.value.trim(),
      groqModel: groqModel.value,
      geminiApiKey: geminiApiKey.value.trim(),
      geminiModel: geminiModel.value,
      openaiApiKey: openaiApiKey.value.trim(),
      openaiModel: openaiModel.value,
      customInstruction: customInstruction.value.trim(),
      hotkeyType: hotkeyType.value,
      modifierKey: modifierKey.value,
      actionKey: actionKey.value,
      singleKey: singleKey.value,
      mcqEnabled: mcqEnabled.checked,
      mcqInstruction: mcqInstruction.value.trim(),
      mcqHotkeyType: mcqHotkeyType.value,
      mcqModifierKey: mcqModifierKey.value,
      mcqActionKey: mcqActionKey.value,
      mcqSingleKey: mcqSingleKey.value,
      questionSolvingEnabled: questionSolvingEnabled.checked,
      questionSolvingHotkeyType: questionSolvingHotkeyType.value,
      questionSolvingModifierKey: questionSolvingModifierKey.value,
      questionSolvingActionKey: questionSolvingActionKey.value,
      questionSolvingSingleKey: questionSolvingSingleKey.value,
      autoSolveDelay: parseInt(autoSolveDelay.value) || 0,
      questionDetectionSensitivity: questionDetectionSensitivity.value
    };
    
    await chrome.storage.local.set(settings);
    showStatus("Settings saved successfully!", "success");
    updateCurrentHotkeyDisplay();
  } catch (error) {
    showStatus("Error saving settings", "error");
  }
};

// Reset settings to defaults
const resetSettings = async () => {
  try {
    await chrome.storage.local.set(defaultSettings);
    await loadSettings();
    showStatus("Settings reset to defaults", "success");
  } catch (error) {
    showStatus("Error resetting settings", "error");
  }
};

// Show status message
const showStatus = (message, type) => {
  status.textContent = message;
  status.className = type;
  setTimeout(() => {
    status.textContent = "";
    status.className = "";
  }, 3000);
};

// Update provider configuration visibility
const updateProviderConfig = () => {
  const provider = providerSelect.value;
  groqConfig.style.display = provider === "groq" ? "block" : "none";
  geminiConfig.style.display = provider === "gemini" ? "block" : "none";
  openaiConfig.style.display = provider === "openai" ? "block" : "none";
};

// Update hotkey UI based on type
const updateHotkeyUI = () => {
  const isCombination = hotkeyType.value === "combination";
  combinationHotkey.style.display = isCombination ? "block" : "none";
  singleHotkey.style.display = isCombination ? "none" : "block";
};

// Update MCQ hotkey UI based on type
const updateMcqHotkeyUI = () => {
  const isCombination = mcqHotkeyType.value === "combination";
  mcqCombinationHotkey.style.display = isCombination ? "block" : "none";
  mcqSingleHotkey.style.display = isCombination ? "none" : "block";
};

// Update question solving hotkey UI based on type
const updateQuestionSolvingHotkeyUI = () => {
  const isCombination = questionSolvingHotkeyType.value === "combination";
  questionSolvingCombinationHotkey.style.display = isCombination ? "block" : "none";
  questionSolvingSingleHotkey.style.display = isCombination ? "none" : "block";
};

// Update current hotkey display
const updateCurrentHotkeyDisplay = () => {
  // Regular hotkey
  const hotkeyDesc = hotkeyType.value === "single" 
    ? singleKey.value 
    : `${modifierKey.value}+${actionKey.value}`;
  currentHotkeySpan.textContent = hotkeyDesc;
  currentSingleHotkeySpan.textContent = singleKey.value;
  
  // MCQ hotkey
  const mcqHotkeyDesc = mcqHotkeyType.value === "single" 
    ? mcqSingleKey.value 
    : `${mcqModifierKey.value}+${mcqActionKey.value}`;
  currentMcqHotkeySpan.textContent = mcqHotkeyDesc;
  currentMcqSingleHotkeySpan.textContent = mcqSingleKey.value;
  
  // Question solving hotkey
  const questionSolvingHotkeyDesc = questionSolvingHotkeyType.value === "single" 
    ? questionSolvingSingleKey.value 
    : `${questionSolvingModifierKey.value}+${questionSolvingActionKey.value}`;
  currentQuestionSolvingHotkeySpan.textContent = questionSolvingHotkeyDesc;
  currentQuestionSolvingSingleHotkeySpan.textContent = questionSolvingSingleKey.value;
};

// Event listeners
providerSelect.addEventListener("change", updateProviderConfig);
hotkeyType.addEventListener("change", updateHotkeyUI);
mcqHotkeyType.addEventListener("change", updateMcqHotkeyUI);
questionSolvingHotkeyType.addEventListener("change", updateQuestionSolvingHotkeyUI);
saveButton.addEventListener("click", saveSettings);
resetButton.addEventListener("click", resetSettings);

// Update hotkey display when keys change
[modifierKey, actionKey, singleKey].forEach(element => {
  element.addEventListener("change", updateCurrentHotkeyDisplay);
});

[mcqModifierKey, mcqActionKey, mcqSingleKey].forEach(element => {
  element.addEventListener("change", updateCurrentHotkeyDisplay);
});

[questionSolvingModifierKey, questionSolvingActionKey, questionSolvingSingleKey].forEach(element => {
  element.addEventListener("change", updateCurrentHotkeyDisplay);
});

// Initialize on page load
document.addEventListener("DOMContentLoaded", loadSettings);
