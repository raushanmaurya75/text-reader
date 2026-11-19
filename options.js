// DOM Elements
const providerSelect  = document.getElementById("provider");
const groqConfig      = document.getElementById("groq-config");
const geminiConfig    = document.getElementById("gemini-config");
const openaiConfig    = document.getElementById("openai-config");
const saveButton      = document.getElementById("saveButton");
const resetButton     = document.getElementById("resetButton");
const status          = document.getElementById("status");
const currentHotkeySpan = document.getElementById("currentHotkey");

// Provider-specific inputs
const groqApiKey       = document.getElementById("groqApiKey");
const groqModel        = document.getElementById("groqModel");
const geminiApiKey     = document.getElementById("geminiApiKey");
const geminiModel      = document.getElementById("geminiModel");
const openaiApiKey     = document.getElementById("openaiApiKey");
const openaiModel      = document.getElementById("openaiModel");
const openrouterApiKey = document.getElementById("openrouterApiKey");
const openrouterModel  = document.getElementById("openrouterModel");

// Regular hotkey inputs
const customInstruction  = document.getElementById("customInstruction");
const hotkeyType         = document.getElementById("hotkeyType");
const modifierKey        = document.getElementById("modifierKey");
const actionKey          = document.getElementById("actionKey");
const singleKey          = document.getElementById("singleKey");
const combinationHotkey  = document.getElementById("combinationHotkey");
const singleHotkey       = document.getElementById("singleHotkey");
const currentSingleHotkeySpan = document.getElementById("currentSingleHotkey");

// Question solving mode elements
const questionSolvingEnabled            = document.getElementById("questionSolvingEnabled");
const questionSolvingHotkeyType         = document.getElementById("questionSolvingHotkeyType");
const questionSolvingModifierKey        = document.getElementById("questionSolvingModifierKey");
const questionSolvingActionKey          = document.getElementById("questionSolvingActionKey");
const questionSolvingSingleKey          = document.getElementById("questionSolvingSingleKey");
const questionSolvingCombinationHotkey  = document.getElementById("questionSolvingCombinationHotkey");
const questionSolvingSingleHotkey       = document.getElementById("questionSolvingSingleHotkey");
const currentQuestionSolvingHotkeySpan       = document.getElementById("currentQuestionSolvingHotkey");
const currentQuestionSolvingSingleHotkeySpan = document.getElementById("currentQuestionSolvingSingleHotkey");

// Auto-solve delay and detection sensitivity
const autoSolveDelay              = document.getElementById("autoSolveDelay");
const questionDetectionSensitivity = document.getElementById("questionDetectionSensitivity");

// Image solving mode elements
const imageSolvingEnabled            = document.getElementById("imageSolvingEnabled");
const imageSolvingHotkeyType         = document.getElementById("imageSolvingHotkeyType");
const imageSolvingModifierKey        = document.getElementById("imageSolvingModifierKey");
const imageSolvingActionKey          = document.getElementById("imageSolvingActionKey");
const imageSolvingSingleKey          = document.getElementById("imageSolvingSingleKey");
const imageSolvingCombinationHotkey  = document.getElementById("imageSolvingCombinationHotkey");
const imageSolvingSingleHotkey       = document.getElementById("imageSolvingSingleHotkey");
const currentImageSolvingHotkeySpan       = document.getElementById("currentImageSolvingHotkey");
const currentImageSolvingSingleHotkeySpan = document.getElementById("currentImageSolvingSingleHotkey");
const imageSolvingInstruction              = document.getElementById("imageSolvingInstruction");

// Scan zone elements
const scanZoneEnabled           = document.getElementById("scanZoneEnabled");
const scanZoneHotkeyType        = document.getElementById("scanZoneHotkeyType");
const scanZoneModifierKey       = document.getElementById("scanZoneModifierKey");
const scanZoneActionKey         = document.getElementById("scanZoneActionKey");
const scanZoneSingleKey         = document.getElementById("scanZoneSingleKey");
const scanZoneCombinationHotkey = document.getElementById("scanZoneCombinationHotkey");
const scanZoneSingleHotkey      = document.getElementById("scanZoneSingleHotkey");
const currentScanZoneHotkeySpan       = document.getElementById("currentScanZoneHotkey");
const currentScanZoneSingleHotkeySpan = document.getElementById("currentScanZoneSingleHotkey");
const clearZoneButton           = document.getElementById("clearZoneButton");
const zoneStatusEl              = document.getElementById("zoneStatus");

