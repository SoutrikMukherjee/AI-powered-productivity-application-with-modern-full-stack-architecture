# AI-Powered Productivity Application with Modern Full-Stack Architecture 🚀

> ⚡ Supercharge your workflow with intelligent planning, prioritization, and tracking — powered by AI and built with production-grade full-stack technologies.

---

## 🔥 Why This Project Matters

- **87%** of hiring managers in 2025 now list AI experience as valuable.  
- **Python** is the most used language on GitHub thanks to the AI boom.  
- **PostgreSQL** has overtaken MySQL as the most popular database.  
This project brings all these together in one real-world application.

---

## 🧠 AI Features That Impress

- **🎯 Goal-to-Task Breakdown**: Describe a goal, and AI generates actionable subtasks.
- **⚖️ Smart Prioritization**: Sorts tasks based on deadlines, effort, and dependencies.
- **⏱ Time Estimation**: Uses historical task data to predict completion times.
- **💬 Natural Language Interface**: Ask  
  > “What should I work on next?”  
  > “How am I tracking toward my June goals?”  
  and get contextual, intelligent answers.

---

## 🛠 Tech Stack

| Layer            | Technology                                                                |
|------------------|----------------------------------------------------------------------------|
| **Frontend**     | React · Next.js · TypeScript                                               |
| **Backend**      | FastAPI (Python) · OpenAI API / Ollama                                     |
| **Database**     | PostgreSQL (via Supabase or Railway)                                       |
| **Auth**         | NextAuth.js for user authentication                                        |
| **Deployment**   | Frontend → Vercel · Backend → Railway / Google Cloud Run                   |
| **Environment**  | Managed with `.env` and `.env.example`                                     |

---

## 📁 Folder Structure

```bash
.
├── Frontend
│   ├── lib/               # API handling
│   ├── components/        # Reusable React components
│   └── pages/             # Pages like signup.tsx
├── Backend
│   ├── main.py            # FastAPI entrypoint
│   └── requirements.txt   # Python dependencies
├── Environment Variables Template - .env.example
├── Frontend - packages.json
└── README.md
