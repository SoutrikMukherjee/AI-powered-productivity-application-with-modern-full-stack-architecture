# AI-Powered Productivity Application with Modern Full-Stack Architecture 🚀

> ⚡ Supercharge your workflow with intelligent planning, prioritization, and tracking — powered by AI and built with production-grade full-stack technologies.

## 🔥 Why This Project Matters

**87% of hiring managers in 2025 list AI experience as valuable.**  
Python is the most-used language on GitHub.  
PostgreSQL has overtaken MySQL as the #1 database.  
This project checks all those boxes — and more.

---

## 🧠 Core AI Features

- **🧩 Task Breakdown from Goals:** Describe a goal, and AI suggests structured subtasks.
- **⚖️ Smart Prioritization:** Tasks are auto-sorted based on deadlines, dependencies & effort.
- **⏱ Time Estimation:** AI analyzes similar past tasks to estimate durations.
- **💬 Natural Language Interface:** Ask things like  
  _"What should I work on next?"_  
  _"Am I on track for June goals?"_

Built using OpenAI's GPT models (or self-hosted Ollama as an open-source option).

---

## 🛠 Tech Stack

| Layer            | Tech Used                                                                 |
|------------------|---------------------------------------------------------------------------|
| Frontend         | React + Next.js + TypeScript                                              |
| Backend          | Python + FastAPI + AI API (OpenAI or Ollama)                             |
| Database         | PostgreSQL (via Supabase or Railway DB)                                  |
| Authentication   | NextAuth.js                                                               |
| Deployment       | Frontend → Vercel<br>Backend → Railway or Google Cloud Run               |
| Environment      | `.env.example` included for easy setup                                    |

---

## 📂 Folder Structure

```bash
📁 Frontend
├── lib/                # API handlers
├── components/         # Reusable React components
├── pages/              # Next.js pages (e.g., signup.tsx)

📁 Backend
├── main.py             # FastAPI backend entrypoint
├── requirements.txt    # Python dependencies

📄 package.json          # Frontend dependencies
📄 .env.example          # Environment variable template
📄 README.md             # This file