// Answer overlay toggle
const answerOverlayEnabled = document.getElementById("answerOverlayEnabled");
// Overlay hotkey elements
const overlayHotkeyType         = document.getElementById("overlayHotkeyType");
const overlayModifierKey        = document.getElementById("overlayModifierKey");
const overlayActionKey          = document.getElementById("overlayActionKey");
const overlaySingleKey          = document.getElementById("overlaySingleKey");
const overlayCombinationHotkey  = document.getElementById("overlayCombinationHotkey");
const overlaySingleHotkey       = document.getElementById("overlaySingleHotkey");
const currentOverlayHotkeySpan       = document.getElementById("currentOverlayHotkey");
const currentOverlaySingleHotkeySpan  = document.getElementById("currentOverlaySingleHotkey");
// Close overlay hotkey elements
const overlayCloseHotkeyType         = document.getElementById("overlayCloseHotkeyType");
const overlayCloseModifierKey        = document.getElementById("overlayCloseModifierKey");
const overlayCloseActionKey          = document.getElementById("overlayCloseActionKey");
const overlayCloseSingleKey          = document.getElementById("overlayCloseSingleKey");
const overlayCloseCombinationHotkey  = document.getElementById("overlayCloseCombinationHotkey");
const overlayCloseSingleHotkey       = document.getElementById("overlayCloseSingleHotkey");
const currentOverlayCloseHotkeySpan       = document.getElementById("currentOverlayCloseHotkey");
const currentOverlayCloseSingleHotkeySpan = document.getElementById("currentOverlayCloseSingleHotkey");

// ============================================================
//  DEFAULTS
// ============================================================
const defaultSettings = {
  provider:    "groq",
  groqApiKey:  "",
  groqModel:   "openai/gpt-oss-120b",
  geminiApiKey: "",
  geminiModel: "gemini-3.5-flash-lite",
  openaiApiKey: "",
  openaiModel: "gpt-4o-mini",
  openrouterApiKey: "",
  openrouterModel: "google/gemini-2.0-flash-001",
  customInstruction: "Rewrite the following text to be more concise and clear:",
  hotkeyType:  "combination",
  modifierKey: "alt",
  actionKey:   "Enter",
  singleKey:   "Enter",

  questionSolvingEnabled:          false,
  questionSolvingHotkeyType:       "combination",
  questionSolvingModifierKey:      "alt",
  questionSolvingActionKey:        "s",
  questionSolvingSingleKey:        "s",
  autoSolveDelay:                  0,
  questionDetectionSensitivity:    "medium",

  // Image solving
  imageSolvingEnabled:             false,
  imageSolvingHotkeyType:          "combination",
  imageSolvingModifierKey:         "alt",
  imageSolvingActionKey:           "i",
  imageSolvingSingleKey:           "i",
  imageSolvingInstruction:         "",

  // Scan zone
  scanZoneEnabled:        false,
  scanZoneHotkeyType:     "combination",
  scanZoneModifierKey:    "alt",
  scanZoneActionKey:      "r",
  scanZoneSingleKey:      "r",

  // Answer overlay
  answerOverlayEnabled:   false,
  overlayHotkeyType:      "combination",
  overlayModifierKey:     "alt",
  overlayActionKey:       "a",
  overlaySingleKey:       "a",
  // Close overlay
  overlayCloseHotkeyType:    "combination",
  overlayCloseModifierKey:   "alt",
  overlayCloseActionKey:     "w",
  overlayCloseSingleKey:     "w",
};

