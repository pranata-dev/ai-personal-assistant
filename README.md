# Intelligent Personal Workspace

> A desktop-first cognitive interface designed for productivity, built with **Next.js 15** and **Llama 3.3**.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Next.js](https://img.shields.io/badge/Next.js-15.0-black)
![Tailwind](https://img.shields.io/badge/Tailwind-4.0-38bdf8)

This project reimagines the chat interface as a **professional workspace**. Moving away from mobile-first designs, it offers a high-density, 3-column layout optimized for desktop productivity. It integrates context-aware memory, real-time web search (Wikipedia/Web), and adaptive personality modes into a seamless, distraction-free environment.

---

## Key Features

### Desktop-First Architecture
Designed for screens ≥1280px.
- **Three-Column Layout**: Persistent navigation, focused workspace, and always-visible live context.
- **Sticky Productivity Bar**: A "Slack-style" input interface supporting multiline drafting and quick actions.
- **Visual Hierarchy**: Minimalist Zinc/Slate dark theme optimized for long sessions.

### Adaptive Cognition
The system adapts its persona and capabilities based on user intent.
- **Mentor Mode**: Structured, educational guidance for complex topics.
- **Peer Mode**: Collaborative, direct problem-solving.
- **Strict Mode**: High-efficiency, concise technical answers.
- **Creative Mode**: Lateral thinking partner for brainstorming.

### Integrated Intelligence
- **Active Context**: Persists conversation history and user preferences via local storage.
- **Autonomous Search**: Automatically detects when to query external sources (Wikipedia, Web) for real-time fact-checking.
- **Smart Formatting**: Auto-formats code blocks, lists, and markdown for maximum readability.

---

## Technical Stack

Built with a focus on performance, type safety, and modern React patterns.

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS v4, Lucide React (Icons)
- **AI Engine**: OpenRouter API (Llama 3.3 70B Instruct)
- **State Management**: React Hooks + LocalStorage (Soft Persistence)
- **Deployment**: Vercel-ready (Edge Runtime compatible)

---

## Getting Started

### Prerequisites
- Node.js 18+
- An API Key from [OpenRouter](https://openrouter.ai/) (Free tier available)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/pranata-dev/personal-assistant-ai.git
   cd personal-assistant-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   Create a `.env.local` file in the root directory:
   ```env
   OPENROUTER_API_KEY=sk-or-v1-your-key-here
   OPENROUTER_MODEL=meta-llama/llama-3.3-70b-instruct:free
   ```

4. **Launch Development Server**
   ```bash
   npm run dev
   ```
   Access the workspace at `http://localhost:3000`.

---

## Design Philosophy

**"Tools should be quiet."**

Most AI interfaces are cluttered with suggestions and mobile-centric constraints. This project prioritizes:
1. **Density**: Information density appropriate for desktop use.
2. **Clarity**: High contrast, strict typography (Inter), and clear separation of concerns.
3. **Speed**: Keyboard-first interactions and instant intent recognition.

---

## License

This project is open source and available under the [MIT License](LICENSE).

---

*Built by [Pranata](https://github.com/pranata-dev).*
