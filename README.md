# AI Personal Assistant

A local-first, microservices-based AI agent built with Next.js and Python FastAPI. Designed as a clean separation between a lightweight frontend and an intelligent backend, orchestrated with Docker Compose.

---

## Architecture

This project follows a **decoupled microservices architecture**:

| Layer | Technology | Responsibility |
|---|---|---|
| **Frontend** | Next.js / TypeScript | Chat UI, user preferences, theming |
| **Backend** | Python / FastAPI | AI inference via OpenRouter, conversation handling |
| **Orchestration** | Docker Compose | Service management, networking, environment config |

The frontend communicates with the backend over HTTP. All AI logic is isolated in the Python service, keeping the Next.js layer purely presentational.

```
Browser  -->  Next.js (port 3000)  -->  FastAPI (port 8000)  -->  OpenRouter API
```

---

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS 4
- **Backend**: Python 3.9, FastAPI, OpenAI SDK (via OpenRouter)
- **Infrastructure**: Docker, Docker Compose
- **AI Provider**: OpenRouter (free tier)

---

## Getting Started

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop) installed and running
- An [OpenRouter](https://openrouter.ai/) API key (free tier is sufficient)

### Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-username/ai-personal-assistant.git
   cd ai-personal-assistant
   ```

2. **Configure the backend environment**

   ```bash
   cp backend/.env.example backend/.env
   ```

   Open `backend/.env` and add your OpenRouter API key:

   ```
   OPENROUTER_API_KEY=your_key_here
   ```

3. **Start the services**

   ```bash
   docker compose up --build
   ```

4. **Access the application**

   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Backend API: [http://localhost:8000](http://localhost:8000)

### Stopping the services

```bash
docker compose down
```

---

## Project Structure

```
.
├── docker-compose.yml
├── frontend/
│   ├── Dockerfile
│   ├── src/
│   │   ├── app/            # Next.js pages and layout
│   │   ├── components/     # React components
│   │   ├── lib/            # Utilities (i18n, memory, models)
│   │   └── types/          # TypeScript type definitions
│   └── package.json
├── backend/
│   ├── Dockerfile
│   ├── main.py             # FastAPI application entry point
│   ├── requirements.txt
│   └── .env.example
└── README.md
```

---

## API Reference

### POST /chat

Send a message to the AI assistant.

**Request**

```json
{
  "message": "Hello, how are you?"
}
```

**Response**

```json
{
  "response": "I'm doing well. How can I help you today?"
}
```

---

## License

This project is for personal and educational use.