// ============================================================
//  LOAD
// ============================================================
const loadSettings = async () => {
  try {
    const keysToLoad = [...Object.keys(defaultSettings), "scanRegion"];
    const result = await chrome.storage.local.get(keysToLoad);
    const s = { ...defaultSettings, ...result };

    // Migrate any legacy/decommissioned Gemini model strings
    if (s.geminiModel === "gemini-3.6-flash" || s.geminiModel === "gemini-2.5-flash" || s.geminiModel === "gemini-1.5-flash" || s.geminiModel === "gemini-2.0-flash") {
      s.geminiModel = "gemini-3.5-flash-lite";
      chrome.storage.local.set({ geminiModel: "gemini-3.5-flash-lite" });
    }
    if (s.openrouterModel === "google/gemini-3.6-flash" || s.openrouterModel === "google/gemini-2.5-flash") {
      s.openrouterModel = "google/gemini-2.0-flash-001";
      chrome.storage.local.set({ openrouterModel: "google/gemini-2.0-flash-001" });
    }

    if (providerSelect) providerSelect.value = s.provider;

    if (groqApiKey)       groqApiKey.value       = s.groqApiKey       || "";
    if (groqModel)        groqModel.value        = s.groqModel        || defaultSettings.groqModel;
    if (geminiApiKey)     geminiApiKey.value     = s.geminiApiKey     || "";
    if (geminiModel)      geminiModel.value      = s.geminiModel      || defaultSettings.geminiModel;
    if (openaiApiKey)     openaiApiKey.value     = s.openaiApiKey     || "";
    if (openaiModel)      openaiModel.value      = s.openaiModel      || defaultSettings.openaiModel;
    if (openrouterApiKey) openrouterApiKey.value = s.openrouterApiKey || "";
    if (openrouterModel)  openrouterModel.value  = s.openrouterModel  || defaultSettings.openrouterModel;

    customInstruction.value = s.customInstruction || defaultSettings.customInstruction;

    hotkeyType.value   = s.hotkeyType   || defaultSettings.hotkeyType;
    modifierKey.value  = s.modifierKey  || defaultSettings.modifierKey;
    actionKey.value    = s.actionKey    || defaultSettings.actionKey;
    singleKey.value    = s.singleKey    || defaultSettings.singleKey;

    questionSolvingEnabled.checked       = s.questionSolvingEnabled  || false;
    questionSolvingHotkeyType.value      = s.questionSolvingHotkeyType  || defaultSettings.questionSolvingHotkeyType;
    questionSolvingModifierKey.value     = s.questionSolvingModifierKey || defaultSettings.questionSolvingModifierKey;
    questionSolvingActionKey.value       = s.questionSolvingActionKey   || defaultSettings.questionSolvingActionKey;
    questionSolvingSingleKey.value       = s.questionSolvingSingleKey   || defaultSettings.questionSolvingSingleKey;
    autoSolveDelay.value                 = s.autoSolveDelay             || defaultSettings.autoSolveDelay;
    questionDetectionSensitivity.value   = s.questionDetectionSensitivity || defaultSettings.questionDetectionSensitivity;

    imageSolvingEnabled.checked          = s.imageSolvingEnabled        || false;
    imageSolvingHotkeyType.value         = s.imageSolvingHotkeyType     || defaultSettings.imageSolvingHotkeyType;
    imageSolvingModifierKey.value        = s.imageSolvingModifierKey    || defaultSettings.imageSolvingModifierKey;
    imageSolvingActionKey.value          = s.imageSolvingActionKey      || defaultSettings.imageSolvingActionKey;
    imageSolvingSingleKey.value          = s.imageSolvingSingleKey      || defaultSettings.imageSolvingSingleKey;
    imageSolvingInstruction.value        = s.imageSolvingInstruction    || "";

    // Scan zone
    scanZoneEnabled.checked      = s.scanZoneEnabled      || false;
    scanZoneHotkeyType.value     = s.scanZoneHotkeyType   || defaultSettings.scanZoneHotkeyType;
    scanZoneModifierKey.value    = s.scanZoneModifierKey  || defaultSettings.scanZoneModifierKey;
    scanZoneActionKey.value      = s.scanZoneActionKey    || defaultSettings.scanZoneActionKey;
    scanZoneSingleKey.value      = s.scanZoneSingleKey    || defaultSettings.scanZoneSingleKey;
    updateZoneStatus(s.scanRegion);

    // Answer overlay
    answerOverlayEnabled.checked  = s.answerOverlayEnabled || false;
    overlayHotkeyType.value       = s.overlayHotkeyType    || defaultSettings.overlayHotkeyType;
    overlayModifierKey.value      = s.overlayModifierKey   || defaultSettings.overlayModifierKey;
    overlayActionKey.value        = s.overlayActionKey     || defaultSettings.overlayActionKey;
    overlaySingleKey.value        = s.overlaySingleKey     || defaultSettings.overlaySingleKey;
    overlayCloseHotkeyType.value    = s.overlayCloseHotkeyType    || defaultSettings.overlayCloseHotkeyType;
    overlayCloseModifierKey.value   = s.overlayCloseModifierKey   || defaultSettings.overlayCloseModifierKey;
    overlayCloseActionKey.value     = s.overlayCloseActionKey     || defaultSettings.overlayCloseActionKey;
    overlayCloseSingleKey.value     = s.overlayCloseSingleKey     || defaultSettings.overlayCloseSingleKey;

    updateProviderConfig();
    updateHotkeyUI();
    updateQuestionSolvingHotkeyUI();
    updateImageSolvingHotkeyUI();
    updateScanZoneHotkeyUI();

    updateCurrentHotkeyDisplay();
    updateGroqModelBadge();
  } catch (error) {
    showStatus("Error loading settings", "error");
  }
};

