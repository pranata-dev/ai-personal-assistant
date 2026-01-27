# AI Personal Assistant 🤖

Asisten AI personal yang fun, smart, dan helpful - bukan chatbot generik!

## Features ✨

- **🔄 Personality Modes**: Mentor, Best Friend, Strict, Chaos
- **💬 Context-Aware Chat**: Remembers conversation history
- **✍️ Prompt Engineering**: Generate structured prompts
- **📝 Smart Notes**: Summarize and organize thoughts
- **🧠 Soft Memory**: Persistent with localStorage

## Tech Stack

- **Next.js 15** + App Router
- **Tailwind CSS v4**
- **OpenRouter API** (free tier available)
- **TypeScript**

## Setup

1. Clone & install:
   ```bash
   npm install
   ```

2. Create `.env.local` with your OpenRouter API key:
   ```
   OPENROUTER_API_KEY=your_api_key_here
   ```
   
   Get free API key at: https://openrouter.ai/keys

3. Run development server:
   ```bash
   npm run dev
   ```

4. Open http://localhost:3000

## Commands

| Command | Description |
|---------|-------------|
| `mode mentor` | Switch to wise mentor mode |
| `mode santai` | Switch to casual friend mode |
| `mode strict` | Switch to no-nonsense mode |
| `chaos mode on` | Switch to chaotic fun mode |
| `bikinin prompt untuk...` | Generate structured prompt |
| `reset memory` | Clear conversation history |
| `help` | Show all available commands |

## Customization

Edit `src/lib/knowledge-base.ts` to personalize:
- User profile & interests
- Skill set
- Projects
- Personality prompts

---

Made with 💜 as a portfolio project
