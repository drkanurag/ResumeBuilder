# ResuCraft Pro — Customizable Public Resume Studio

A zero-dependency, local-first Resume Builder built for the public to create, customize, and export ATS-friendly resumes directly in the browser.

---

## 🚀 Click Below to Open & Use the Resume Builder Directly

[![Launch Live Resume Builder (GitHub Pages)](https://img.shields.io/badge/%F0%9F%9A%80_Launch_Resume_Builder-GitHub_Pages-2563eb?style=for-the-badge)](https://drkanurag.github.io/ResumeBuilder/)
[![Instant Preview (Zero Setup)](https://img.shields.io/badge/%E2%9A%A1_Instant_Live_Open-raw.githack-10b981?style=for-the-badge)](https://raw.githack.com/drkanurag/ResumeBuilder/main/index.html)
[![Open via HTMLPreview](https://img.shields.io/badge/%F0%9F%8C%90_Open_App-HTMLPreview-8b5cf6?style=for-the-badge)](https://htmlpreview.github.io/?https://github.com/drkanurag/ResumeBuilder/blob/main/index.html)

- **GitHub Pages Direct Link**: [**https://drkanurag.github.io/ResumeBuilder/**](https://drkanurag.github.io/ResumeBuilder/)
- **Instant Live Mirror (Works immediately after push without Pages setup)**: [**https://raw.githack.com/drkanurag/ResumeBuilder/main/index.html**](https://raw.githack.com/drkanurag/ResumeBuilder/main/index.html)
- **HTMLPreview Direct Link**: [**https://htmlpreview.github.io/?https://github.com/drkanurag/ResumeBuilder/blob/main/index.html**](https://htmlpreview.github.io/?https://github.com/drkanurag/ResumeBuilder/blob/main/index.html)
- **Source Entry File**: [`index.html`](./index.html)

---

## ✨ Key Features

- **100% Public & Customizable (Zero Locked Fields)**:
  - Start with a clean slate—no pre-filled fake data.
  - **Add Any Heading / Section**: Create unlimited sections (*Work Experience*, *Internships*, *Education*, *Skills*, *Projects*, *Certifications*, *Publications*, *Volunteering*, *Languages*, *Achievements*, or any custom paragraph/list).
  - **Edit, Reorder & Delete Anything**: Rename any section heading inline, reorder sections or entries with `↑` / `↓`, toggle visibility, or delete any heading, entry, or bullet point.
  - **Unlimited Custom Header Fields**: Add custom contact fields or links (e.g., *Portfolio*, *ORCID*, *Visa Status*, *Nationality*) to your resume header.
- **Two-Way Editing (Form Editor + Direct On-Paper Canvas Editing)**:
  - Edit in the structured left-hand panel **OR click directly on any heading, name, role, date, paragraph, or bullet point on the live paper preview** to type and edit inline.
  - Hover over any section on the paper preview to access quick on-canvas actions (`+ Add`, `↑`, `↓`, `🗑️ Delete`).
- **6 Professional & ATS-Friendly Templates**:
  1. *Harvard / Classic ATS* (Single-column gold standard)
  2. *Modern Executive* (Contemporary header & accent bar)
  3. *Tech Minimalist* (Clean geometric high-density layout)
  4. *Executive Split Sidebar* (Structured two-column design)
  5. *Swiss Architectural Grid* (Editorial left-column section labels)
  6. *Ultra-Compact One-Pager* (High-density single-page layout)
- **Real-Time ATS Score & Job Description Keyword Matcher**:
  - Audits your resume across 5 pillars (Contact Completeness, Quantified Impact, Action Verbs, Section Depth, and Readability).
  - Paste any target Job Description to see matched vs. missing keywords and click any missing keyword pill to add it directly to your Skills section.
- **Smart Bullet Point Enhancer & Action Verb Studio**:
  - Click **✨ Enhance** under any bullet point for instant rewrites using strong action verbs and the XYZ impact formula (works 100% offline, with optional support for your own Gemini or OpenAI API key).
- **Multi-Resume Profiles & Crisp Vector PDF Export**:
  - Create, duplicate, rename, and switch between multiple resume versions saved automatically in your browser's `localStorage`.
  - Click **🖨️ Export PDF** (and choose *Save as PDF*) for a 100% selectable-text vector PDF, or export/import `.json` backups anytime.

---

## 💻 Running Locally

1. **Direct Open**: Double-click [`index.html`](./index.html) to open it in any browser.
2. **Local HTTP Server (Optional)**:
   ```bash
   python -m http.server 8080
   ```
   Then open [http://localhost:8080](http://localhost:8080).

## 🌐 Enabling GitHub Pages (Optional)

While the **Instant Live Mirror (`raw.githack.com`)** link above works automatically as soon as you push to `main`, you can also enable official GitHub Pages in 2 clicks:
1. Go to [**Repository Settings → Pages**](https://github.com/drkanurag/ResumeBuilder/settings/pages).
2. Under **Build and deployment → Source**, select **Deploy from a branch**, choose **`main`** and **`/ (root)`**, and click **Save**.
3. Your live site will be published at [**https://drkanurag.github.io/ResumeBuilder/**](https://drkanurag.github.io/ResumeBuilder/).