const updateGroqModelBadge = () => {
  const badge = document.getElementById("groqModelBadge");
  if (!badge || !groqModel) return;
  if (groqModel.value === "qwen/qwen3.8-27b") {
    badge.style.background = "rgba(16, 185, 129, 0.15)";
    badge.style.color = "#34d399";
    badge.style.border = "1px solid rgba(16, 185, 129, 0.3)";
    badge.textContent = "👁️ Supports Images & Vision";
  } else {
    badge.style.background = "rgba(239, 68, 68, 0.15)";
    badge.style.color = "#f87171";
    badge.style.border = "1px solid rgba(239, 68, 68, 0.3)";
    badge.textContent = "🚫 Does NOT support images (Text only)";
  }
};

// ============================================================
//  SAVE
// ============================================================
const saveSettings = async () => {
  try {
    const s = {
      provider:          providerSelect ? providerSelect.value : "groq",
      groqApiKey:        groqApiKey ? groqApiKey.value.trim() : "",
      groqModel:         groqModel ? groqModel.value : "openai/gpt-oss-120b",
      geminiApiKey:      geminiApiKey ? geminiApiKey.value.trim() : "",
      geminiModel:       geminiModel ? geminiModel.value : "gemini-3.5-flash-lite",
      openaiApiKey:      openaiApiKey ? openaiApiKey.value.trim() : "",
      openaiModel:       openaiModel ? openaiModel.value : "gpt-4o-mini",
      openrouterApiKey:  openrouterApiKey ? openrouterApiKey.value.trim() : "",
      openrouterModel:   openrouterModel ? openrouterModel.value : "meta-llama/llama-3.2-11b-vision-instruct",
      customInstruction: customInstruction.value.trim(),
      hotkeyType:        hotkeyType.value,
      modifierKey:       modifierKey.value,
      actionKey:         actionKey.value,
      singleKey:         singleKey.value,

      questionSolvingEnabled:        questionSolvingEnabled.checked,
      questionSolvingHotkeyType:     questionSolvingHotkeyType.value,
      questionSolvingModifierKey:    questionSolvingModifierKey.value,
      questionSolvingActionKey:      questionSolvingActionKey.value,
      questionSolvingSingleKey:      questionSolvingSingleKey.value,
      autoSolveDelay:                parseInt(autoSolveDelay.value) || 0,
      questionDetectionSensitivity:  questionDetectionSensitivity.value,

      imageSolvingEnabled:           imageSolvingEnabled.checked,
      imageSolvingHotkeyType:        imageSolvingHotkeyType.value,
      imageSolvingModifierKey:       imageSolvingModifierKey.value,
      imageSolvingActionKey:         imageSolvingActionKey.value,
      imageSolvingSingleKey:         imageSolvingSingleKey.value,
      imageSolvingInstruction:       imageSolvingInstruction.value.trim(),

      scanZoneEnabled:      scanZoneEnabled.checked,
      scanZoneHotkeyType:   scanZoneHotkeyType.value,
      scanZoneModifierKey:  scanZoneModifierKey.value,
      scanZoneActionKey:    scanZoneActionKey.value,
      scanZoneSingleKey:    scanZoneSingleKey.value,

      answerOverlayEnabled: answerOverlayEnabled.checked,
      overlayHotkeyType:    overlayHotkeyType.value,
      overlayModifierKey:   overlayModifierKey.value,
      overlayActionKey:     overlayActionKey.value,
      overlaySingleKey:     overlaySingleKey.value,
      overlayCloseHotkeyType:   overlayCloseHotkeyType.value,
      overlayCloseModifierKey:  overlayCloseModifierKey.value,
      overlayCloseActionKey:    overlayCloseActionKey.value,
      overlayCloseSingleKey:    overlayCloseSingleKey.value,
    };

    await chrome.storage.local.set(s);
    showStatus("Settings saved successfully! ✓", "success");
    updateCurrentHotkeyDisplay();
  } catch (error) {
    showStatus("Error saving settings", "error");
  }
};

