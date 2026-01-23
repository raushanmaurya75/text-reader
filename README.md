# 🧠 Text Learner Chrome Extension

An intelligent Chrome extension that processes selected text using multiple AI providers and automatically answers MCQ questions.

## ✨ Features

### 🤖 Multiple AI Providers
- **Groq** - Fast and efficient AI responses
- **Google Gemini** - Advanced reasoning capabilities  
- **OpenAI** - Powerful GPT models

### ⌨️ Customizable Hotkeys
- **Combination Mode**: Modifier + Key (Alt+Enter, Ctrl+S, etc.)
- **Single Key Mode**: Just one key (F, X, 1, 2, etc.)
- **Separate hotkeys** for regular text processing and MCQ answering

### 📝 MCQ Auto-Answer Selection
- **Smart Detection**: Automatically identifies MCQ questions
- **AI Analysis**: Uses AI to determine correct answers
- **Automatic Selection**: Clicks the correct option automatically
- **Fallback**: Copies answer to clipboard if auto-selection fails

### 🎨 Professional UI
- **Modern Design**: Beautiful gradient backgrounds and card layouts
- **Responsive**: Works on different screen sizes
- **LinkedIn Integration**: Follow developer on LinkedIn

### ⚙️ Advanced Configuration
- **Custom Instructions**: Set specific AI behavior
- **Text Formatting**: Preserve or flatten line breaks
- **Error Handling**: Robust error recovery and logging

## 🚀 Installation

### From Chrome Web Store (Coming Soon)
1. Visit Chrome Web Store
2. Search for "Text Learner"
3. Click "Add to Chrome"

### Manual Installation
1. **Download** this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable **Developer mode** (top right)
4. Click **Load unpacked**
5. Select the extension folder

## 📖 Usage

### Regular Text Processing
1. **Select text** on any webpage
2. Press your **hotkey** (default: Alt+Enter)
3. AI processes the text
4. **Response copied** to clipboard

### MCQ Answer Selection
1. **Enable MCQ feature** in options
2. **Select MCQ question** and options
3. Press **MCQ hotkey** (default: Alt+M)
4. AI analyzes and **auto-selects** correct answer

## ⚙️ Configuration

### API Keys
1. Open extension options
2. Select your preferred AI provider
3. Enter your API key
4. Choose model and save settings

### Hotkey Customization
1. Go to extension options
2. Configure regular text hotkey
3. Configure MCQ hotkey separately
4. Choose combination or single key mode

### MCQ Settings
1. Enable/disable MCQ feature
2. Set custom MCQ instructions
3. Configure MCQ hotkey
4. Test with sample questions

## 🔧 API Setup

### Groq API
1. Visit [Groq Console](https://console.groq.com/)
2. Create account and get API key
3. Copy key to extension settings

### Google Gemini API
1. Visit [Google AI Studio](https://aistudio.google.com/)
2. Create API key
3. Copy key to extension settings

### OpenAI API
1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Create API key
3. Copy key to extension settings

## 🏗️ Development

### File Structure
```
text-learner-chrome-extension/
├── manifest.json          # Extension configuration
├── background.js           # Service worker for API calls
├── content.js             # Content script for webpage interaction
├── options.html           # Settings page UI
├── options.js             # Settings page functionality
├── assets/
│   └── logo (2).png       # Extension icon
└── README.md              # This file
```

### Technologies Used
- **Manifest V3** - Latest Chrome extension standard
- **Vanilla JavaScript** - No external dependencies
- **Chrome APIs** - Storage, clipboard, messaging
- **Modern CSS** - Gradients, animations, responsive design

## 🤝 Contributing

1. Fork this repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Chrome Extension**: [Text Learner](https://github.com/raushanmaurya75/text-learner-chrome-extension)
- **Developer**: [Raushan Maurya](https://www.linkedin.com/in/raushan-maurya1/)
- **Issues**: [GitHub Issues](https://github.com/raushanmaurya75/text-learner-chrome-extension/issues)

## 🙏 Acknowledgments

- Chrome Extension Documentation
- Groq, Gemini, and OpenAI APIs
- Open source community

---

**Made with ❤️ by [Raushan Maurya](https://www.linkedin.com/in/raushan-maurya1/)**
