<div align="center">
  <img src="https://img.shields.io/badge/Status-Live-success?style=for-the-badge" alt="Status Badge"/>
  <h1>🧘‍♀️ Yogtatva</h1>
  <p><strong>Your Intelligent, Personalized AI Wellness Mentor</strong></p>
  <p>
    An advanced web application that combines artificial intelligence, long-term memory, and computer vision to guide you through your daily wellness and yoga routines.
  </p>
  <br/>
</div>

## ✨ Features

- 🧠 **AI Wellness Mentor (Powered by Groq & Llama 3)**
  - Chat in real-time with an intelligent wellness guide.
  - Generates personalized daily routines based on your goals, time, and stress levels.

- 💾 **Long-Term AI Memory (Supabase)**
  - Yogtatva remembers you. Every time you mention an injury, a preference, or a goal in chat, it seamlessly extracts and saves that memory to its cloud database. 
  - Future AI responses dynamically adapt to your unique physical and mental context.

- 📸 **Live Posture Detection (MediaPipe)**
  - Uses your device's camera locally in the browser to analyze your yoga poses in real-time.
  - Draws interactive skeleton tracking overlays directly on your video feed.

- 🎨 **Premium Aesthetic UI**
  - Luxurious "Sage Green & Cream" theme designed for calmness.
  - Fully mobile-responsive layout featuring a sleek Floating Action Button (FAB) and frosted-glass overlay menus for mobile users.

- 🎵 **Synthetic UI Audio**
  - Custom Web Audio API synthesizers provide gentle acoustic feedback (pops and chimes) during chats and yoga sessions without the heavy bloat of MP3 files.

## 🚀 Tech Stack

| Category | Technology |
|---|---|
| **Frontend** | React (Vite), JavaScript, Vanilla CSS |
| **Backend / Database** | Supabase (PostgreSQL, Row Level Security) |
| **AI Processing** | Groq (Llama 3 8B/70B) |
| **Computer Vision** | Google MediaPipe Pose |
| **Deployment** | Vercel |

## 🛠️ Local Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/SubhendraRai/yoga-ai-mentor.git
   cd yoga-ai-mentor
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env.local` file in the root directory and add:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_GROQ_API_KEY=your_groq_api_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` to view it in your browser.

## 🗄️ Database Schema

Yogtatva relies on Supabase for Auth and Memory. You will need to execute the following SQL in your Supabase SQL Editor:

```sql
CREATE TABLE chat_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'model', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE memories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  memory TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  name TEXT,
  age INTEGER,
  goals TEXT[],
  fitness_level TEXT,
  schedule JSONB,
  ai_profile_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create Policies
CREATE POLICY "Users can manage their own chat history" ON chat_history FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own memories" ON memories FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own profile" ON profiles FOR ALL USING (auth.uid() = id);
```

## 📜 License

This project is licensed under the MIT License.
