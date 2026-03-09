# ⚖️ RAG Legal Assistant

A modern Retrieval-Augmented Generation (RAG) platform designed to provide intelligent legal assistance. Built with a high-performance monorepo architecture.

---

## 🛠️ Tech Stack

| Layer                   | Technology                                                                                                  |
| ----------------------- | ----------------------------------------------------------------------------------------------------------- |
| **Frontend**            | [React](https://reactjs.org/) + [Vite](https://vitejs.dev/) + [TypeScript](https://www.typescriptlang.org/) |
| **Backend**             | [Django](https://www.djangoproject.com/) + [uv](https://github.com/astral-sh/uv)                            |
| **Monorepo Management** | [Turborepo](https://turbo.build/) + [pnpm](https://pnpm.io/)                                                |
| **AI/RAG**              | LangChain / Vector Database (Configurable)                                                                  |

---

## 📂 Project Structure

```text
.
├── apps/
│   ├── web/          # React frontend (Vite)
│   └── backend/      # Django backend (Python/uv)
├── packages/         # Shared configurations and utilities
├── turbo.json        # Turborepo configuration
└── package.json      # Workspace root dependencies
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (Recommended: >= 18)
- [pnpm](https://pnpm.io/installation)
- [uv](https://github.com/astral-sh/uv) (for Python package management)

### Installation

1. **Clone the repository:**

   ```bash
   git clone <repository-url>
   cd RAG-legal-assitant
   ```

2. **Install dependencies:**

   ```bash
   pnpm install
   ```

3. **Setup the Backend:**
   ```bash
   cd apps/backend
   uv sync
   uv run python manage.py migrate
   cd ../..
   ```

### Development

Run both the frontend and backend simultaneously using Turbo:

```bash
pnpm dev
```

- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:8000](http://localhost:8000)

---

## 📝 Scripts

- `pnpm dev` - Start all apps in development mode.
- `pnpm build` - Build all apps for production.
- `pnpm lint` - Run linting across the workspace.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📄 License

This project is licensed under the MIT License.
