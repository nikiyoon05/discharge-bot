# 🌐 Translation Feature Setup Guide

## Overview

The discharge bot now includes automatic translation between doctors and patients using LibreTranslate. Messages are automatically translated based on the patient's selected language.

## ✅ What's Implemented

### 🔧 Core Features
- **Automatic Translation**: Doctor messages → Patient's language, Patient messages → English
- **Translation Service**: LibreTranslate integration with fallback support
- **Visual Indicators**: Translation badges, original/translated text toggle
- **Language Selection**: Dropdown in patient header with 12 languages
- **Real-time Chat**: WebSocket integration with translation

### 🎨 UI Components
- **TranslatedMessage**: Enhanced message component with translation display
- **Language Selector**: Flag + name dropdown in patient header
- **Translation Status**: Shows when translation is active/unavailable
- **Show/Hide Original**: Toggle between translated and original text

## 🚀 Setup Options

### Option 1: Local LibreTranslate (Recommended for Development)

1. **Install LibreTranslate locally:**
```bash
pip install libretranslate
```

2. **Start LibreTranslate server:**
```bash
libretranslate --host 0.0.0.0 --port 5000
```

3. **The frontend will automatically connect to `http://localhost:5000`**

### Option 2: Hosted LibreTranslate Service

1. **Get API key from**: https://portal.libretranslate.com/
2. **Create environment file** `frontend/.env`:
```env
REACT_APP_LIBRETRANSLATE_ENDPOINT=https://translate.fedilab.app
REACT_APP_LIBRETRANSLATE_API_KEY=your_api_key_here
```

### Option 3: No Translation Service (Testing)

- **No setup required** - system gracefully falls back to showing original messages
- Translation indicators will show "unavailable" status

## 🔧 Configuration

### Environment Variables (frontend/.env)
```env
# LibreTranslate endpoint (default: http://localhost:5000)
REACT_APP_LIBRETRANSLATE_ENDPOINT=http://localhost:5000

# API key for hosted services (optional for local)
REACT_APP_LIBRETRANSLATE_API_KEY=your_api_key_here
```

### Supported Languages
- 🇺🇸 English (en) - Default doctor language
- 🇪🇸 Spanish (es)
- 🇫🇷 French (fr)
- 🇩🇪 German (de)
- 🇮🇹 Italian (it)
- 🇵🇹 Portuguese (pt)
- 🇷🇺 Russian (ru)
- 🇨🇳 Chinese (zh)
- 🇯🇵 Japanese (ja)
- 🇰🇷 Korean (ko)
- 🇸🇦 Arabic (ar)
- 🇮🇳 Hindi (hi)

## 🎯 How It Works

### Translation Flow
1. **Doctor types message in English** → Translated to patient's language → Sent to patient
2. **Patient types in their language** → Translated to English → Shown to doctor
3. **Both see translation badges** with ability to view original text

### Smart Features
- **No translation needed** when patient language is English
- **Graceful fallback** if translation service is unavailable
- **Visual indicators** show translation status
- **Toggle view** between original and translated text

## 🧪 Testing the Feature

### Test Scenario 1: Spanish Patient
1. **Set patient language** to Spanish (🇪🇸) in header dropdown
2. **Doctor types**: "How are you feeling today?"
3. **Patient receives**: "¿Cómo te sientes hoy?" (with translation badge)
4. **Patient responds**: "Me siento mejor, gracias"
5. **Doctor sees**: "I feel better, thank you" (with translation badge)

### Test Scenario 2: No Translation Service
1. **Stop LibreTranslate** or use invalid endpoint
2. **Warning appears**: "Translation service unavailable"
3. **Messages sent as-is** without translation
4. **No translation badges** shown

## 📁 New Files Created

```
frontend/src/
├── services/translationService.ts      # LibreTranslate integration
├── hooks/useTranslation.ts             # Translation React hook
├── components/chat/TranslatedMessage.tsx # Enhanced message component
├── hooks/usePatientLanguage.ts         # Language management hook
└── examples/LanguageIntegrationExample.tsx # Usage examples
```

## 🔧 Modified Files

```
frontend/src/
├── store/atoms.ts                      # Added language to patient state
├── components/common/PatientHeader.tsx # Added language selector
└── pages/PostDischargeChatPage.tsx     # Integrated translation
```

## 🚨 Troubleshooting

### Translation Not Working?
1. **Check LibreTranslate** is running on port 5000
2. **Verify endpoint** in browser: http://localhost:5000/languages
3. **Check console** for translation service errors
4. **Try different language** - some may not be supported

### LibreTranslate Installation Issues?
```bash
# Alternative installation methods
pip install --upgrade libretranslate
# or
docker run -ti --rm -p 5000:5000 libretranslate/libretranslate
```

### API Key Issues?
- **Hosted service** requires valid API key
- **Local service** doesn't need API key
- **Check quota** if using paid service

## 🎉 Ready to Use!

The translation feature is now fully integrated and ready for testing. Change the patient language in the header dropdown and start chatting to see automatic translation in action!

**Next Steps:**
1. Install LibreTranslate locally or get API key
2. Set patient language to non-English
3. Test doctor-patient chat with translation
4. Try the "show original" toggle feature

The system is designed to work gracefully with or without translation services, so you can start testing immediately! 🚀