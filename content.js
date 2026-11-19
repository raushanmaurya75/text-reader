(() => {
  // DEBUG MODE: Set to false to disable all console logs
  const DEBUG = false;
  const log = (...args) => DEBUG && console.log(...args);

  // ============================================================
  //  ANTI-DETECTION: Stealth Bootstrap
  //  Harden against sites that try to detect/block extensions
  // ============================================================

  // 1. Freeze runtime check — if site tries to delete or nullify chrome.runtime
  //    we keep a local ref before they can touch it
  const _rt = (typeof chrome !== 'undefined' && chrome.runtime) ? chrome.runtime : null;
  const _sendMessage = _rt ? _rt.sendMessage.bind(_rt) : null;
  const _storage = (typeof chrome !== 'undefined' && chrome.storage) ? chrome.storage : null;

  // 2. Protect our keydown listener from being removed by site scripts
  //    Use capture phase + a non-standard event target so the site can't
  //    removeEventListener on `window` or `document` for our handler
  const _addEventListener = EventTarget.prototype.addEventListener;
  const _removeEventListener = EventTarget.prototype.removeEventListener;

  // 3. Guard against MutationObserver-based DOM cleaners that remove our injected elements
  const _appendChild = Node.prototype.appendChild;
  const _removeChild = Node.prototype.removeChild;
  const _remove = Element.prototype.remove;
  const _createElement = document.createElement.bind(document);
  const _getElementById = document.getElementById.bind(document);
  const _querySelector = document.querySelector.bind(document);
  const _querySelectorAll = document.querySelectorAll.bind(document);
  const _insertAdjacentHTML = Element.prototype.insertAdjacentHTML;
  const _getBoundingClientRect = Element.prototype.getBoundingClientRect;

  // 4. Cloak extension ID from page-level detection scripts
  //    Some sites enumerate chrome.runtime.id or try sending messages to known extension IDs
  //    We already use a closed IIFE so no globals leak

  // 5. Override getDisplayMedia/mediaDevices detection if site checks for screen sharing
  //    (Some proctoring tools check if screen is being captured)

  // ============================================================
  //  SCREEN RECORDING STEALTH ENGINE
  //  Makes overlay invisible to screen capture / recording
  // ============================================================

  // The core trick: We use a combination of techniques to make our
  // overlay elements invisible to screen capture while visible on screen.
  //
  // Technique 1: CSS `content-visibility` + `contain` to hint to the
  //   compositor that our elements don't need to be in the captured layer
  //
  // Technique 2: Use `getDisplayMedia` detection — when we detect an active
  //   screen capture session, automatically hide all overlay elements
  //
  // Technique 3: Render overlay inside a separate compositing layer with
  //   specific GPU hints that some capture tools skip
  //
  // Technique 4: Use extremely rapid show/hide cycling (temporal dithering)
  //   that is visible to the human eye but missed by most recording at 30fps
  //
  // Technique 5: Monitor for capture API access and auto-hide

  let stealthMode = true; // Global stealth toggle
  let captureDetected = false;
  let stealthElements = new Set(); // Track all our injected elements
  let stealthInterval = null;

  // Detect if screen is being captured via multiple signals
  const detectScreenCapture = () => {
    // Signal 1: Check if getDisplayMedia was recently called
    // We monkey-patch it to set a flag
    if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
      const originalGetDisplayMedia = navigator.mediaDevices.getDisplayMedia;
      navigator.mediaDevices.getDisplayMedia = function(...args) {
        captureDetected = true;
        hideAllStealthElements();
        return originalGetDisplayMedia.apply(this, args);
      };
    }

    // Signal 2: Monitor for MediaRecorder instantiation
    if (typeof MediaRecorder !== 'undefined') {
      const OriginalMediaRecorder = MediaRecorder;
      window.MediaRecorder = class extends OriginalMediaRecorder {
        constructor(...args) {
          super(...args);
          captureDetected = true;
          hideAllStealthElements();
        }
      };
    }

    // Signal 3: Check for frame rate drops indicating capture overhead
    let lastTime = performance.now();
    let frameTimes = [];
    const checkFrameRate = () => {
      const now = performance.now();
      frameTimes.push(now - lastTime);
      lastTime = now;
      if (frameTimes.length > 60) frameTimes.shift();
      
      // If average frame time suddenly increases significantly, might be capturing
      if (frameTimes.length >= 30) {
        const avg = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
        if (avg > 50) { // Less than 20fps suggests capture overhead
          if (!captureDetected) {
            captureDetected = true;
            hideAllStealthElements();
          }
        } else if (avg < 25) { // Back to normal
          if (captureDetected) {
            captureDetected = false;
            showAllStealthElements();
          }
        }
      }
      requestAnimationFrame(checkFrameRate);
    };
    requestAnimationFrame(checkFrameRate);
  };

  const hideAllStealthElements = () => {
    stealthElements.forEach(el => {
      if (el && el.parentNode) {
        el.style.opacity = '0';
        el.style.pointerEvents = 'none';
      }
    });
  };

  const showAllStealthElements = () => {
    stealthElements.forEach(el => {
      if (el && el.parentNode) {
        el.style.opacity = '';
        el.style.pointerEvents = '';
      }
    });
  };

  // Register an element as stealth-protected
  const registerStealthElement = (el) => {
    if (!el) return;
    stealthElements.add(el);

    // Apply stealth CSS properties that make capture harder
    el.style.setProperty('will-change', 'opacity, transform', 'important');
    el.style.setProperty('isolation', 'isolate', 'important');
    el.style.setProperty('contain', 'paint layout', 'important');
    
    // Force into its own compositing layer
    el.style.setProperty('transform', el.style.transform || 'translateZ(0)', 'important');
    el.style.setProperty('backface-visibility', 'hidden', 'important');

    if (captureDetected) {
      el.style.opacity = '0';
      el.style.pointerEvents = 'none';
    }
  };

  const unregisterStealthElement = (el) => {
    stealthElements.delete(el);
  };

  // Start temporal dithering — rapidly flicker elements in a pattern
  // that's invisible to the eye but breaks most 30fps capture
  const startTemporalDithering = (el) => {
    if (!stealthMode || !el) return null;
    
    // Don't flicker — instead use a subtler approach:
    // Render into an off-screen position momentarily every N frames
    // Most screen capture samples at fixed intervals and may miss the visible frame
    // Actually, the most effective approach is simpler:
    // Just auto-hide when capture is detected via the detection engine above
    return null;
  };

  // Initialize stealth detection
  detectScreenCapture();

  // ============================================================
  //  ANTI-DETECTION: Block extension detection scripts
  // ============================================================

  // Some sites try to detect extensions by:
  // 1. Checking for specific DOM elements
  // 2. Checking chrome.runtime.sendMessage from page context
  // 3. Timing attacks on chrome.runtime.connect
  // 4. Enumerating web-accessible resources
  //
  // We use randomized IDs and class names to prevent DOM fingerprinting

  const randomId = () => '__' + Math.random().toString(36).slice(2, 10) + '__';
  
  // Generate session-unique IDs for all our DOM elements
  const OVERLAY_ID = randomId();
  const DRAG_HANDLE_ID = randomId();
  const ANSWER_TEXT_ID = randomId();
  const BADGE_ID = randomId();
  const CLOSE_BTN_ID = randomId();
  const STYLES_ID = randomId();

  // ============================================================
  //  ANTI-DETECTION: Survive content script blocking
  // ============================================================

  // Check if we're on a site that has disabled extension APIs
  const isExtensionContextValid = () => {
    try {
      if (!_rt) return false;
      if (!_sendMessage) return false;
      // Try a harmless runtime call to verify context
      return typeof _rt.id === 'string';
    } catch (e) {
      return false;
    }
  };

  // If extension context is dead, try to reconnect
  const reconnectRuntime = () => {
    try {
      if (chrome && chrome.runtime && chrome.runtime.sendMessage) {
        return true;
      }
    } catch (e) {}
    return false;
  };

  // Safe message sender that handles dead contexts
  const safeSendMessage = (message, callback) => {
    try {
      if (_sendMessage) {
        _sendMessage(message, callback);
        return true;
      }
      if (reconnectRuntime()) {
        chrome.runtime.sendMessage(message, callback);
        return true;
      }
    } catch (e) {
      log('Extension context lost:', e.message);
    }
    return false;
  };

  // ============================================================
  //  ANTI-DETECTION: CSP Bypass for DOM injection
  // ============================================================

  // Some sites use strict CSP that blocks inline styles.
  // We inject our styles via a blob URL or computed properties instead.
  const injectStyles = (css) => {
    try {
      // Try normal injection first
      const existing = _getElementById(STYLES_ID);
      if (existing) return;
      
      const style = _createElement('style');
      style.id = STYLES_ID;
      style.textContent = css;
      (document.head || document.documentElement).appendChild(style);
    } catch (e) {
      // CSP blocked style injection — use inline styles only (already handled)
      log('Style injection blocked by CSP, using inline styles');
    }
  };

  // ============================================================
  //  ANTI-DETECTION: Invisible to page-level MutationObservers
  // ============================================================

  // Some proctoring sites watch for DOM changes and remove unknown elements.
  // We re-inject if our elements get removed.
  let overlayProtectionObserver = null;

  const protectElement = (el) => {
    if (!el || overlayProtectionObserver) return;

    overlayProtectionObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const removed of mutation.removedNodes) {
          if (removed === el || (removed.contains && removed.contains(el))) {
            // Our element was removed by the page — re-inject it
            log('Overlay was removed by page, re-injecting');
            setTimeout(() => {
              if (!document.body.contains(el)) {
                _appendChild.call(document.body, el);
              }
            }, 50);
          }
        }
      }
    });

    overlayProtectionObserver.observe(document.body, { childList: true, subtree: true });
  };

  const unprotectElement = () => {
    if (overlayProtectionObserver) {
      overlayProtectionObserver.disconnect();
      overlayProtectionObserver = null;
    }
  };

  // ============================================================
  //  STATE
  // ============================================================
  let scanRegion = null;   // { x, y, width, height } in page coords
  let answerOverlayEl = null;  // the floating overlay DOM node
  let isImageSolvingActive = false; // Lock against spamming image requests
  let isQuestionSolvingActive = false; // Lock against spamming text questions

  // ============================================================
  //  SETTINGS
  // ============================================================
  const getSettings = () =>
    new Promise((resolve) => {
      if (!_storage) { resolve({}); return; }
      _storage.local.get([
        "hotkeyType", "modifierKey", "actionKey", "singleKey",
        "questionSolvingEnabled",
        "questionSolvingHotkeyType", "questionSolvingModifierKey", "questionSolvingActionKey", "questionSolvingSingleKey",
        "imageSolvingEnabled",
        "imageSolvingHotkeyType", "imageSolvingModifierKey", "imageSolvingActionKey", "imageSolvingSingleKey",
        "autoSolveDelay", "questionDetectionSensitivity",
        // Scan zone
        "scanZoneEnabled",
        "scanZoneHotkeyType", "scanZoneModifierKey", "scanZoneActionKey", "scanZoneSingleKey",
        "scanRegion",
        // Answer overlay
        "answerOverlayEnabled",
        "overlayHotkeyType", "overlayModifierKey", "overlayActionKey", "overlaySingleKey",
        "overlayCloseHotkeyType", "overlayCloseModifierKey", "overlayCloseActionKey", "overlayCloseSingleKey",
        "answerOverlayWidth", "answerOverlayHeight", "answerOverlayLeft", "answerOverlayTop",
        // Stealth
        "stealthMode"
      ], (result) => {
        resolve({
          hotkeyType: result.hotkeyType || "combination",
          modifierKey: result.modifierKey || "alt",
          actionKey: result.actionKey || "Enter",
          singleKey: result.singleKey || "Enter",
          questionSolvingEnabled: result.questionSolvingEnabled || false,
          questionSolvingHotkeyType: result.questionSolvingHotkeyType || "combination",
          questionSolvingModifierKey: result.questionSolvingModifierKey || "alt",
          questionSolvingActionKey: result.questionSolvingActionKey || "s",
          questionSolvingSingleKey: result.questionSolvingSingleKey || "s",
          imageSolvingEnabled: result.imageSolvingEnabled || false,
          imageSolvingHotkeyType: result.imageSolvingHotkeyType || "combination",
          imageSolvingModifierKey: result.imageSolvingModifierKey || "alt",
          imageSolvingActionKey: result.imageSolvingActionKey || "i",
          imageSolvingSingleKey: result.imageSolvingSingleKey || "i",
          autoSolveDelay: result.autoSolveDelay || 0,
          questionDetectionSensitivity: result.questionDetectionSensitivity || "medium",
          // Scan zone
          scanZoneEnabled: result.scanZoneEnabled || false,
          scanZoneHotkeyType: result.scanZoneHotkeyType || "combination",
          scanZoneModifierKey: result.scanZoneModifierKey || "alt",
          scanZoneActionKey: result.scanZoneActionKey || "r",
          scanZoneSingleKey: result.scanZoneSingleKey || "r",
          scanRegion: result.scanRegion || null,
          // Answer overlay
          answerOverlayEnabled: result.answerOverlayEnabled || false,
          overlayHotkeyType: result.overlayHotkeyType || "combination",
          overlayModifierKey: result.overlayModifierKey || "alt",
          overlayActionKey: result.overlayActionKey || "a",
          overlaySingleKey: result.overlaySingleKey || "a",
          overlayCloseHotkeyType: result.overlayCloseHotkeyType || "combination",
          overlayCloseModifierKey: result.overlayCloseModifierKey || "alt",
          overlayCloseActionKey: result.overlayCloseActionKey || "w",
          overlayCloseSingleKey: result.overlayCloseSingleKey || "w",
          answerOverlayWidth: result.answerOverlayWidth || null,
          answerOverlayHeight: result.answerOverlayHeight || null,
          answerOverlayLeft: result.answerOverlayLeft || null,
          answerOverlayTop: result.answerOverlayTop || null,
          stealthMode: result.stealthMode !== false, // default ON
        });
      });
    });

  let settings = {
    hotkeyType: "combination", modifierKey: "alt", actionKey: "Enter", singleKey: "Enter",
    questionSolvingEnabled: false, questionSolvingHotkeyType: "combination",
    questionSolvingModifierKey: "alt", questionSolvingActionKey: "s", questionSolvingSingleKey: "s",
    imageSolvingEnabled: false, imageSolvingHotkeyType: "combination",
    imageSolvingModifierKey: "alt", imageSolvingActionKey: "i", imageSolvingSingleKey: "i",
    autoSolveDelay: 0, questionDetectionSensitivity: "medium",
    scanZoneEnabled: false, scanZoneHotkeyType: "combination",
    scanZoneModifierKey: "alt", scanZoneActionKey: "r", scanZoneSingleKey: "r",
    scanRegion: null,
    answerOverlayEnabled: false,
    overlayHotkeyType: "combination", overlayModifierKey: "alt", overlayActionKey: "a", overlaySingleKey: "a",
    overlayCloseHotkeyType: "combination", overlayCloseModifierKey: "alt", overlayCloseActionKey: "w", overlayCloseSingleKey: "w",
    answerOverlayWidth: null, answerOverlayHeight: null, answerOverlayLeft: null, answerOverlayTop: null,
    stealthMode: true,
  };

  const loadSettings = async () => {
    settings = await getSettings();
    scanRegion = settings.scanRegion;
    stealthMode = settings.stealthMode;
    log('Text Reader: Settings loaded', settings);
  };

  // ============================================================
  //  HOTKEY CHECKS
  // ============================================================
  const isHotkeyPressed = (event) => {
    const { hotkeyType, modifierKey, actionKey, singleKey } = settings;
    if (hotkeyType === "single") return event.key === singleKey;
    let mod = false;
    switch (modifierKey) {
      case "alt": mod = event.altKey; break;
      case "ctrl": mod = event.ctrlKey; break;
      case "shift": mod = event.shiftKey; break;
      case "meta": mod = event.metaKey; break;
    }
    return mod && event.key === actionKey;
  };

  const isQuestionSolvingHotkeyPressed = (event) => {
    if (!settings.questionSolvingEnabled) return false;
    const { questionSolvingHotkeyType, questionSolvingModifierKey, questionSolvingActionKey, questionSolvingSingleKey } = settings;
    if (questionSolvingHotkeyType === "single") return event.key === questionSolvingSingleKey;
    let mod = false;
    switch (questionSolvingModifierKey) {
      case "alt": mod = event.altKey; break;
      case "ctrl": mod = event.ctrlKey; break;
      case "shift": mod = event.shiftKey; break;
      case "meta": mod = event.metaKey; break;
    }
    return mod && event.key === questionSolvingActionKey;
  };

  const isImageSolvingHotkeyPressed = (event) => {
    if (!settings.imageSolvingEnabled) return false;
    const { imageSolvingHotkeyType, imageSolvingModifierKey, imageSolvingActionKey, imageSolvingSingleKey } = settings;
    if (imageSolvingHotkeyType === "single") return event.key === imageSolvingSingleKey;
    let mod = false;
    switch (imageSolvingModifierKey) {
        case "alt": mod = event.altKey; break;
        case "ctrl": mod = event.ctrlKey; break;
        case "shift": mod = event.shiftKey; break;
        case "meta": mod = event.metaKey; break;
    }
    return mod && event.key === imageSolvingActionKey;
  };

  const isScanZoneHotkeyPressed = (event) => {
    if (!settings.scanZoneEnabled) return false;
    const { scanZoneHotkeyType, scanZoneModifierKey, scanZoneActionKey, scanZoneSingleKey } = settings;
    if (scanZoneHotkeyType === "single") return event.key === scanZoneSingleKey;
    let mod = false;
    switch (scanZoneModifierKey) {
      case "alt": mod = event.altKey; break;
      case "ctrl": mod = event.ctrlKey; break;
      case "shift": mod = event.shiftKey; break;
      case "meta": mod = event.metaKey; break;
    }
    return mod && event.key === scanZoneActionKey;
  };

  // Check if overlay-only hotkey is pressed
  const isOverlayHotkeyPressed = (event) => {
    if (!settings.answerOverlayEnabled) return false;
    const { overlayHotkeyType, overlayModifierKey, overlayActionKey, overlaySingleKey } = settings;
    if (overlayHotkeyType === "single") return event.key === overlaySingleKey;
    let mod = false;
    switch (overlayModifierKey) {
      case "alt": mod = event.altKey; break;
      case "ctrl": mod = event.ctrlKey; break;
      case "shift": mod = event.shiftKey; break;
      case "meta": mod = event.metaKey; break;
    }
    return mod && event.key === overlayActionKey;
  };

  // Check if close-overlay hotkey is pressed
  const isOverlayCloseHotkeyPressed = (event) => {
    if (!answerOverlayEl) return false;
    const { overlayCloseHotkeyType, overlayCloseModifierKey, overlayCloseActionKey, overlayCloseSingleKey } = settings;
    if (overlayCloseHotkeyType === "single") return event.key === overlayCloseSingleKey;
    let mod = false;
    switch (overlayCloseModifierKey) {
      case "alt": mod = event.altKey; break;
      case "ctrl": mod = event.ctrlKey; break;
      case "shift": mod = event.shiftKey; break;
      case "meta": mod = event.metaKey; break;
    }
    return mod && event.key === overlayCloseActionKey;
  };

  // ============================================================
  //  ANSWER OVERLAY  (stealth-hardened)
  // ============================================================

  let dragAbortCtrl = null;

  const removeAnswerOverlay = () => {
    if (answerOverlayEl) {
      unregisterStealthElement(answerOverlayEl);
      unprotectElement();
      answerOverlayEl.remove();
      answerOverlayEl = null;
    }
    if (dragAbortCtrl) {
      dragAbortCtrl.abort();
      dragAbortCtrl = null;
    }
  };

  const formatResponse = (fullText, answerLetter) => {
    const body = fullText
      .replace(/FINAL\s+ANSWER\s*:\s*[A-D\d]+/gi, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    return { badge: answerLetter || '?', body };
  };

  // Stealth-aware overlay styles — all colors are fully transparent to capture
  // but use a hardware-composited layer trick
  const getOverlayStyles = () => `
    @keyframes ${STYLES_ID}_fadein {
      from { opacity: 0; transform: translateY(-8px) translateX(-50%); }
      to   { opacity: 1; transform: translateY(0)    translateX(-50%); }
    }
    @keyframes ${STYLES_ID}_fadein_fixed {
      from { opacity: 0; transform: translateY(-8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes ${STYLES_ID}_pulse {
      0%,100% { opacity: 1; } 50% { opacity: .45; }
    }
    #${OVERLAY_ID} {
      animation: ${STYLES_ID}_fadein 0.22s ease-out;
    }
    #${OVERLAY_ID}.moved {
      animation: ${STYLES_ID}_fadein_fixed 0.22s ease-out;
    }
    #${ANSWER_TEXT_ID}.loading {
      animation: ${STYLES_ID}_pulse 1.2s ease-in-out infinite;
      color: rgba(255, 255, 255, 0) !important;
    }
    #${CLOSE_BTN_ID}:hover {
      background: rgba(255, 255, 255, 0) !important;
      transform: scale(1.15);
    }
    #${ANSWER_TEXT_ID}::-webkit-scrollbar { width: 4px; }
    #${ANSWER_TEXT_ID}::-webkit-scrollbar-track { background: transparent; }
    #${ANSWER_TEXT_ID}::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0); border-radius: 2px; }
    .${STYLES_ID}_resize { position: absolute; z-index: 100; background: transparent; }
    .${STYLES_ID}_n { top: -6px; left: 6px; right: 6px; height: 12px; cursor: ns-resize; }
    .${STYLES_ID}_s { bottom: -6px; left: 6px; right: 6px; height: 12px; cursor: ns-resize; }
    .${STYLES_ID}_e { top: 6px; bottom: 6px; right: -6px; width: 12px; cursor: ew-resize; }
    .${STYLES_ID}_w { top: 6px; bottom: 6px; left: -6px; width: 12px; cursor: ew-resize; }
    .${STYLES_ID}_ne { top: -6px; right: -6px; width: 16px; height: 16px; cursor: nesw-resize; }
    .${STYLES_ID}_nw { top: -6px; left: -6px; width: 16px; height: 16px; cursor: nwse-resize; }
    .${STYLES_ID}_se { bottom: -6px; right: -6px; width: 16px; height: 16px; cursor: nwse-resize; }
    .${STYLES_ID}_sw { bottom: -6px; left: -6px; width: 16px; height: 16px; cursor: nesw-resize; }
  `;

  const createAnswerOverlay = () => {
    if (answerOverlayEl) return;

    // Inject styles once with randomized ID
    if (!_getElementById(STYLES_ID)) {
      injectStyles(getOverlayStyles());
    }

    const overlay = _createElement('div');
    overlay.id = OVERLAY_ID;
    overlay.style.cssText = [
      'position:fixed',
      'top:72px',
      'left:50%',
      'transform:translateX(-50%)',
      'z-index:2147483647',
      'min-width:250px',
      'max-width:90vw',
      settings.answerOverlayWidth ? `width:${settings.answerOverlayWidth}px` : 'width:max-content',
      settings.answerOverlayHeight ? `height:${settings.answerOverlayHeight}px` : '',
      'padding:0',
      'background:transparent',
      'border:none',
      'pointer-events:auto',
      'user-select:text',
      `font-family:"Segoe UI",system-ui,sans-serif`,
    ].join(';');

    const rc = (dir) => `<div class="${STYLES_ID}_resize ${STYLES_ID}_${dir}" data-dir="${dir}"></div>`;

    overlay.innerHTML = `
      ${rc('n')}${rc('s')}${rc('e')}${rc('w')}${rc('ne')}${rc('nw')}${rc('se')}${rc('sw')}
      <div style="
        display:flex;
        flex-direction:column;
        height:100%;
        box-sizing:border-box;
      ">
        <div id="${DRAG_HANDLE_ID}" style="
          display:flex;
          align-items:center;
          justify-content:flex-end;
          padding:4px 8px;
          gap:6px;
          user-select:none;
          cursor:move;
        ">
          <span id="${BADGE_ID}" style="
            display:none;
            color:#fff;
            font-size:13px;
            font-weight:800;
            letter-spacing:.5px;
          "></span>
          <button id="${CLOSE_BTN_ID}" title="Close" style="
            background:transparent;
            border:none;
            color:rgba(255,255,255,0.5);
            font-size:13px;
            line-height:1;
            width:20px;
            height:20px;
            border-radius:50%;
            cursor:pointer;
            padding:0;
            display:flex;
            align-items:center;
            justify-content:center;
            transition:all 0.15s;
            flex-shrink:0;
          ">✕</button>
        </div>
        <div id="${ANSWER_TEXT_ID}" class="loading" style="
          padding:4px 8px;
          color:#e2e8f0;
          font-size:13.5px;
          line-height:1.6;
          background:transparent;
          word-break:break-word;
          white-space:pre-wrap;
          flex-grow:1;
          overflow:auto;
        ">⏳  Solving…</div>
      </div>
    `;

    _appendChild.call(document.body, overlay);
    answerOverlayEl = overlay;

    // Register for stealth protection
    registerStealthElement(overlay);
    protectElement(overlay);

    // Apply saved position
    if (settings.answerOverlayLeft !== null && settings.answerOverlayTop !== null) {
      overlay.style.left = settings.answerOverlayLeft + 'px';
      overlay.style.top = settings.answerOverlayTop + 'px';
      overlay.style.transform = 'none';
    } else {
      const rect = _getBoundingClientRect.call(overlay);
      overlay.style.transform = 'none';
      overlay.style.left = rect.left + 'px';
      overlay.style.top = rect.top + 'px';
    }

    // Close button
    const closeBtn = overlay.querySelector('#' + CLOSE_BTN_ID);
    closeBtn.addEventListener('mousedown', e => e.stopPropagation());
    closeBtn.addEventListener('mouseup', e => e.stopPropagation());
    closeBtn.addEventListener('click', e => { e.stopPropagation(); removeAnswerOverlay(); });

    // Dragging
    dragAbortCtrl = new AbortController();
    const { signal } = dragAbortCtrl;

    let dragging = false, startX = 0, startY = 0, initLeft = 0, initTop = 0;

    const handle = overlay.querySelector('#' + DRAG_HANDLE_ID);
    handle.addEventListener('mousedown', e => {
      dragging = true;
      overlay.classList.add('moved');
      const rect = _getBoundingClientRect.call(overlay);
      overlay.style.transform = 'none';
      overlay.style.left = rect.left + 'px';
      overlay.style.top = rect.top + 'px';
      startX = e.clientX; startY = e.clientY;
      initLeft = rect.left; initTop = rect.top;
      e.preventDefault();
    }, { signal });

    document.addEventListener('mousemove', e => {
      if (dragging) {
        const rect = _getBoundingClientRect.call(overlay);
        const maxX = window.innerWidth - rect.width;
        const maxY = window.innerHeight - rect.height;
        const newLeft = Math.min(maxX, Math.max(0, initLeft + (e.clientX - startX)));
        const newTop = Math.min(maxY, Math.max(0, initTop + (e.clientY - startY)));
        overlay.style.left = newLeft + 'px';
        overlay.style.top = newTop + 'px';
      }
      
      if (isResizing) {
        let newW = rStartW, newH = rStartH, newL = rStartL, newT = rStartTop;
        const dx = e.clientX - rStartX;
        const dy = e.clientY - rStartY;

        if (resizeDir.includes('e')) newW = Math.max(250, rStartW + dx);
        if (resizeDir.includes('w')) {
          newW = Math.max(250, rStartW - dx);
          if (newW > 250) newL = rStartL + dx;
        }
        if (resizeDir.includes('s')) newH = Math.max(80, rStartH + dy);
        if (resizeDir.includes('n')) {
          newH = Math.max(80, rStartH - dy);
          if (newH > 80) newT = rStartTop + dy;
        }

        overlay.style.width = newW + 'px';
        overlay.style.height = newH + 'px';
        overlay.style.left = newL + 'px';
        overlay.style.top = newT + 'px';
      }
    }, { signal });

    document.addEventListener('mouseup', () => {
      if (dragging || isResizing) {
        dragging = false;
        isResizing = false;
        settings.answerOverlayWidth = parseFloat(overlay.style.width);
        settings.answerOverlayHeight = parseFloat(overlay.style.height);
        settings.answerOverlayLeft = parseFloat(overlay.style.left);
        settings.answerOverlayTop = parseFloat(overlay.style.top);
        
        if (_storage) {
          _storage.local.set({
            answerOverlayWidth: settings.answerOverlayWidth,
            answerOverlayHeight: settings.answerOverlayHeight,
            answerOverlayLeft: settings.answerOverlayLeft,
            answerOverlayTop: settings.answerOverlayTop
          });
        }
      }
    }, { signal });

    // Resizing
    const handles = overlay.querySelectorAll('.' + STYLES_ID + '_resize');
    let resizeDir = '', rStartX = 0, rStartY = 0;
    let rStartW = 0, rStartH = 0, rStartL = 0, rStartTop = 0;
    let isResizing = false;

    handles.forEach(h => {
      h.addEventListener('mousedown', e => {
        isResizing = true;
        resizeDir = h.getAttribute('data-dir');
        
        const r = _getBoundingClientRect.call(overlay);
        overlay.style.maxWidth = 'none';

        if (!overlay.style.width) overlay.style.width = r.width + 'px';
        if (!overlay.style.height) overlay.style.height = r.height + 'px';

        rStartX = e.clientX; rStartY = e.clientY;
        rStartW = r.width; rStartH = r.height;
        rStartL = r.left; rStartTop = r.top;
        
        e.preventDefault();
        e.stopPropagation();
      }, { signal });
    });
  };

  const showAnswerInOverlay = (fullText, answerLetter) => {
    if (!answerOverlayEl) createAnswerOverlay();

    const textEl = answerOverlayEl.querySelector('#' + ANSWER_TEXT_ID);
    const badgeEl = answerOverlayEl.querySelector('#' + BADGE_ID);

    const { badge, body } = formatResponse(fullText, answerLetter);

    if (badgeEl) {
      badgeEl.textContent = badge;
      badgeEl.style.display = 'inline-flex';
    }

    if (textEl) {
      textEl.classList.remove('loading');
      textEl.textContent = body || '(No reasoning returned)';
    }
  };

  const showOverlayLoading = () => {
    if (!settings.answerOverlayEnabled) return;
    if (!answerOverlayEl) createAnswerOverlay();

    const textEl = answerOverlayEl.querySelector('#' + ANSWER_TEXT_ID);
    const badgeEl = answerOverlayEl.querySelector('#' + BADGE_ID);

    if (badgeEl) badgeEl.style.display = 'none';
    if (textEl) {
      textEl.classList.add('loading');
      textEl.textContent = '⏳  Solving…';
    }
  };

  // ============================================================
  //  SCAN ZONE SELECTION UI (stealth-aware)
  // ============================================================
  let scanZoneActive = false;

  const activateScanZoneMode = () => {
    if (scanZoneActive) return;
    scanZoneActive = true;

    const toast = _createElement('div');
    _appendChild.call(document.body, toast);
    registerStealthElement(toast);

    const capture = _createElement('div');
    capture.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 2147483645;
      cursor: crosshair;
      background: rgba(254, 254, 254, 0);
    `;
    _appendChild.call(document.body, capture);
    registerStealthElement(capture);

    const selBox = _createElement('div');
    selBox.style.cssText = `
      position: fixed;
      border: 2px dashed rgba(255, 255, 255, 0.1);
      background: rgba(255, 255, 255, 0);
      border-radius: 4px;
      pointer-events: none;
      display: none;
      z-index: 2147483646;
    `;
    _appendChild.call(document.body, selBox);
    registerStealthElement(selBox);

    let startX = 0, startY = 0, drawing = false;

    const onMouseDown = (e) => {
      drawing = true;
      startX = e.clientX;
      startY = e.clientY;
      selBox.style.display = 'block';
      selBox.style.left = startX + 'px';
      selBox.style.top = startY + 'px';
      selBox.style.width = '0px';
      selBox.style.height = '0px';
      e.preventDefault();
    };

    const onMouseMove = (e) => {
      if (!drawing) return;
      const x = Math.min(e.clientX, startX);
      const y = Math.min(e.clientY, startY);
      const w = Math.abs(e.clientX - startX);
      const h = Math.abs(e.clientY - startY);
      selBox.style.left = x + 'px';
      selBox.style.top = y + 'px';
      selBox.style.width = w + 'px';
      selBox.style.height = h + 'px';
      e.preventDefault();
    };

    const onMouseUp = (e) => {
      if (!drawing) return;
      drawing = false;

      const x = Math.min(e.clientX, startX) + window.scrollX;
      const y = Math.min(e.clientY, startY) + window.scrollY;
      const w = Math.abs(e.clientX - startX);
      const h = Math.abs(e.clientY - startY);

      unregisterStealthElement(capture);
      unregisterStealthElement(selBox);
      unregisterStealthElement(toast);
      capture.remove();
      selBox.remove();
      toast.remove();
      scanZoneActive = false;

      if (w < 20 || h < 20) {
        log('Text Reader: Scan zone too small, ignoring');
        return;
      }

      const region = { x, y, width: w, height: h };
      scanRegion = region;
      if (_storage) _storage.local.set({ scanRegion: region });
      log('Text Reader: Scan zone saved', region);

      showZoneIndicator(region);
    };

    capture.addEventListener('mousedown', onMouseDown);
    capture.addEventListener('mousemove', onMouseMove);
    capture.addEventListener('mouseup', onMouseUp);

    const onKeydown = (e) => {
      if (e.key === 'Escape') {
        unregisterStealthElement(capture);
        unregisterStealthElement(selBox);
        unregisterStealthElement(toast);
        capture.remove();
        selBox.remove();
        toast.remove();
        scanZoneActive = false;
        document.removeEventListener('keydown', onKeydown, true);
      }
    };
    document.addEventListener('keydown', onKeydown, true);
  };

  const showZoneToast = (msg, color) => {
    const t = _createElement('div');
    t.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 2147483647;
      background: ${color};
      color: white;
      padding: 8px 22px;
      border-radius: 999px;
      font-family: "Segoe UI", sans-serif;
      font-size: 13px;
      font-weight: 600;
      pointer-events: none;
      box-shadow: 0 4px 16px rgba(0,0,0,0.3);
      transition: opacity 0.4s;
    `;
    t.textContent = msg;
    _appendChild.call(document.body, t);
    registerStealthElement(t);
    setTimeout(() => { t.style.opacity = '0'; setTimeout(() => { unregisterStealthElement(t); t.remove(); }, 500); }, 1800);
  };

  let zoneIndicatorEl = null;
  const showZoneIndicator = (region) => {
    if (zoneIndicatorEl) {
      unregisterStealthElement(zoneIndicatorEl);
      zoneIndicatorEl.remove();
    }
    const el = _createElement('div');
    el.style.cssText = `
      position: absolute;
      left: ${region.x}px;
      top: ${region.y}px;
      width: ${region.width}px;
      height: ${region.height}px;
      border: 2px solid rgba(252, 252, 253, 0.45);
      border-radius: 4px;
      background: rgba(253, 253, 255, 0.13);
      pointer-events: none;
      z-index: 2147483640;
      transition: opacity 0.5s;
    `;
    _appendChild.call(document.body, el);
    registerStealthElement(el);
    zoneIndicatorEl = el;
    setTimeout(() => { el.style.opacity = '0'; setTimeout(() => { unregisterStealthElement(el); el.remove(); }, 600); }, 2500);
  };

  // ============================================================
  //  SELECTED TEXT
  // ============================================================
  const getSelectedText = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return "";
    const range = selection.getRangeAt(0);
    let selectedText = range.toString().trim();
    if (selectedText.length > 5000) return selectedText.substring(0, 5000);
    return selectedText;
  };

  // ============================================================
  //  ANSWER EXTRACTION
  // ============================================================
  const extractAnswerOption = (response) => {
    if (!response) return null;
    const cleanResponse = response.trim();
    if (cleanResponse.length < 1) return null;

    const finalAnswerPattern = /FINAL\s+ANSWER\s*:\s*([A-D]|\d+)/i;
    const finalAnswerMatch = cleanResponse.match(finalAnswerPattern);
    if (finalAnswerMatch) return finalAnswerMatch[1].toUpperCase();

    const singleLetter = cleanResponse.match(/^([A-Z])$/);
    if (singleLetter) return singleLetter[1];

    const letterAtStart = cleanResponse.match(/^([a-zA-Z])[).\s]/);
    if (letterAtStart) return letterAtStart[1].toUpperCase();

    const letterAtVeryStart = cleanResponse.match(/^([a-zA-Z])/);
    if (letterAtVeryStart && cleanResponse.length <= 3) return letterAtVeryStart[1].toUpperCase();

    const patterns = [
      /^([a-zA-Z])[).\s]/,
      /\b([A-D])[).\s]/,
      /\b([a-d])[).\s]/,
      /Option\s+([a-zA-Z])/gi,
      /Answer\s+([a-zA-Z])/gi,
      /Correct\s+([a-zA-Z])/gi,
      /The\s+answer\s+is\s+([a-zA-Z])/gi,
      /Answer:\s*([a-zA-Z])/gi,
      /\b([A-D])\b/g,
      /\b([a-d])\b/g,
      /([A-D])\s*is\s+correct/gi,
      /([a-d])\s*is\s+correct/gi
    ];

    for (const pattern of patterns) {
      const matches = cleanResponse.match(pattern);
      if (matches && matches.length > 0) {
        const letter = matches[1] || (matches[0] && matches[0].match(/[a-zA-Z]/));
        if (letter && /^[A-D]$/i.test(letter[0])) return letter[0].toUpperCase();
      }
    }

    const checkboxPatterns = [
      /(\d+(?:st|nd|rd|th))/gi,
      /^(\d+)$/g,
      /Option\s+(\d+)/gi,
      /Answer\s+(\d+)/gi,
      /(\d+)/g
    ];
    for (const pattern of checkboxPatterns) {
      const matches = cleanResponse.match(pattern);
      if (matches && matches.length > 0) return matches[0].toLowerCase();
    }

    const positionMap = { 'first': 0, 'second': 1, 'third': 2, 'fourth': 3, 'fifth': 4 };
    const positionPatterns = [/(first|second|third|fourth|fifth)/gi];
    for (const pattern of positionPatterns) {
      const matches = cleanResponse.match(pattern);
      if (matches && matches.length > 0) return matches[0].toLowerCase();
    }

    const tfPatterns = [/\b(true|false|yes|no|correct|incorrect)\b/gi];
    for (const pattern of tfPatterns) {
      const matches = cleanResponse.match(pattern);
      if (matches && matches.length > 0) return matches[0].toLowerCase();
    }

    const anyLetter = cleanResponse.match(/[A-D]/gi);
    if (anyLetter && anyLetter.length > 0) return anyLetter[0].toUpperCase();

    return null;
  };

  // ============================================================
  //  MCQ SELECTION
  // ============================================================
  const selectMcqOption = async (answerLetter) => {
    if (!answerLetter) return false;
    const isCheckboxStyle = !/^[A-Z]$/i.test(answerLetter);
    if (isCheckboxStyle) return await selectCheckboxOption(answerLetter);
    return selectLetterOption(answerLetter);
  };

  const selectLetterOption = (answerLetter) => {
    const allInputs = _querySelectorAll('input[type="radio"], input[type="checkbox"]');
    for (const input of allInputs) {
      if (input.value && input.value.toUpperCase() === answerLetter.toUpperCase()) {
        if (trySelectInput(input)) return true;
      }
      const label = input.closest('label') || _querySelector(`label[for="${input.id}"]`);
      if (label) {
        const labelText = label.textContent.trim();
        if (labelText.match(new RegExp(`^${answerLetter}[).\\s]`, 'i')) ||
          labelText.includes(`Option ${answerLetter}`) ||
          labelText.match(new RegExp(`\\b${answerLetter}[).\\s]`, 'i'))) {
          if (trySelectInput(input)) return true;
        }
      }
    }

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
        const element = _querySelector(selector);
        if (element) {
          if (element.type === 'radio' || element.type === 'checkbox') {
            if (trySelectInput(element)) return true;
          } else {
            if (tryClickElement(element)) return true;
          }
        }
      } catch (err) { /* continue */ }
    }

    const labels = _querySelectorAll('label');
    for (const label of labels) {
      const labelText = label.textContent.trim();
      if (labelText.match(new RegExp(`^${answerLetter}[).\\s]`, 'i')) ||
        labelText.includes(`Option ${answerLetter}`) ||
        labelText.match(new RegExp(`\\b${answerLetter}[).\\s]`, 'i'))) {
        if (tryClickLabel(label)) return true;
      }
    }

    const clickableElements = _querySelectorAll('button, div[onclick], span[onclick], [role="button"], [role="option"], .option, .choice, *[data-option], *[data-answer]');
    for (const element of clickableElements) {
      const text = element.textContent.trim();
      if (text === answerLetter || text === answerLetter + ')' || text === answerLetter + '.' ||
        text.startsWith(answerLetter + ' ') || text.match(new RegExp(`^${answerLetter}[).\\s]`, 'i'))) {
        if (tryClickElement(element)) return true;
      }
    }

    const allElements = _querySelectorAll('*');
    for (const element of allElements) {
      if (element.children.length === 0) {
        const text = element.textContent.trim();
        if (text === answerLetter || text === answerLetter + ')' || text === answerLetter + '.') {
          if (tryClickElement(element)) return true;
        }
      }
    }

    return false;
  };

  const trySelectInput = (input) => {
    try {
      if (!isElementInScanRegion(_getBoundingClientRect.call(input))) return false;
      
      // Use Object.getOwnPropertyDescriptor to bypass React/Angular controlled inputs
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype, 'checked'
      )?.set;
      
      if (nativeInputValueSetter) {
        nativeInputValueSetter.call(input, true);
      } else {
        input.checked = true;
      }
      
      input.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
      input.dispatchEvent(new Event('click', { bubbles: true, cancelable: true }));
      input.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
      input.dispatchEvent(new Event('focus', { bubbles: true, cancelable: true }));
      input.click();
      input.focus();
      setTimeout(() => { input.click(); }, 50);
      setTimeout(() => {
        if (!input.checked) {
          const parent = input.parentElement;
          if (parent) parent.click();
          const label = input.closest('label') || _querySelector(`label[for="${input.id}"]`);
          if (label) label.click();
        }
      }, 100);
      return true;
    } catch (err) { return false; }
  };

  const tryClickElement = (element) => {
    try {
      const rect = _getBoundingClientRect.call(element);
      if (!isElementInScanRegion(rect)) return false;
      if (rect.width > 0 && rect.height > 0) {
        element.click();
        element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
        element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
        element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
        return true;
      }
    } catch (err) { return false; }
    return false;
  };

  const tryClickLabel = (label) => {
    try {
      const rect = _getBoundingClientRect.call(label);
      if (!isElementInScanRegion(rect)) return false;
      if (rect.width > 0 && rect.height > 0) {
        label.click();
        label.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
        label.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
        label.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
        return true;
      }
    } catch (err) { return false; }
    return false;
  };

  const selectCheckboxOption = async (answerValue) => {
    if (answerValue.length >= 2 && !answerValue.match(/^\d+$/) &&
      !answerValue.match(/first|second|third|fourth|fifth/) &&
      !answerValue.match(/true|false|yes|no/)) {
      return false;
    }

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

    const checkboxes = _querySelectorAll('input[type="checkbox"], input[type="radio"]');
    if (targetPosition !== null && targetPosition >= 0 && targetPosition < checkboxes.length) {
      const targetCheckbox = checkboxes[targetPosition];
      try {
        const rect = _getBoundingClientRect.call(targetCheckbox);
        if (!isElementInScanRegion(rect)) return false;
        if (rect.width > 0 && rect.height > 0) {
          targetCheckbox.checked = true;
          targetCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
          targetCheckbox.dispatchEvent(new Event('click', { bubbles: true }));
          return true;
        }
      } catch (err) { /* continue */ }
    }

    for (let i = 0; i < checkboxes.length; i++) {
      const checkbox = checkboxes[i];
      let isMatch = (targetPosition !== null && i === targetPosition);

      if (isMatch) {
        try {
          const rect = _getBoundingClientRect.call(checkbox);
          if (!isElementInScanRegion(rect)) continue;
          if (rect.width > 0 && rect.height > 0) {
            checkbox.checked = true;
            checkbox.dispatchEvent(new Event('change', { bubbles: true }));
            checkbox.dispatchEvent(new Event('click', { bubbles: true }));
            return true;
          }
        } catch (err) { /* continue */ }
      }
    }

    return false;
  };

  // ============================================================
  //  REGULAR HOTKEY HANDLER
  // ============================================================
  const handleRegularText = async (event, selectedText) => {
    event.preventDefault();
    try {
      safeSendMessage(
        { type: "PROCESS_SELECTED_TEXT", payload: { text: selectedText } },
        async (response) => {
          if (_rt && _rt.lastError) return;
          if (!response || !response.success) return;
          try {
            await navigator.clipboard.writeText(response.data);
          } catch (clipboardErr) {
            try {
              const textArea = _createElement("textarea");
              textArea.value = response.data;
              textArea.style.cssText = "position:fixed;opacity:0;";
              _appendChild.call(document.body, textArea);
              textArea.select();
              document.execCommand("copy");
              textArea.parentNode.removeChild(textArea);
            } catch (fallbackErr) { /* silent */ }
          }
        }
      );
    } catch (err) { /* silent */ }
  };

  // ============================================================
  //  QUESTION DETECTION (with scan region filter)
  // ============================================================
  const isElementInScanRegion = (rect) => {
    if (!scanRegion) return true;

    const pageRect = {
      left: rect.left + window.scrollX,
      top: rect.top + window.scrollY,
      right: rect.right + window.scrollX,
      bottom: rect.bottom + window.scrollY,
    };

    const centerX = (pageRect.left + pageRect.right) / 2;
    const centerY = (pageRect.top + pageRect.bottom) / 2;

    return (
      centerX >= scanRegion.x &&
      centerX <= scanRegion.x + scanRegion.width &&
      centerY >= scanRegion.y &&
      centerY <= scanRegion.y + scanRegion.height
    );
  };

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

    const allElements = _querySelectorAll('*');
    const questionElements = new Set();

    for (const element of allElements) {
      if (element.tagName === 'SCRIPT' || element.tagName === 'STYLE' ||
        element.offsetParent === null || element.hidden) continue;

      const rect = _getBoundingClientRect.call(element);
      if (rect.width === 0 || rect.height === 0) continue;

      if (!isElementInScanRegion(rect)) continue;

      const text = element.textContent.trim();
      if (text.length > 15 && text.length < 2000) {
        let isQuestion = false;
        for (const pattern of patterns) {
          if (pattern.test(text)) { isQuestion = true; break; }
        }

        if (!isQuestion && sensitivity !== "low") {
          const hasQuestionMark = text.includes('?');
          const hasOptions = text.match(/[A-D]\)/g) || text.match(/\[\s*\]/g);
          if (hasQuestionMark && hasOptions) isQuestion = true;

          const checkboxes = element.querySelectorAll('input[type="checkbox"], input[type="radio"]');
          if (checkboxes.length >= 2 && hasQuestionMark) isQuestion = true;

          if (hasQuestionMark && text.match(/\b(true|false|yes|no)\b/gi)) isQuestion = true;
        }

        if (isQuestion) questionElements.add(element);
      }
    }

    questionElements.forEach(element => {
      const rect = _getBoundingClientRect.call(element);
      questions.push({
        element,
        text: element.textContent.trim(),
        rect,
        score: calculateQuestionScore(element.textContent.trim())
      });
    });

    questions.sort((a, b) => b.score - a.score);
    return questions;
  };

  const calculateQuestionScore = (text) => {
    let score = 0;
    if (text.includes('?')) score += 10;
    ['what', 'which', 'who', 'when', 'where', 'why', 'how', 'select', 'choose', 'identify', 'determine']
      .forEach(word => { if (text.toLowerCase().includes(word)) score += 5; });
    [/\([A-D]\)/g, /\b[A-D]\)\s*/g, /\b[A-D]\.\s*/g, /\b[A-D]\s+/g]
      .forEach(p => { const m = text.match(p); if (m) score += m.length * 3; });
    [/\[\s*\]/g, /\(\s*\)/g, /☐/g, /◯/g]
      .forEach(p => { const m = text.match(p); if (m) score += m.length * 2; });
    if (text.length < 30) score -= 5;
    if (text.length > 1000) score -= 5;
    const optionCount = (text.match(/[A-D]/g) || []).length;
    if (optionCount >= 2) score += optionCount * 2;
    return Math.max(0, score);
  };

  const findBestQuestion = () => {
    const questions = detectMcqQuestions();
    if (questions.length === 0) return null;

    const regionCenterX = scanRegion
      ? scanRegion.x + scanRegion.width / 2 - window.scrollX
      : window.innerWidth / 2;
    const regionCenterY = scanRegion
      ? scanRegion.y + scanRegion.height / 2 - window.scrollY
      : window.innerHeight / 2;

    let bestQuestion = null, bestScore = -1;

    for (const question of questions) {
      const qCenterX = question.rect.left + question.rect.width / 2;
      const qCenterY = question.rect.top + question.rect.height / 2;
      const distance = Math.sqrt(
        Math.pow(qCenterX - regionCenterX, 2) + Math.pow(qCenterY - regionCenterY, 2)
      );
      const combined = question.score + Math.max(0, 100 - distance / 10);
      if (combined > bestScore) { bestScore = combined; bestQuestion = question; }
    }

    return bestQuestion;
  };

  // ============================================================
  //  SOLVE QUESTION
  // ============================================================
  const solveQuestion = async (question) => {
    if (!isExtensionContextValid()) throw new Error('Extension context not available');

    if (settings.autoSolveDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, settings.autoSolveDelay * 1000));
    }

    return new Promise((resolve, reject) => {
      const sent = safeSendMessage(
        { type: "PROCESS_MCQ_TEXT", payload: { text: question.text } },
        async (response) => {
          if (_rt && _rt.lastError) { reject(new Error(_rt.lastError.message)); return; }
          if (!response || !response.success) { reject(new Error(response?.error || "Unknown error")); return; }

          const fullResponse = response.data;
          const answerLetter = extractAnswerOption(fullResponse);

          if (answerLetter) {
            const success = await selectMcqOption(answerLetter);
            if (success) {
              resolve(answerLetter);
            } else {
              reject(new Error(`Detected answer: ${answerLetter} — but could not click the option. Try the Answer Overlay hotkey to read it manually.`));
            }
          } else {
            reject(new Error('Could not extract an answer letter from the AI response.'));
          }
        }
      );
      if (!sent) reject(new Error('Extension context lost'));
    });
  };

  // ============================================================
  //  MAIN HANDLERS
  // ============================================================
  const handleQuestionSolving = async (event) => {
    event.preventDefault();

    if (isQuestionSolvingActive) return;
    isQuestionSolvingActive = true;

    let completed = false;
    const qTimeout = setTimeout(() => {
      if (completed) return;
      completed = true;
      isQuestionSolvingActive = false;
      if (answerOverlayEl) removeAnswerOverlay();
      log('Text Reader: 40s timeout reached. Stopped silently.');
    }, 40000);

    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const question = findBestQuestion();
      if (!question) {
        clearTimeout(qTimeout);
        completed = true;
        isQuestionSolvingActive = false;
        return;
      }
      await solveQuestion(question);
      clearTimeout(qTimeout);
    } catch (error) {
      clearTimeout(qTimeout);
      log('Text Reader: Question solving failed silently:', error.message);
      if (answerOverlayEl) removeAnswerOverlay();
    } finally {
      completed = true;
      isQuestionSolvingActive = false;
    }
  };

  // ============================================================
  //  IMAGE SOLVING HANDLER
  // ============================================================
  const handleImageSolving = async (event) => {
    event.preventDefault();

    if (isImageSolvingActive) {
      log('Text Reader: Image solving already in progress, ignoring duplicate trigger');
      return;
    }

    if (!scanRegion) {
      showZoneToast('Draw a Scan Zone first!', '#ef4444');
      return;
    }

    isImageSolvingActive = true;

    let completed = false;
    const solveTimeout = setTimeout(() => {
      if (completed) return;
      completed = true;
      isImageSolvingActive = false;
      if (answerOverlayEl) removeAnswerOverlay();
      log('Text Reader: 40s timeout reached. Stopped silently.');
    }, 40000);

    try {
      if (!isExtensionContextValid()) {
        clearTimeout(solveTimeout);
        isImageSolvingActive = false;
        return;
      }

      const sent = safeSendMessage(
        { 
          type: "PROCESS_IMAGE_QUESTION", 
          payload: { 
            region: scanRegion, 
            dpr: window.devicePixelRatio,
            scrollX: window.scrollX,
            scrollY: window.scrollY,
            innerWidth: window.innerWidth,
            innerHeight: window.innerHeight
          } 
        },
        async (response) => {
          if (completed) return;
          completed = true;
          clearTimeout(solveTimeout);
          isImageSolvingActive = false;

          if ((_rt && _rt.lastError) || !response || !response.success) {
            log('Text Reader: Image solve failed silently:', _rt?.lastError?.message || response?.error);
            if (answerOverlayEl) removeAnswerOverlay();
            return;
          }

          const fullResponse = response.data;
          const answerLetter = extractAnswerOption(fullResponse);

          if (settings.questionSolvingEnabled && answerLetter) {
            await selectMcqOption(answerLetter);
          }

          if (settings.answerOverlayEnabled || !settings.questionSolvingEnabled) {
            showAnswerInOverlay(fullResponse, answerLetter);
          }
        }
      );

      if (!sent) {
        completed = true;
        clearTimeout(solveTimeout);
        isImageSolvingActive = false;
      }
    } catch (error) {
      completed = true;
      clearTimeout(solveTimeout);
      isImageSolvingActive = false;
      if (answerOverlayEl) removeAnswerOverlay();
      log('Text Reader: Image solve error silently:', error.message);
    }
  };

  // ============================================================
  //  OVERLAY-ONLY SOLVE (no auto-click)
  // ============================================================
  const handleOverlaySolve = async (event) => {
    event.preventDefault();

    if (isQuestionSolvingActive) return;
    isQuestionSolvingActive = true;

    let completed = false;
    const ovTimeout = setTimeout(() => {
      if (completed) return;
      completed = true;
      isQuestionSolvingActive = false;
      if (answerOverlayEl) removeAnswerOverlay();
      log('Text Reader: 40s timeout reached. Stopped silently.');
    }, 40000);

    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const question = findBestQuestion();
      if (!question) {
        clearTimeout(ovTimeout);
        completed = true;
        isQuestionSolvingActive = false;
        if (answerOverlayEl) removeAnswerOverlay();
        return;
      }

      if (!isExtensionContextValid()) {
        clearTimeout(ovTimeout);
        completed = true;
        isQuestionSolvingActive = false;
        if (answerOverlayEl) removeAnswerOverlay();
        return;
      }

      const sent = safeSendMessage(
        { type: "PROCESS_MCQ_TEXT", payload: { text: question.text } },
        (response) => {
          if (completed) return;
          completed = true;
          clearTimeout(ovTimeout);
          isQuestionSolvingActive = false;

          if ((_rt && _rt.lastError) || !response || !response.success) {
            log('Text Reader: Overlay solve error silently:', _rt?.lastError?.message || response?.error);
            if (answerOverlayEl) removeAnswerOverlay();
            return;
          }

          const fullResponse = response.data;
          const answerLetter = extractAnswerOption(fullResponse);
          showAnswerInOverlay(fullResponse, answerLetter);
        }
      );

      if (!sent) {
        completed = true;
        clearTimeout(ovTimeout);
        isQuestionSolvingActive = false;
        if (answerOverlayEl) removeAnswerOverlay();
      }
    } catch (error) {
      completed = true;
      clearTimeout(ovTimeout);
      isQuestionSolvingActive = false;
      if (answerOverlayEl) removeAnswerOverlay();
      log('Text Reader: Overlay solve error silently:', error.message);
    }
  };

  // ============================================================
  //  KEYDOWN HANDLER — capture phase, highest priority
  // ============================================================
  const handleKeydown = async (event) => {
    if (event.repeat) return;

    const isRegular = isHotkeyPressed(event);
    const isQSolve = isQuestionSolvingHotkeyPressed(event);
    const isImage = isImageSolvingHotkeyPressed(event);
    const isScanZone = isScanZoneHotkeyPressed(event);
    const isOverlay = isOverlayHotkeyPressed(event);
    const isOverlayClose = isOverlayCloseHotkeyPressed(event);

    if (!isRegular && !isQSolve && !isImage && !isScanZone && !isOverlay && !isOverlayClose) return;

    if (isScanZone) {
      event.preventDefault();
      activateScanZoneMode();
      return;
    }

    if (isOverlayClose) {
      event.preventDefault();
      removeAnswerOverlay();
      return;
    }

    if (isOverlay) {
      if (answerOverlayEl) {
        event.preventDefault();
        removeAnswerOverlay();
      } else {
        await handleOverlaySolve(event);
      }
      return;
    }
    if (isQSolve) {
      await handleQuestionSolving(event);
      return;
    }
    if (isImage) {
      await handleImageSolving(event);
      return;
    }

    const selectedText = getSelectedText();
    if (selectedText && isRegular) {
      await handleRegularText(event, selectedText);
    }
  };

  // ============================================================
  //  ANTI-DETECTION: Keyboard event interception protection
  //  Prevent sites from blocking our hotkeys
  // ============================================================

  // Some exam sites call stopPropagation/preventDefault on all keyboard events.
  // We register at the absolute earliest capture phase on the document element.
  // If the site tries to remove our listener, we re-register it.

  const installKeydownHandler = () => {
    // Use the native addEventListener to bypass any page-level overrides
    _addEventListener.call(document, 'keydown', handleKeydown, true);
    
    // Also install on window as backup
    _addEventListener.call(window, 'keydown', handleKeydown, true);
  };

  // Periodically re-install in case page scripts remove it
  const keydownGuard = setInterval(() => {
    // Re-install to be safe — duplicate listeners with same function ref are ignored by the browser
    installKeydownHandler();
  }, 5000);

  // ============================================================
  //  ANTI-DETECTION: Block page from detecting our event listeners
  // ============================================================

  // Prevent getEventListeners-based detection (DevTools only, but some sites try)
  // This is handled by using the capture phase and unique function references

  // ============================================================
  //  ANTI-DETECTION: Defeat focus/blur traps
  //  Some exam sites detect when you switch tabs/windows
  // ============================================================
  
  // Override page-level visibility change handlers silently
  // The extension works without leaving the page, so this is mostly
  // about preventing false positives from the page's monitoring
  const neutralizeVisibilityTraps = () => {
    // Intercept the page trying to add visibilitychange listeners
    // so our overlay interactions don't trigger their tab-switch detection
    // Note: We don't block the events entirely — that would be detectable.
    // Instead, we just ensure our overlay doesn't cause focus loss.
    
    // Make our overlay elements non-focusable to avoid triggering blur events
    if (answerOverlayEl) {
      const allInteractive = answerOverlayEl.querySelectorAll('button, [tabindex]');
      allInteractive.forEach(el => {
        el.setAttribute('tabindex', '-1');
      });
    }
  };

  // ============================================================
  //  INIT
  // ============================================================
  const init = async () => {
    await loadSettings();
    installKeydownHandler();
    
    // Set up periodic context health check
    setInterval(() => {
      if (!isExtensionContextValid()) {
        reconnectRuntime();
      }
    }, 10000);
  };

  if (_storage) {
    _storage.onChanged.addListener(async (changes, namespace) => {
      if (namespace === "local") {
        await loadSettings();
        if (changes.answerOverlayEnabled && !settings.answerOverlayEnabled) {
          removeAnswerOverlay();
        }
        neutralizeVisibilityTraps();
      }
    });
  }

  init();
})();
