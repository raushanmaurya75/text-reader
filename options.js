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

// Default settings
const defaultSettings = {
  provider: "groq",
  groqApiKey: "",
  groqModel: "llama-3.1-8b-instant",
  geminiApiKey: "",
  geminiModel: "gemini-1.5-flash",
  openaiApiKey: "",
  openaiModel: "gpt-3.5-turbo",
  customInstruction: "",
  hotkeyType: "combination",
  modifierKey: "alt",
  actionKey: "Enter",
  singleKey: "Enter",
  mcqEnabled: false,
  mcqInstruction: "",
  mcqHotkeyType: "combination",
  mcqModifierKey: "alt",
  mcqActionKey: "m",
  mcqSingleKey: "m"
};

// Show/hide provider configuration
const switchProvider = (provider) => {
  document.querySelectorAll(".provider-section").forEach(section => {
    section.classList.remove("active");
  });
  
  const configMap = {
    "groq": groqConfig,
    "gemini": geminiConfig,
    "openai": openaiConfig
  };
  
  if (configMap[provider]) {
    configMap[provider].classList.add("active");
  }
};

// Update current hotkey display
const updateHotkeyDisplay = () => {
  const type = hotkeyType.value;
  if (type === "combination") {
    const modifier = modifierKey.value.charAt(0).toUpperCase() + modifierKey.value.slice(1);
    const action = actionKey.value === " " ? "Space" : actionKey.value.charAt(0).toUpperCase() + actionKey.value.slice(1);
    currentHotkeySpan.textContent = `${modifier} + ${action}`;
  } else {
    const key = singleKey.value === " " ? "Space" : singleKey.value.charAt(0).toUpperCase() + singleKey.value.slice(1);
    currentSingleHotkeySpan.textContent = key;
  }
};

// Update MCQ hotkey display
const updateMcqHotkeyDisplay = () => {
  const type = mcqHotkeyType.value;
  if (type === "combination") {
    const modifier = mcqModifierKey.value.charAt(0).toUpperCase() + mcqModifierKey.value.slice(1);
    const action = mcqActionKey.value === " " ? "Space" : mcqActionKey.value.charAt(0).toUpperCase() + mcqActionKey.value.slice(1);
    currentMcqHotkeySpan.textContent = `${modifier} + ${action}`;
  } else {
    const key = mcqSingleKey.value === " " ? "Space" : mcqSingleKey.value.charAt(0).toUpperCase() + mcqSingleKey.value.slice(1);
    currentMcqSingleHotkeySpan.textContent = key;
  }
};

// Show/hide hotkey configuration based on type
const switchHotkeyType = (type) => {
  if (type === "combination") {
    combinationHotkey.style.display = "block";
    singleHotkey.style.display = "none";
  } else {
    combinationHotkey.style.display = "none";
    singleHotkey.style.display = "block";
  }
};

// Show/hide MCQ hotkey configuration based on type
const switchMcqHotkeyType = (type) => {
  if (type === "combination") {
    mcqCombinationHotkey.style.display = "block";
    mcqSingleHotkey.style.display = "none";
  } else {
    mcqCombinationHotkey.style.display = "none";
    mcqSingleHotkey.style.display = "block";
  }
};

// Load settings from storage
const loadSettings = () => {
  chrome.storage.local.get(Object.keys(defaultSettings), (result) => {
    // Set provider
    const provider = result.provider || defaultSettings.provider;
    providerSelect.value = provider;
    switchProvider(provider);
    
    // Set API keys and models
    groqApiKey.value = result.groqApiKey || "";
    groqModel.value = result.groqModel || defaultSettings.groqModel;
    geminiApiKey.value = result.geminiApiKey || "";
    geminiModel.value = result.geminiModel || defaultSettings.geminiModel;
    openaiApiKey.value = result.openaiApiKey || "";
    openaiModel.value = result.openaiModel || defaultSettings.openaiModel;
    
    // Set other settings
    customInstruction.value = result.customInstruction || "";
    hotkeyType.value = result.hotkeyType || defaultSettings.hotkeyType;
    modifierKey.value = result.modifierKey || defaultSettings.modifierKey;
    actionKey.value = result.actionKey || defaultSettings.actionKey;
    singleKey.value = result.singleKey || defaultSettings.singleKey;
    
    // Set MCQ settings
    mcqEnabled.checked = result.mcqEnabled || false;
    mcqInstruction.value = result.mcqInstruction || "";
    mcqHotkeyType.value = result.mcqHotkeyType || defaultSettings.mcqHotkeyType;
    mcqModifierKey.value = result.mcqModifierKey || defaultSettings.mcqModifierKey;
    mcqActionKey.value = result.mcqActionKey || defaultSettings.mcqActionKey;
    mcqSingleKey.value = result.mcqSingleKey || defaultSettings.mcqSingleKey;
    
    switchHotkeyType(hotkeyType.value);
    switchMcqHotkeyType(mcqHotkeyType.value);
    updateHotkeyDisplay();
    updateMcqHotkeyDisplay();
  });
};

// Save settings to storage
const saveSettings = () => {
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
    mcqSingleKey: mcqSingleKey.value
  };
  
  // Validate API key for selected provider
  const selectedProvider = settings.provider;
  const apiKey = settings[`${selectedProvider}ApiKey`];
  
  if (!apiKey) {
    showStatus(`Please enter a valid ${selectedProvider.toUpperCase()} API key.`, "error");
    return;
  }
  
  chrome.storage.local.set(settings, () => {
    showStatus("Settings saved successfully!", "success");
    updateHotkeyDisplay();
  });
};

// Reset to defaults
const resetSettings = () => {
  if (confirm("Are you sure you want to reset all settings to defaults?")) {
    chrome.storage.local.set(defaultSettings, () => {
      loadSettings();
      showStatus("Settings reset to defaults.", "success");
    });
  }
};

// Show status message
const showStatus = (message, type) => {
  status.textContent = message;
  status.className = `status ${type}`;
  status.style.display = "block";
  
  setTimeout(() => {
    status.style.display = "none";
  }, 3000);
};

// Event listeners
providerSelect.addEventListener("change", (e) => {
  switchProvider(e.target.value);
});

hotkeyType.addEventListener("change", (e) => {
  switchHotkeyType(e.target.value);
  updateHotkeyDisplay();
});

mcqHotkeyType.addEventListener("change", (e) => {
  switchMcqHotkeyType(e.target.value);
  updateMcqHotkeyDisplay();
});

modifierKey.addEventListener("change", updateHotkeyDisplay);
actionKey.addEventListener("change", updateHotkeyDisplay);
singleKey.addEventListener("change", updateHotkeyDisplay);

mcqModifierKey.addEventListener("change", updateMcqHotkeyDisplay);
mcqActionKey.addEventListener("change", updateMcqHotkeyDisplay);
mcqSingleKey.addEventListener("change", updateMcqHotkeyDisplay);

saveButton.addEventListener("click", saveSettings);
resetButton.addEventListener("click", resetSettings);

// Initialize
loadSettings();
