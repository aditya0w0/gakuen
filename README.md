# Gakuen 🎓

![Next.js](https://img.shields.io/badge/Next.js-15-black) ![Firebase](https://img.shields.io/badge/Firebase-Auth%20%7C%20Firestore-orange) ![Tailwind](https://img.shields.io/badge/Tailwind-CSS-blue) ![License](https://img.shields.io/badge/License-MIT-green)

**Gakuen** is a modern, full-stack e-learning platform designed to transform education through technology. It features a rich, interactive user interface for students to master in-demand skills and a powerful dashboard for instructors to manage courses.

## ✨ Key Features

- **📚 Course Management**: Comprehensive CMS for creating and organizing courses, chapters, and lessons.
- **🔐 Secure Authentication**: Robust user authentication via Firebase (Google & Email/Password).
- **🎨 Modern UI/UX**: Responsive design with stunning animations (Framer Motion, Anime.js) and Glassmorphism aesthetics.
- **📹 Rich Media Support**: Image uploads and video lesson integration.
- **👆 Drag & Drop**: Intuitive curriculum reordering using `@hello-pangea/dnd`.
- **📊 Progress Tracking**: Real-time student progress monitoring and analytics.

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Backend / Database**: [Firebase](https://firebase.google.com/) (Auth, Firestore, Storage)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand) (implied) / React Context
- **Utilities**: `lucide-react` (Icons), `clsx` & `tailwind-merge`

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm / yarn / pnpm

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/gakuen.git
    cd gakuen
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables**
    Create a `.env.local` file in the root directory and add your Firebase credentials:
    ```env
    NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
    NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
    NEXT_PUBLIC_USE_FIREBASE=true
    ```

4.  **Run the development server**
    ```bash
    npm run dev
    ```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📄 License

This project is licensed under the MIT License.
