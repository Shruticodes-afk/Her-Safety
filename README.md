# HerRoute - Community Safety Mapping

A community-powered safety mapping platform designed to help residents navigate their city safely. HerRoute aggregates community incident reports and public infrastructure data to generate real-time safety heatmaps and AI-driven area summaries.

🔗 **Live Demo:** [https://her-safety-three.vercel.app/](https://her-safety-three.vercel.app/)

## 🚀 Key Features

- **Incident Reporting:** Secure, location-based reporting of safety incidents with categorization and severity tracking.
- **Risk Heatmap:** Dynamic, visually rich maps displaying risk zones computed from time-decayed incident reports.
- **Public Infrastructure Data Layer:** Seamlessly integrates safety-positive infrastructure like streetlights and police stations (fetched from OpenStreetMap) to accurately adjust risk scores.
- **AI-Generated Zone Summaries:** Powered by Gemini AI, users can instantly click on a risk hotspot to receive a concise, data-grounded summary of local safety concerns.

## 🛠 Tech Stack

- **Frontend Framework:** Next.js (App Router), React
- **Styling:** Tailwind CSS v4
- **Database & Auth:** Supabase (PostgreSQL)
- **Mapping:** Leaflet & React-Leaflet
- **AI Integration:** Google Gemini AI

## 💻 Local Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Shruticodes-afk/her-safety.git
   cd her-safety
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env.local` file in the root directory and add the following keys:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
   SUPABASE_SECRET_KEY=your_supabase_service_role_key
   GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.
