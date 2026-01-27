# AI Personal Assistant 🤖

A professional, desktop-first AI workspace powered by OpenRouter (Llama 3.3). Built for productivity, not just chat.

## Features ✨

### 🖥️ Desktop Workspace
- **Three-Column Layout**: Sidebar navigation, focused chat area, and context panel.
- **Sticky Input Bar**: Professional, multi-line input inspired by Slack/Linear.
- **Context Panel**: Always-visible memory status and active mode details.

### 🧠 Intelligent Features
- **🌐 Web Search**: Automatically searches Wikipedia & Web for real-time info (e.g., "Who is president?").
- **🔄 Personality Modes**:
  - **Mentor**: Guided learning & advice
  - **Peer**: Casual professional discussion
  - **Strict**: Direct & concise answers
  - **Creative**: Brainstorming partner
- **� Context-Aware**: Remembers conversation history and user profile.

### 🎨 Modern UI
- **Zinc/Slate Theme**: Minimalist dark mode designed for focus.
- **Lucide Icons**: Professional visual language.
- **Clean Typography**: Optimized for readability.

## Tech Stack

- **Next.js 15** (App Router)
- **Tailwind CSS v4**
- **OpenRouter API** (Llama 3.3 70B - Free)
- **TypeScript**

## Setup

1. **Clone & Install**
   ```bash
   npm install
   ```

2. **Environment Setup**
   Create `.env.local` with your OpenRouter key:
   ```env
   OPENROUTER_API_KEY=your_key_here
   OPENROUTER_MODEL=meta-llama/llama-3.3-70b-instruct:free
   ```
   *Get a free key at [openrouter.ai](https://openrouter.ai/)*

3. **Run Dev Server**
   ```bash
   npm run dev
   ```
   Open http://localhost:3000

## Commands

| Command | Description |
|---------|-------------|
| `mode mentor` | Switch to Mentor mode |
| `mode strict` | Switch to Strict mode |
| `reset memory` | Clear conversation context |
| `help` | Show commands |

## Customization

Personalize your assistant in `src/lib/knowledge-base.ts`:
- Update `user` profile (your interests, projects)
- Tweak `personality` prompts

---

Made with 💜 using Next.js & Llama 3.3
