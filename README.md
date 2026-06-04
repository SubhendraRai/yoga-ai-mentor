<div align="center">
  <img src="public/icons.svg" alt="Logo" width="80" height="80">
  <h1 align="center">Yogtatva</h1>
  <p align="center">
    A persistent, intelligent wellness operating system powered by Gemini 2.0 Flash.
    <br />
    <br />
    <a href="#features">Features</a>
    ·
    <a href="#tech-stack">Tech Stack</a>
    ·
    <a href="#getting-started">Getting Started</a>
  </p>
</div>

---

## 🧘‍♂️ Vision

**Yogtatva** isn't just another fitness tracker or chatbot. It's a lifelong personal mentor for physical health, mental wellness, and habit formation. 

Unlike traditional apps that offer static, one-size-fits-all routines, this platform acts as an intelligent operating system that **learns from your behavior, preferences, schedule, and progress.** Over time, it weaves your data into highly personalized daily routines and real-time posture corrections.

## ✨ Features

- **🧠 Persistent AI Memory Engine**: 
  The core of the application. It securely logs your moods, sleep quality, and completed activities, feeding them into a context engine. Every time you interact with the mentor, it remembers your history.
  
- **🎥 Live Multimodal Posture Correction**: 
  Using the experimental *Gemini Multimodal Live API* via WebSockets, the app streams your camera feed securely and provides real-time, low-latency vocal/text feedback on your yoga alignment (e.g. *"Extend your arms wider into Warrior II"*).

- **🌅 Dynamic Wellness Dashboard**:
  A personalized hub featuring your overall "Wellness Score" (calculated from sleep, mood, and activity streaks), an interactive mood tracker, and an AI-generated daily plan tailored to your available time and current stress levels.

- **💬 Conversational Mentor**:
  A chat interface connected directly to your persistent context. You can ask for advice, report injuries (e.g. "my lower back hurts today"), and the AI will remember it for all future session generations.

- **☁️ Cloud Sync via Supabase**:
  Your entire profile, memory logs, and AI observations are securely synchronized across devices using Supabase Authentication and PostgreSQL.

## 🛠️ Tech Stack

This project is built with modern, high-performance web technologies:

- **Frontend**: React.js, Vite
- **Styling**: Vanilla CSS (Custom Luxury Dark/Gold Aesthetic)
- **AI Models**: Google Gemini 2.0 Flash (REST API & WebSockets)
- **Database & Auth**: Supabase (PostgreSQL)
- **Analytics**: PostHog
- **Icons**: Lucide React

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine.

### Prerequisites

You will need Node.js installed on your machine, along with accounts for the following services:
- [Google AI Studio](https://aistudio.google.com/) (For the Gemini API Key)
- [Supabase](https://supabase.com/) (For Auth and Database)
- [PostHog](https://posthog.com/) (For Analytics - Optional)

### Installation

1. **Clone the repository**
   ```sh
   git clone https://github.com/SubhendraRai/yoga-ai-mentor.git
   cd yoga-ai-mentor
   ```

2. **Install NPM packages**
   ```sh
   npm install
   ```

3. **Set up Environment Variables**
   Create a `.env.local` file in the root directory and add your keys:
   ```env
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   
   VITE_SUPABASE_URL=your_supabase_url_here
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   
   VITE_POSTHOG_KEY=your_posthog_key_here
   VITE_POSTHOG_HOST=https://us.i.posthog.com
   ```

4. **Initialize Supabase Tables**
   Run the SQL script provided in the `/docs` or implementation plan inside your Supabase SQL Editor to generate the necessary `profiles`, `ai_observations`, and `wellness_logs` tables.

5. **Start the Development Server**
   ```sh
   npm run dev
   ```

## 🔒 Privacy & Data

User data privacy is a core architectural principle. 
- Camera feeds for live pose correction are streamed securely via WebSockets directly to the Gemini endpoint and are **never** stored on any database.
- AI memory contexts are strictly tied to the authenticated user's `uuid` via Supabase Row Level Security (RLS) policies.

---

<p align="center">
  Built with ❤️ for a balanced mind and body.
</p>
