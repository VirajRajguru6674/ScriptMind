# ScriptMind AI - YouTube Notes Genius

ScriptMind AI is a sophisticated AI-powered web application designed to transform YouTube videos into structured, easy-to-read study notes. It leverages advanced natural language processing to extract transcripts and generate high-quality educational content.

## 🚀 Key Features

### 📝 AI-Powered Note Generation
- **Intelligent Summarization**: Automatically extracts video transcripts and generates detailed, structured markdown notes.
- **Customizable Output**: Users can choose the tone (Educational, Casual, Formal, Concise) and detail level (Concise, Balanced, Detailed) of the generated notes.
- **Multilingual Support**: Generate notes in English, Hindi, Marathi, Spanish, French, and German.
- **Diagram Integration**: Support for Mermaid diagrams to visualize concepts within the notes.

### 🎓 Study & Productivity Tools
- **Flashcards**: Automatically generates study flashcards from the notes.
- **Study Timer**: Integrated Pomodoro-style timer with session tracking.
- **Session Stats**: Visualize your learning progress and word counts.
- **AI Chat Interface**: Interactive chat to ask questions specifically about the video content.

### 📥 Video Processing
- **Playlist Downloader**: Process entire YouTube playlists at once.
- **Video Preview**: Integrated player to watch the video while reviewing notes.
- **Content Recommendations**: AI-driven suggestions for related videos based on the current topic.

### 🛡️ Enterprise & Admin Features
- **Subscription Tiers**: Managed plans (Free, Pro, Expert) with usage limits and key rotation logic.
- **Admin Dashboard**: Comprehensive user management, audit logs, and system settings configuration.
- **Authentication**: Secure login with Google OAuth or Email/Password.
- **Notifications**: System alerts integrated with Microsoft Teams, Telegram, and Email.

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 18 (Vite)
- **Language**: TypeScript
- **Styling**: Tailwind CSS, Radix UI (Shadcn/ui)
- **Animation**: Framer Motion
- **Icons**: Lucide React
- **State Management**: TanStack Query (React Query)
- **Routing**: React Router DOM

### Backend
- **Server**: Node.js (Express)
- **Database**: MySQL (with auto-migration support)
- **Auth**: JWT, Google OAuth, Bcrypt
- **APIs**: YouTube Transcript API, Custom AI Integration (Rotation-based API key management)
- **Utilities**: yt-dlp (video processing), Nodemailer (email notifications)

## 📁 Project Structure

```text
├── server/                 # Express backend
│   ├── index.js           # Core server logic & API routes
│   ├── schema.sql         # Database schema
│   └── migrate.js         # Migration scripts
├── src/
│   ├── components/        # Shared UI components
│   │   ├── ui/            # Radix-based base components
│   │   ├── Sidebar.tsx    # App navigation
│   │   └── NotesDisplay.tsx # Markdown renderer
│   ├── pages/             # Route pages
│   │   ├── Index.tsx      # Main Dashboard
│   │   ├── Admin.tsx      # Admin Panel
│   │   └── Pricing.tsx    # Subscription management
│   ├── context/           # Auth and Notes state
│   └── hooks/             # Custom React hooks
└── tailwind.config.ts     # Styling configuration
```

## 🎨 Theme System
The application features a premium dark-mode aesthetic by default, with customizable theme variants:
- **Default**: Slate/Zinc professional look.
- **Forest**: Nature-inspired greens.
- **Sunset**: Warm orange and purple tones.
- **Ocean**: Deep sea blues.
- **Golden**: Premium gold accents.

---
*Created by ScriptMind AI Team*