// ============================================================
//  RESET
// ============================================================
const resetSettings = async () => {
  try {
    await chrome.storage.local.set(defaultSettings);
    await loadSettings();
    showStatus("Settings reset to defaults", "success");
  } catch (error) {
    showStatus("Error resetting settings", "error");
  }
};

// ============================================================
//  STATUS
// ============================================================
const showStatus = (message, type) => {
  const icon = type === 'success' ? '✅' : '❌';
  status.innerHTML = `<span class="status-icon">${icon}</span><span>${message}</span>`;
  status.className = `status ${type} show`;
  setTimeout(() => { status.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 100);
  setTimeout(() => {
    status.classList.remove('show');
    setTimeout(() => { status.innerHTML = ''; status.className = 'status'; }, 300);
  }, 3000);
};

// ============================================================
//  ZONE STATUS DISPLAY
// ============================================================
const updateZoneStatus = (region) => {
  if (region && region.width > 0 && region.height > 0) {
    zoneStatusEl.className = 'zone-status active';
    zoneStatusEl.textContent = `✅ Zone set — ${Math.round(region.width)}×${Math.round(region.height)}px at (${Math.round(region.x)}, ${Math.round(region.y)})`;
  } else {
    zoneStatusEl.className = 'zone-status inactive';
    zoneStatusEl.textContent = '⬜ No zone set — scanning full page';
  }
};

// Clear zone button
clearZoneButton.addEventListener('click', async () => {
  await chrome.storage.local.remove("scanRegion");
  updateZoneStatus(null);
  showStatus("Scan zone cleared — back to full-page scanning", "success");
});

// Listen for scanRegion changes (e.g. user draws a new zone on the page)
chrome.storage.onChanged.addListener((changes) => {
  if (changes.scanRegion) {
    updateZoneStatus(changes.scanRegion.newValue);
  }
});

// ============================================================
//  UI HELPERS
// ============================================================
const updateProviderConfig = () => {
  if (groqConfig) groqConfig.style.display = "block";
  if (geminiConfig) geminiConfig.style.display = "block";
  if (openaiConfig) openaiConfig.style.display = "block";
  const openrouterConfig = document.getElementById("openrouter-config");
  if (openrouterConfig) openrouterConfig.style.display = "block";
};

const updateHotkeyUI = () => {
  const isCombination = hotkeyType.value === "combination";
  combinationHotkey.style.display = isCombination ? "block" : "none";
  singleHotkey.style.display      = isCombination ? "none"  : "block";
};

const updateQuestionSolvingHotkeyUI = () => {
  const isCombination = questionSolvingHotkeyType.value === "combination";
  questionSolvingCombinationHotkey.style.display = isCombination ? "block" : "none";
  questionSolvingSingleHotkey.style.display      = isCombination ? "none"  : "block";
};

const updateImageSolvingHotkeyUI = () => {
  const isCombination = imageSolvingHotkeyType.value === "combination";
  imageSolvingCombinationHotkey.style.display = isCombination ? "block" : "none";
  imageSolvingSingleHotkey.style.display      = isCombination ? "none"  : "block";
};

const updateScanZoneHotkeyUI = () => {
  const isCombination = scanZoneHotkeyType.value === "combination";
  scanZoneCombinationHotkey.style.display = isCombination ? "block" : "none";
  scanZoneSingleHotkey.style.display      = isCombination ? "none"  : "block";
};

const updateOverlayHotkeyUI = () => {
  const isCombination = overlayHotkeyType.value === "combination";
  overlayCombinationHotkey.style.display = isCombination ? "block" : "none";
  overlaySingleHotkey.style.display      = isCombination ? "none"  : "block";
};

const updateOverlayCloseHotkeyUI = () => {
  const isCombination = overlayCloseHotkeyType.value === "combination";
  overlayCloseCombinationHotkey.style.display = isCombination ? "block" : "none";
  overlayCloseSingleHotkey.style.display      = isCombination ? "none"  : "block";
};

const updateCurrentHotkeyDisplay = () => {
  // Regular hotkey
  const hotkeyDesc = hotkeyType.value === "single"
    ? singleKey.value
    : `${modifierKey.value}+${actionKey.value}`;
  currentHotkeySpan.textContent       = hotkeyDesc;
  currentSingleHotkeySpan.textContent = singleKey.value;

  // Question solving hotkey
  const qDesc = questionSolvingHotkeyType.value === "single"
    ? questionSolvingSingleKey.value
    : `${questionSolvingModifierKey.value}+${questionSolvingActionKey.value}`;
  currentQuestionSolvingHotkeySpan.textContent       = qDesc;
  currentQuestionSolvingSingleHotkeySpan.textContent = questionSolvingSingleKey.value;

  // Image solving hotkey
  const imDesc = imageSolvingHotkeyType.value === "single"
    ? imageSolvingSingleKey.value
    : `${imageSolvingModifierKey.value}+${imageSolvingActionKey.value}`;
  currentImageSolvingHotkeySpan.textContent       = imDesc;
  currentImageSolvingSingleHotkeySpan.textContent = imageSolvingSingleKey.value;

  // Scan zone hotkey
  const szDesc = scanZoneHotkeyType.value === "single"
    ? scanZoneSingleKey.value
    : `${scanZoneModifierKey.value}+${scanZoneActionKey.value}`;
  currentScanZoneHotkeySpan.textContent       = szDesc;
  currentScanZoneSingleHotkeySpan.textContent = scanZoneSingleKey.value;

  // Overlay hotkey
  const ovDesc = overlayHotkeyType.value === "single"
    ? overlaySingleKey.value
    : `${overlayModifierKey.value}+${overlayActionKey.value}`;
  currentOverlayHotkeySpan.textContent       = ovDesc;
  currentOverlaySingleHotkeySpan.textContent = overlaySingleKey.value;

  // Close overlay hotkey
  const clDesc = overlayCloseHotkeyType.value === "single"
    ? overlayCloseSingleKey.value
    : `${overlayCloseModifierKey.value}+${overlayCloseActionKey.value}`;
  currentOverlayCloseHotkeySpan.textContent       = clDesc;
  currentOverlayCloseSingleHotkeySpan.textContent = overlayCloseSingleKey.value;
};

// ============================================================
//  EVENT LISTENERS
// ============================================================
providerSelect.addEventListener("change", updateProviderConfig);
if (groqModel) groqModel.addEventListener("change", updateGroqModelBadge);
hotkeyType.addEventListener("change", updateHotkeyUI);
questionSolvingHotkeyType.addEventListener("change", updateQuestionSolvingHotkeyUI);
imageSolvingHotkeyType.addEventListener("change", updateImageSolvingHotkeyUI);
scanZoneHotkeyType.addEventListener("change", updateScanZoneHotkeyUI);
overlayHotkeyType.addEventListener("change", updateOverlayHotkeyUI);
overlayCloseHotkeyType.addEventListener("change", updateOverlayCloseHotkeyUI);

saveButton.addEventListener("click", saveSettings);
resetButton.addEventListener("click", resetSettings);

[modifierKey, actionKey, singleKey].forEach(el => el.addEventListener("change", updateCurrentHotkeyDisplay));
[questionSolvingModifierKey, questionSolvingActionKey, questionSolvingSingleKey]
  .forEach(el => el.addEventListener("change", updateCurrentHotkeyDisplay));
[imageSolvingModifierKey, imageSolvingActionKey, imageSolvingSingleKey]
  .forEach(el => el.addEventListener("change", updateCurrentHotkeyDisplay));
[scanZoneModifierKey, scanZoneActionKey, scanZoneSingleKey]
  .forEach(el => el.addEventListener("change", updateCurrentHotkeyDisplay));
[overlayModifierKey, overlayActionKey, overlaySingleKey]
  .forEach(el => el.addEventListener("change", updateCurrentHotkeyDisplay));
[overlayCloseModifierKey, overlayCloseActionKey, overlayCloseSingleKey]
  .forEach(el => el.addEventListener("change", updateCurrentHotkeyDisplay));

// Also initialise overlay hotkey UI on first render
document.addEventListener("DOMContentLoaded", () => { loadSettings().then(() => { updateOverlayHotkeyUI(); updateOverlayCloseHotkeyUI(); }); });
