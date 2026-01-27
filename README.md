# Lumora AI Workspace

> A sophisticated cognitive interface for the modern professional. Built by **Pranata** & **LumoraLabs**.

[![Next.js](https://img.shields.io/badge/Next.js-15.0-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-38bdf8?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

**Lumora AI Workspace** is an elegant, desktop-first environment designed to streamline human-AI collaboration. It moves beyond the limitations of standard chat interfaces, offering a high-density, distraction-free workspace tailored for deep work, research, and creative brainstorming.

---

## 🎨 Design Philosophy

We believe that professional tools should be quiet, yet powerful. The workspace is built on a custom design system that prioritizes long-form productivity:

- **Calmed Palette**: Utilizing "Bone White" for light mode and "Soft Dark" for dark mode to reduce ocular strain.
- **Subtle Precision**: Standardized ultra-dark borders (`zinc-900`) that provide structure without visual noise.
- **Glassmorphism**: Subtle backdrop blurs and transitions that create a sense of depth and focus.

---

## 🧠 Core Intelligence

The workspace is powered by modern LLMs and adaptive cognition modes:

- **Adaptive Personality Modes**: Switching between **Mentor**, **Peer**, **Strict**, and **Creative** states to align the AI's output with your specific task.
- **Multi-Model Support**: Seamlessly toggle between industry-leading models including Llama 3.3, Gemini 2.0 Flash, Qwen 2.5, and Mistral.
- **Stateless Privacy**: Built with a "stateless" philosophy—your conversation history is transient, ensuring maximum privacy for sensitive work.

---

## ✨ Key Features

- **Desktop-First Architecture**: Optimized for wide screens with a 3-column layout (Navigation, Chat, Context).
- **Multimodal Input**: Support for text drafting, **Speech-to-Text** (Voice Input), and direct file uploads (`.txt`, `.md`).
- **Interactive Branding**: Subtle "Built by LumoraLabs" identity that reflects a commitment to quality engineering.
- **Bilingual Interface**: Native support for English (US) and Bahasa Indonesia (ID) with an instant language toggle.

---

## 🛠️ Technical Implementation

Built with a modern, type-safe stack:

- **Core**: Next.js 15 (App Router) & React 19
- **Style**: Tailwind CSS v4 (Class-based theming)
- **Icons**: Lucide React
- **Integration**: OpenRouter API for intelligent model routing
- **Theme**: `next-themes` with hydration-safe context

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- An API Key from [OpenRouter](https://openrouter.ai/)

### Setup

1. **Clone & Install**
   ```bash
   git clone https://github.com/pranata-dev/ai-assistant.git
   cd ai-assistant
   npm install
   ```

2. **Environment Configuration**
   Create a `.env.local` file:
   ```env
   OPENROUTER_API_KEY=your_key_here
   ```

3. **Development**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to enter the workspace.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

*Crafted with passion by **Pranata** & **LumoraLabs**.*
