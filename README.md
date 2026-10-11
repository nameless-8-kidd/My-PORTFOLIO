# Shaun Khalira — Portfolio Website

A personal portfolio website that showcases my background, skills, and projects as an IT student focused on Java, databases, and web development.

**Live site:** add your GitHub Pages URL here once deployed, e.g. `https://nameless-8-kidd.github.io/portfolio/`

## Technologies used

* HTML5 — semantic page structure (header, nav, main, section, article, footer)
* CSS3 — custom design system (CSS variables), responsive grid/flexbox layout, no framework
* JavaScript (vanilla) — no libraries or frameworks
* Fonts: Bricolage Grotesque and Figtree (Google Fonts)

## Features

* Responsive layout for desktop, tablet, and mobile
* Mobile navigation menu with animated hamburger toggle
* Scroll animations that replay every time a section scrolls into view (staggered fade, slide, wipe, and line-draw effects)
* Reading-progress bar and nav that highlights the current section
* Dynamic colour themes: pick an image in the theme carousel and the whole site adopts its colours (contrast-checked, and remembered between visits)
* Project carousel with arrow buttons, keyboard arrows, and touch swipe
* Sticky header with smooth-scroll navigation
* Skills grid covering languages, web, tools, databases, workflow, and systems analysis
* Respects `prefers-reduced-motion` for accessibility

## Contact

* Email: [shaunkhalira74@gmail.com](mailto:shaunkhalira74@gmail.com)
* LinkedIn: https://www.linkedin.com/in/shaun-khalira-2a2879404
* GitHub: https://github.com/nameless-8-kidd

## References

* Built with structural and coding assistance from Claude (Anthropic) — used to fix, make responsive, and add animations to the HTML/CSS/JS. All content (bio, project descriptions, skills) is my own real information, provided to and reviewed by me.
* Colour palette: a deep teal background with a warm cream accent by default, with the theme carousel letting visitors recolour the site from the theme images.
* Fonts sourced from Google Fonts (Bricolage Grotesque, Figtree).
* No other external templates, code snippets, or icon packs were used.

Update the live-site link above once GitHub Pages is enabled.

## Running locally

1. Clone the repository:

```
git clone https://github.com/nameless-8-kidd/<your-repo-name>.git
```

2. Open the folder and open `index.html` directly in your browser — no build step or server required.

   Note: when opened straight from disk, browsers block reading image pixels, so the theme picker switches between four built-in palettes instead of extracting colours from the images. To see the full behaviour, serve the folder instead (for example `python3 -m http.server 8000`) or use the deployed GitHub Pages site.

## Deploying to GitHub Pages

1. Push this project to a public GitHub repository.
2. Go to Settings → Pages on the repository.
3. Under "Build and deployment", select the `main` branch and `/ (root)` folder, then save.
4. Wait a minute for GitHub to publish, then test the live URL in a private/incognito window.
