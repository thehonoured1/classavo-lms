## Classavo LMS
A modern, full-stack Learning Management System (LMS) designed to deliver a seamless experience for both instructors and students. Classavo empowers educators to build rich, dynamic course content and provides students with a clean, distraction-free learning environment.

### 🚀 Features
Role-Based Access Control: Distinct routing and dashboard experiences for Instructors and Students.

Advanced Rich-Text Course Builder: Powered by Plate.js, allowing instructors to create highly formatted lesson content (bolding, headers, lists) seamlessly.

Smart Content Rendering: A custom, read-only parsing engine that safely translates complex JSON Abstract Syntax Trees (AST) into beautiful, responsive textbook pages for students.

Deep Data Sanitization: Built-in recursive JSON sanitizers to prevent rendering crashes and ensure database integrity.

Modern UI Component Library: Styled with Tailwind CSS and shadcn/ui for a highly accessible, customizable, and responsive design.

### 💻 Tech Stack
Frontend
Core: React.js powered by Vite for lightning-fast Hot Module Replacement (HMR).

Styling: Tailwind CSS with class-variance-authority (cva) and tailwind-merge for utility-class conflict resolution.

UI Components: shadcn/ui (Radix UI primitives).

Rich-Text Engine: platejs (A modern, extensible implementation of Slate.js).

Routing: React Router DOM.

Backend
API: RESTful API (listening on 127.0.0.1:8000).

Authentication: JWT (JSON Web Tokens) stored securely via local storage.

Data Storage: Content is stored and served via stringified JSON payloads.

### 🛠️ Installation & Setup
Prerequisites
Node.js (v18+ recommended)

npm or yarn

Backend API server configured and running on port 8000.

Frontend Setup
Clone the repository and navigate to the frontend directory:

Bash
cd classavo-lms/frontend
Install dependencies:

Bash
npm install
Start the development server:

Bash
npm run dev
Access the application:
Open your browser and navigate to http://localhost:5173 (or the port specified by Vite).

### 🏗️ Project Structure (Frontend)
Plaintext
frontend/
├── src/
│   ├── components/      
│   │   ├── ui/               # Reusable shadcn/ui components
│   │   ├── plate-editor.jsx  # Core rich-text editor engine
│   │   └── ...               # Node/Mark kits for Plate plugins
│   ├── lib/
│   │   └── utils.js          # Tailwind class merging utility (cn)
│   ├── App.jsx               # Master switchboard & Route definitions
│   ├── index.css             # Global Tailwind preflight and base styles
│   └── main.jsx              # React application entry point
├── jsconfig.json             # Workspace path aliasing (@/*)
├── tailwind.config.js        # Tailwind theme and content paths
└── vite.config.js            # Vite build and plugin configuration
### 🧠 Core Engineering Concepts Highlight
The Rich-Text Lifecycle
Classavo LMS handles text formatting significantly differently than a standard text-area input.

Input: The PlateEditor component captures instructor input and builds a complex JSON array (Abstract Syntax Tree).

Transmission: Before being dispatched to the API, the array is strictly processed via a "double-stringify" method to bypass framework coercion (preventing [object Object] database corruption).

Retrieval & Sanitization: When a student loads a lesson, the ChapterView component receives the string. Before rendering, it passes through sanitizePlateJSON()—a custom recursive function that repairs broken nodes (e.g., missing children arrays) to prevent fatal React rendering loops.

Display: The sanitized data is fed into a locked, read-only instance of Plate.js, rendering a beautiful, toolbar-free lesson.