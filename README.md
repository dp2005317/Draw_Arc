# DrawArc ⚡

**DrawArc** is an AI-powered cloud architecture diagram generator and interactive canvas. Describe any system in plain English (e.g., *"Design an Instagram clone"* or *"Scalable multi-tenant e-commerce backend"*), and DrawArc automatically generates a complete, production-ready microservices architecture with auto-layout, connected data flows, and export capabilities.

![DrawArc Architecture Canvas](public/logo.png)

---

## ✨ Features

- 🤖 **AI-Driven Architecture Generation**: Convert natural language descriptions into 10–20+ node microservices diagrams in seconds using Mistral AI.
- 📐 **Automated Graph Layout**: Built-in [Dagre](https://github.com/dagrejs/dagre) hierarchical layout engine for organized, conflict-free node positioning and routing.
- 🧩 **Rich Cloud Component Library**: Drag-and-drop cloud primitives:
  - **Clients** (Web, Mobile Apps)
  - **Gateways & Load Balancers** (Kong, NGINX, Cloudflare WAF, ALB)
  - **Services** (Auth, User Service, Business Logic, Async Workers)
  - **Databases & Caches** (PostgreSQL, MongoDB, Redis Clusters)
  - **Streaming & Queues** (Kafka, RabbitMQ, SQS)
  - **Object Storage** (Amazon S3, Blob Storage)
- ✏️ **Interactive Canvas & Drawing Tools**:
  - **Tools**: Pan, Select, Rectangle, Circle, Diamond, Text Annotation, and Eraser.
  - **Connecting**: Drag handles to create animated directional data pipelines and sync/async connections.
- 📄 **One-Click Export**: Export architecture diagrams to high-resolution **PDF** formatted to the canvas bounds.
- 🌙 **Modern Glassmorphic Dark UI**: Built with Tailwind CSS and React Flow for a smooth, developer-friendly experience.

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | [Next.js](https://nextjs.org/) (App Router, Edge Runtime) |
| **UI & Styling** | [React 19](https://react.dev/), [Tailwind CSS v4](https://tailwindcss.com/), [Lucide Icons](https://lucide.dev/) |
| **Diagramming Engine** | [React Flow](https://reactflow.dev/) (`reactflow`) |
| **Graph Layout Engine** | [Dagre](https://github.com/dagrejs/dagre) |
| **AI Model** | [Mistral AI](https://mistral.ai/) (`mistral-small-latest`) |
| **Export Utilities** | `html-to-image`, `jspdf` |
| **Language** | TypeScript |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18.17 or higher recommended)
- `npm`, `pnpm`, or `yarn`
- A [Mistral AI API Key](https://console.mistral.ai/)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/drawarc.git
   cd drawarc
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy the `.env.example` file to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   Open `.env.local` and add your Mistral AI key:
   ```env
   MISTRAL_API_KEY=your_mistral_api_key_here
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open the app:**
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```
drawarc/
├── app/
│   ├── api/
│   │   └── generate/        # Edge API Route connecting to Mistral AI
│   ├── globals.css          # Tailwind & custom canvas styling
│   ├── layout.tsx           # Root layout and metadata
│   └── page.tsx             # Main canvas entry point
├── components/
│   ├── DiagramCanvas.tsx    # React Flow canvas wrapper, state, & export logic
│   ├── Sidebar.tsx          # Draggable cloud components palette
│   ├── Toolbar.tsx          # Drawing tools (pan, shapes, text, eraser)
│   └── nodes/
│       ├── CustomNode.tsx   # Cloud service node with dynamic category styling
│       ├── GenericNode.tsx  # Geometric shapes (rect, circle, diamond)
│       └── TextNode.tsx     # Custom text annotation node
├── lib/
│   └── layout.ts            # Dagre auto-layout positioning algorithm
├── public/                  # Static logos and assets
├── .env.example             # Environment variable template
├── next.config.ts           # Next.js configuration
├── package.json             # Project metadata and dependencies
└── tsconfig.json            # TypeScript configuration
```

---

## ⌨️ Scripts

- `npm run dev` — Starts local development server on port 3000.
- `npm run build` — Builds the application for production.
- `npm run start` — Runs the built production server.
- `npm run lint` — Runs ESLint checks.

---

## 🌐 Deployment (Vercel)

The easiest way to deploy DrawArc is using [Vercel](https://vercel.com):

1. Push your repository to GitHub.
2. Import the project into Vercel.
3. In the project settings, add the Environment Variable:
   - `MISTRAL_API_KEY`: Your Mistral AI API key.
4. Click **Deploy**.

---

## 📄 License

This project is open-source and licensed under the [MIT License](LICENSE).
