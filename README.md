# Lumora AI Workspace

> A sophisticated cognitive interface for the modern professional. Built by **Pranata** & **LumoraLabs**.

[![Next.js](https://img.shields.io/badge/Next.js-15.0-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-38bdf8?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

**Lumora AI Workspace** is an elegant, desktop-first environment designed to streamline human-AI collaboration. It supports multi-channel communication through **Web** and **WhatsApp**, powered by GLM 4.5 Air as the primary LLM.

---

## ⚠️ Important Disclaimer

> **WhatsApp Integration**: This project uses WhatsApp Web automation via Evolution API and is **NOT affiliated with Meta or WhatsApp**. This integration is for **internal use, experimentation, and portfolio demonstration ONLY**. Do not use for production or commercial purposes.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                    User Interface                   │
├──────────────────────┬──────────────────────────────┤
│     WebChannel       │      WhatsAppChannel         │
│   (Next.js Web UI)   │   (Evolution API + Webhook)  │
└──────────┬───────────┴──────────────┬───────────────┘
           │                          │
           ▼                          ▼
┌─────────────────────────────────────────────────────┐
│              MessageNormalizer                      │
│         Unified format for all channels             │
└─────────────────────────┬───────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│               AssistantCore                         │
│   Intent detection, reasoning, task logic           │
└─────────────────────────┬───────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│               LLMService                            │
│         GLM 4.5 Air (Primary)                       │
└─────────────────────────┬───────────────────────────┘
                          │ (on failure)
                          ▼
┌─────────────────────────────────────────────────────┐
│             FallbackService                         │
│    Llama 3.3 → Llama 3.2 → Gemma 3                 │
│         + Logging every fallback                    │
└─────────────────────────────────────────────────────┘
```

### Core Modules

| Module | Description |
|--------|-------------|
| `AssistantCore` | Channel-agnostic reasoning and intent handling |
| `LLMService` | GLM 4.5 Air integration with timeout handling |
| `FallbackService` | Automatic fallback with comprehensive logging |
| `MessageNormalizer` | Unified input format for Web & WhatsApp |
| `WhatsAppChannel` | Evolution API integration for WhatsApp |
| `Logger` | Centralized logging for all AI interactions |

---

## 🧠 LLM Configuration

| Role | Model | Notes |
|------|-------|-------|
| **Primary** | GLM 4.5 Air | Single-core inference, optimized for assistant tasks |
| Fallback #1 | Llama 3.3 70B | Used on timeout, rate limit, or error |
| Fallback #2 | Llama 3.2 3B | Lightweight alternative |
| Fallback #3 | Gemma 3 4B | Last resort |

All fallback events are logged with reason and context.

---

## 🎨 Design Philosophy

- **Calmed Palette**: "Bone White" for light mode, "Soft Dark" for dark mode
- **Subtle Precision**: Ultra-dark borders (`zinc-900`) for structure without noise
- **Glassmorphism**: Subtle backdrop blurs for depth and focus

---

## ✨ Key Features

- **Multi-Channel Support**: Web interface + WhatsApp (via Evolution API)
- **Adaptive Personality Modes**: Mentor, Peer, Strict, Creative
- **Speech-to-Text**: Voice input support
- **Bilingual Interface**: English (US) and Bahasa Indonesia (ID)
- **Self-Verification**: AI validates responses before delivering

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- [OpenRouter API Key](https://openrouter.ai/)
- [Evolution API](https://github.com/EvolutionAPI/evolution-api) (for WhatsApp)

### Setup

1. **Clone & Install**
   ```bash
   git clone https://github.com/pranata-dev/ai-assistant.git
   cd ai-assistant
   npm install
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local`:
   ```env
   # OpenRouter
   OPENROUTER_API_KEY=your_key_here
   
   # WhatsApp (Evolution API)
   EVOLUTION_API_URL=http://localhost:8080
   EVOLUTION_API_KEY=your_evolution_key_here
   EVOLUTION_INSTANCE=ai-assistant
   ```

3. **Development**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000)

### WhatsApp Setup

1. Start Evolution API (Docker recommended)
2. Open the app and select "Use on WhatsApp"
3. Scan the QR code with your phone
4. Configure webhook URL in Evolution API:
   ```
   POST http://your-domain/api/whatsapp/webhook
   ```

---

## 🔒 Known Limitations

1. **WhatsApp Non-Official**: Uses WhatsApp Web automation. Not endorsed by Meta.
2. **Evolution API Required**: External dependency must be running for WhatsApp.
3. **Free Model Limits**: 50 requests/day on OpenRouter free tier.
4. **No Persistent Storage**: Session context is ephemeral (30-minute TTL).
5. **Rate Limits**: Automatic fallback on rate limit, but may affect response time.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

*Crafted with passion by **Pranata** & **LumoraLabs**.*
