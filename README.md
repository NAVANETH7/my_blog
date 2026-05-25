# DevBlog — Decoupled Git-Backed Headless CMS Blog

A premium, portfolio-worthy Markdown blog platform with a decoupled architecture. Built with **Next.js 16 (App Router)** for the public pages & admin interface, and a **Node/Express API backend** for secure filesystem access, Git automation, and database analytics.

The admin interface features a premium, state-of-the-art **Light/Medium Glassmorphic theme** featuring **3D beveled cards**, **4D time-shifting dawn/sunset pastel backgrounds**, and **7D pulsing blobs of depth**.

---

## 🚀 Key Features

* **Decoupled Architecture**: Separation of concerns with a Next.js 16 frontend and an Express.js API backend.
* **Premium Light/Medium Theme**: 3D card beveled lifts (`glow-card-3d`), dynamic 4D pastel cycles, and 7D glowing blobs that pulse smoothly in the background.
* **Administrative CMS Panel**: Secure portal at `/admin` to list, create, edit, or delete posts.
* **Strict Whitelist Auth Gate**: Protects the CMS via NextAuth.js OAuth (Google & GitHub) restricting access strictly to: `navanethskv@gmail.com`.
* **Git-Backed Workflow**: The CMS automatically commits and pushes all markdown and media changes to GitHub via `simple-git`, triggering static site redeployment in production (e.g. Vercel).
* **AI Writing Assistant**: Slide-in panel powered by Claude AI to suggest titles, improve summaries, expand paragraphs, check grammar, or run custom prompts.
* **Media Library & Feed Curation**: Collapsible dashed upload zone with real-time XHR progress tracking, storage gauges, and curation controls for external feeds (DEV.to and Hacker News).
* **Fuzzy Command Palette (⌘K)**: A Raycast-style floating palette to quickly search posts, navigate views, or trigger admin tasks.
* **SEO & Compliance**: Automatically generated RSS 2.0 Feed (`/rss.xml`), sitemaps, robots configurations, and dynamic meta og-tags.

---

## 🛠️ Tech Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend Framework** | Next.js 16 (App Router) & React 19 | Static site generation, server components, and CMS UI |
| **Backend API Server** | Express.js & Node.js (Port 3001) | Secure operations for FS, Git, Media uploads, and Analytics |
| **Styling** | Tailwind CSS v4 | Glassmorphism, premium light theme tokens, custom animations |
| **Auth Gateway** | NextAuth.js (Google & GitHub Provider) | Secure whitelisted OAuth gate for `navanethskv@gmail.com` |
| **Editor Workspace** | `@uiw/react-md-editor` | Live split-screen Markdown workspace with synced preview |
| **Git Orchestration** | `simple-git` | Automatically pushes content changes to GitHub repository |
| **Database** | MongoDB Atlas | Stores page view analytics and post metrics |

---

## 📁 Project Structure

```text
my-blog/
├── package.json              # Root script runner for concurrent execution
├── README.md                 # Project documentation
├── backend/                  # Node/Express API Server (Port 3001)
│   ├── src/
│   │   ├── server.ts         # API routes (deploys, media, posts, analytics)
│   │   └── lib/              # git.ts, posts.ts, analytics.ts, mongodb.ts
│   ├── content/posts/        # Git-backed Markdown database (.mdx files)
│   └── package.json
└── frontend/                 # Next.js Application (Port 3000)
    ├── app/
    │   ├── admin/            # CMS Dashboard routes (analytics, settings, tags)
    │   ├── api/              # Secure NextAuth routes & Next.js proxy controllers
    │   └── blog/             # Public landing pages
    ├── components/
    │   ├── admin/            # CommandPalette, EditorClient, Sidebar, TopBar
    │   └── Providers.tsx     # NextAuth provider wrapper
    └── package.json
```

---

## ⚙️ Local Setup

Follow these steps to run both services concurrently:

### 1. Install Dependencies
Install dependencies at the root. The `postinstall` script will automatically install dependencies in both the `frontend` and `backend` directories:
```bash
npm install
```

### 2. Configure Environment Variables
You will need to configure env variables in both folders:

#### Backend (`/backend/.env`)
Create `/backend/.env` with:
```env
NEXTAUTH_SECRET=your-32-char-secret
MONGODB_URI=your-mongodb-atlas-connection-string
ADMIN_EMAIL=navanethskv@gmail.com
GITHUB_ID=your-github-oauth-client-id
GITHUB_SECRET=your-github-oauth-client-secret
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
GIT_USER_NAME=your-git-username
GIT_USER_EMAIL=navanethskv@gmail.com
GITHUB_TOKEN=your-github-personal-access-token
GITHUB_REPO_URL=https://github.com/your-username/my_blog.git
BACKEND_API_KEY=your-shared-backend-api-key
```

#### Frontend (`/frontend/.env.local`)
Create `/frontend/.env.local` with:
```env
NEXTAUTH_SECRET=your-32-char-secret
NEXTAUTH_URL=http://localhost:3000
MONGODB_URI=your-mongodb-atlas-connection-string
GITHUB_ID=your-github-oauth-client-id
GITHUB_SECRET=your-github-oauth-client-secret
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
ADMIN_EMAIL=navanethskv@gmail.com
BACKEND_URL=http://localhost:3001
BACKEND_API_KEY=your-shared-backend-api-key
```

### 3. Run Development Servers
Start both the Frontend and Backend servers concurrently:
```bash
npm run dev
```
Open your browser to:
- **Public Blog**: [http://localhost:3000/blog](http://localhost:3000/blog)
- **Admin CMS Dashboard**: [http://localhost:3000/admin](http://localhost:3000/admin) (Log in with Google/GitHub using `navanethskv@gmail.com`)
- **Backend Health Check**: [http://localhost:3001/health](http://localhost:3001/health)

---

## 📝 Curation & Authoring Workflow

### 1. Creating/Editing Blog Posts
1. Sign into the admin dashboard at `/admin`.
2. Click **New Post** to open the markdown editor.
3. Write your title, tags, and summary in the metadata panel. Use the AI Assist button to generate summaries or titles if needed.
4. Input your markdown in the editor.
5. Upload or drag-and-drop cover images into the sidebar upload zone.
6. Click **Publish** to push the post. The backend will write the `.mdx` file, stage the images, create a Git commit, and push it directly to GitHub.

### 2. External Feed Curation
Use the DEV.to or Hacker News tabs to view technical posts. Admin users can:
- **Edit** the title or description to adapt it for local readers.
- **Hide/Delete** items to remove them from the feed listing.
- Review or **Reset** all curated feed settings from the *Curation Overrides* dashboard.

---

## ☁️ Deployment Guide

1. Push your decoupled repository codebase to GitHub.
2. **Frontend (Vercel)**:
   - Import the project into Vercel, pointing to the `/frontend` subfolder as the Root Directory.
   - Configure all environment variables matching `/frontend/.env.local`.
   - Update your OAuth callback URLs on GitHub/Google developers consoles to point to your live Vercel domain.
3. **Backend (Render / Railway / VPS)**:
   - Deploy the `/backend` subfolder as a Node.js web service.
   - Configure the environment variables matching `/backend/.env`.
   - In Vercel environment variables, update `BACKEND_URL` to point to the live URL of your deployed backend service.
