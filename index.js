/* ==========================================================
   1. Mobile navigation
   2. Project carousel
   3. Dynamic theme selector (and its carousel)
   4. Scroll effects (reveal, progress bar, active link)
========================================================== */

(function () {
    "use strict";

    // Tells the <head> safety net that this script loaded.
    window.__portfolioReady = true;

    const $ = (selector, scope = document) => scope.querySelector(selector);
    const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

    /* One broken feature should never stop the others. */
    function safely(name, fn) {
        try {
            fn();
        } catch (error) {
            console.error(`Portfolio: "${name}" failed to start.`, error);
        }
    }


    /* ======================================================
       1. MOBILE NAVIGATION
    ====================================================== */

    function initNavigation() {
        const toggle = $(".nav-toggle");
        const menu = $("#nav-menu");

        if (!toggle || !menu) return;

        const isOpen = () => toggle.getAttribute("aria-expanded") === "true";

        function setOpen(open) {
            toggle.setAttribute("aria-expanded", String(open));
            toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
            menu.classList.toggle("is-open", open);
        }

        toggle.addEventListener("click", () => setOpen(!isOpen()));

        // Close after choosing a link
        menu.addEventListener("click", event => {
            if (event.target.closest("a")) setOpen(false);
        });

        // Close when clicking elsewhere
        document.addEventListener("click", event => {
            if (isOpen() && !event.target.closest(".nav")) setOpen(false);
        });

        // Close with Escape and return focus to the button
        document.addEventListener("keydown", event => {
            if (event.key === "Escape" && isOpen()) {
                setOpen(false);
                toggle.focus();
            }
        });

        // Reset when the layout switches back to desktop
        window.matchMedia("(max-width: 760px)").addEventListener("change", () => setOpen(false));
    }


    /* ======================================================
       2. PROJECT CAROUSEL
       Cards per view comes from the --visible CSS variable,
       so the layout and the script can never disagree.
    ====================================================== */

    function initCarousel() {
        const carousel = $(".carousel");
        const viewport = $(".carousel-viewport");
        const track = $("#carouselTrack");
        const prevBtn = $("#prevBtn");
        const nextBtn = $("#nextBtn");
        const status = $("#carouselStatus");

        if (!carousel || !viewport || !track || !prevBtn || !nextBtn) return;

        const cards = Array.from(track.children);
        if (!cards.length) return;

        let index = 0;

        const getVisible = () =>
            Math.max(1, parseInt(getComputedStyle(carousel).getPropertyValue("--visible"), 10) || 1);

        const getMaxIndex = () => Math.max(0, cards.length - getVisible());

        function update() {
            const visible = getVisible();
            index = clamp(index, 0, getMaxIndex());

            const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
            const step = cards[0].offsetWidth + gap;

            track.style.transform = `translateX(${-index * step}px)`;

            // Off-screen cards must not be reachable by Tab (it would scroll the clipped track)
            cards.forEach((card, i) => {
                card.inert = i < index || i >= index + visible;
            });

            // aria-disabled (not disabled) so keyboard focus is never lost at either end
            prevBtn.setAttribute("aria-disabled", String(index === 0));
            nextBtn.setAttribute("aria-disabled", String(index >= getMaxIndex()));

            if (status) {
                const last = Math.min(index + visible, cards.length);
                status.textContent = visible > 1
                    ? `Projects ${index + 1}\u2013${last} of ${cards.length}`
                    : `Project ${index + 1} of ${cards.length}`;
            }
        }

        function go(direction) {
            const next = clamp(index + direction, 0, getMaxIndex());
            if (next === index) return;
            index = next;
            update();
        }

        prevBtn.addEventListener("click", () => go(-1));
        nextBtn.addEventListener("click", () => go(1));

        // Arrow keys while focus is inside the carousel
        carousel.addEventListener("keydown", event => {
            if (event.key === "ArrowLeft") go(-1);
            if (event.key === "ArrowRight") go(1);
        });

        // Swipe on touch screens (vertical scrolling is left to the browser via touch-action)
        let startX = null;
        let startY = null;

        viewport.addEventListener("pointerdown", event => {
            if (event.pointerType === "mouse") return;
            startX = event.clientX;
            startY = event.clientY;
        });

        viewport.addEventListener("pointerup", event => {
            if (startX === null) return;

            const dx = event.clientX - startX;
            const dy = event.clientY - startY;
            startX = startY = null;

            if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
                go(dx < 0 ? 1 : -1);
            }
        });

        viewport.addEventListener("pointercancel", () => {
            startX = startY = null;
        });

        // Re-measure whenever the layout changes size
        if ("ResizeObserver" in window) {
            new ResizeObserver(update).observe(viewport);
        } else {
            window.addEventListener("resize", update);
        }

        update();
    }


    /* ======================================================
       3. DYNAMIC THEME SELECTOR
       Click a thumbnail and the page takes on its colours.
       Every palette is checked for readable contrast.
    ====================================================== */

    function initThemes() {
        const themeButtons = $$(".cad");
        if (!themeButtons.length) return;

        const STORAGE_KEY = "portfolioTheme";
        const PALETTE_KEYS = ["background", "surface", "accent", "text", "muted", "border"];
        const CSS_NAMES = {
            background: "--theme-bg",
            surface: "--theme-surface",
            accent: "--theme-accent",
            text: "--theme-text",
            muted: "--theme-muted",
            border: "--theme-border"
        };

        /* Used when an image can't be analysed (e.g. opened from file://) */

        const fallbackThemes = [
            { background: "#274245", surface: "#1E3436", accent: "#DFD6AE", text: "#F5F1E5", muted: "#B9C3B8", border: "#526C68" },
            { background: "#46352D", surface: "#352720", accent: "#D7A86E", text: "#FFF1DD", muted: "#D0BDA9", border: "#80644F" },
            { background: "#293C32", surface: "#1D2D25", accent: "#B8C9A5", text: "#F0F1DF", muted: "#B5C1B0", border: "#536C59" },
            { background: "#29334A", surface: "#1D2538", accent: "#D6C28A", text: "#F5F0DF", muted: "#BAC3D3", border: "#53617B" }
        ];


        /* ---------- Colour utilities ---------- */

        const isHex = value => typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);

        function rgbToHex(r, g, b) {
            return "#" + [r, g, b]
                .map(value => clamp(Math.round(value), 0, 255).toString(16).padStart(2, "0"))
                .join("")
                .toUpperCase();
        }

        function hexToRgb(hex) {
            const value = hex.replace("#", "");
            return {
                r: parseInt(value.substring(0, 2), 16),
                g: parseInt(value.substring(2, 4), 16),
                b: parseInt(value.substring(4, 6), 16)
            };
        }

        function getBrightness(color) {
            const { r, g, b } = hexToRgb(color);
            return 0.299 * r + 0.587 * g + 0.114 * b;
        }

        function getSaturation(color) {
            const { r, g, b } = hexToRgb(color);
            const maximum = Math.max(r, g, b);
            const minimum = Math.min(r, g, b);
            return maximum === 0 ? 0 : (maximum - minimum) / maximum;
        }

        function mixColors(color1, color2, amount) {
            const a = hexToRgb(color1);
            const b = hexToRgb(color2);
            return rgbToHex(
                a.r + (b.r - a.r) * amount,
                a.g + (b.g - a.g) * amount,
                a.b + (b.b - a.b) * amount
            );
        }

        /* WCAG relative luminance and contrast ratio */

        function getLuminance(color) {
            const { r, g, b } = hexToRgb(color);
            const channel = value => {
                const v = value / 255;
                return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
            };
            return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
        }

        function getContrast(color1, color2) {
            const l1 = getLuminance(color1);
            const l2 = getLuminance(color2);
            return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
        }

        /* Lighten a colour until it reaches the contrast ratio on the dark theme. */

        function ensureContrast(color, background, minimum) {
            let result = color;
            for (let i = 0; i < 24 && getContrast(result, background) < minimum; i++) {
                result = mixColors(result, "#FFFFFF", 0.12);
            }
            return result;
        }

        /* Guarantees a dark background and readable text, whatever the source palette. */

        function normalisePalette(palette) {
            let background = palette.background;

            for (let i = 0; i < 10 && getBrightness(background) > 70; i++) {
                background = mixColors(background, "#000000", 0.2);
            }

            let surface = isHex(palette.surface) ? palette.surface : mixColors(background, "#FFFFFF", 0.08);

            for (let i = 0; i < 10 && getBrightness(surface) > 85; i++) {
                surface = mixColors(surface, "#000000", 0.2);
            }

            // Measure against whichever of the two surfaces is lighter
            const reference = getLuminance(background) > getLuminance(surface) ? background : surface;

            return {
                background,
                surface,
                accent: ensureContrast(palette.accent, reference, 4.5),
                text: ensureContrast(palette.text, reference, 7),
                muted: ensureContrast(palette.muted, reference, 4.5),
                border: palette.border
            };
        }

        const isValidPalette = palette =>
            !!palette && PALETTE_KEYS.every(key => isHex(palette[key]));


        /* ---------- Extract colours from an image ---------- */

        function extractImagePalette(image) {
            return new Promise((resolve, reject) => {
                const canvas = document.createElement("canvas");
                const context = canvas.getContext("2d", { willReadFrequently: true });

                if (!context) {
                    reject(new Error("Canvas is unavailable."));
                    return;
                }

                const sampleSize = 60;
                canvas.width = sampleSize;
                canvas.height = sampleSize;

                try {
                    context.drawImage(image, 0, 0, sampleSize, sampleSize);

                    const imageData = context.getImageData(0, 0, sampleSize, sampleSize).data;
                    const colourCounts = new Map();

                    for (let i = 0; i < imageData.length; i += 16) {
                        const alpha = imageData[i + 3];
                        if (alpha < 180) continue;

                        // Quantise to group similar colours and reduce noise
                        const hex = rgbToHex(
                            Math.round(imageData[i] / 24) * 24,
                            Math.round(imageData[i + 1] / 24) * 24,
                            Math.round(imageData[i + 2] / 24) * 24
                        );

                        colourCounts.set(hex, (colourCounts.get(hex) || 0) + 1);
                    }

                    const colours = Array.from(colourCounts.entries())
                        .sort((a, b) => b[1] - a[1])
                        .map(entry => entry[0]);

                    if (!colours.length) {
                        reject(new Error("No usable colours found."));
                        return;
                    }

                    // Darkest meaningful colour becomes the background
                    const darkColours = colours.filter(colour => getBrightness(colour) < 150);
                    const background = darkColours.length
                        ? darkColours.reduce((darkest, colour) =>
                            getBrightness(colour) < getBrightness(darkest) ? colour : darkest)
                        : mixColors(colours[0], "#000000", 0.45);

                    // Most saturated mid-tone colour becomes the accent
                    const accent = colours
                        .filter(colour => getBrightness(colour) > 35 && getBrightness(colour) < 235)
                        .reduce((best, colour) =>
                            getSaturation(colour) > getSaturation(best) ? colour : best, colours[0]);

                    // Lightest colour becomes the text
                    const lightColours = colours.filter(colour => getBrightness(colour) > 175);
                    const text = lightColours.length
                        ? lightColours.reduce((lightest, colour) =>
                            getBrightness(colour) > getBrightness(lightest) ? colour : lightest)
                        : "#F5F1E5";

                    resolve({
                        background: mixColors(background, "#000000", 0.18),
                        surface: mixColors(background, "#FFFFFF", 0.08),
                        accent,
                        text,
                        muted: mixColors(text, background, 0.35),
                        border: mixColors(accent, background, 0.45)
                    });
                } catch (error) {
                    reject(error);
                }
            });
        }


        /* ---------- Apply & remember ---------- */

        function applyTheme(rawPalette, selectedIndex, persist) {
            const palette = normalisePalette(rawPalette);
            const root = document.documentElement;

            PALETTE_KEYS.forEach(key => root.style.setProperty(CSS_NAMES[key], palette[key]));

            const meta = $('meta[name="theme-color"]');
            if (meta) meta.setAttribute("content", palette.background);

            themeButtons.forEach((button, i) => {
                button.setAttribute("aria-pressed", String(i === selectedIndex));
            });

            if (!persist) return;

            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify({ index: selectedIndex, palette }));
            } catch (error) {
                console.warn("Theme preference could not be saved.");
            }
        }


        /* ---------- Make each thumbnail a working button ---------- */

        themeButtons.forEach((button, index) => {
            const image = $("img", button);
            if (!image) return;

            async function selectTheme() {
                if (button.classList.contains("theme-loading")) return;
                button.classList.add("theme-loading");

                try {
                    // Wait for the image if it is still loading
                    if (!image.complete) {
                        await new Promise((resolve, reject) => {
                            image.addEventListener("load", resolve, { once: true });
                            image.addEventListener("error", reject, { once: true });
                        });
                    }

                    if (!image.naturalWidth) {
                        throw new Error("Theme image could not be loaded.");
                    }

                    applyTheme(await extractImagePalette(image), index, true);
                } catch (error) {
                    console.warn("Using the fallback theme:", error.message);
                    applyTheme(fallbackThemes[index % fallbackThemes.length], index, true);
                } finally {
                    button.classList.remove("theme-loading");
                }
            }

            button.addEventListener("click", selectTheme);
        });


        /* ---------- Restore the last theme (or the default) ---------- */

        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");

            if (saved && isValidPalette(saved.palette) && themeButtons[saved.index]) {
                applyTheme(saved.palette, saved.index, false);
                return;
            }
        } catch (error) {
            console.warn("Saved theme could not be restored.");
        }

        applyTheme(fallbackThemes[0], 0, false);
    }


    /* ======================================================
       3b. THEME CAROUSEL
       Native scroll-snap does the sliding (so touch swipe and
       keyboard focus just work); the arrows scroll one "page".
    ====================================================== */

    function initThemeCarousel() {
        const track = $("#themeTrack");
        const prevBtn = $("#themePrev");
        const nextBtn = $("#themeNext");

        if (!track || !prevBtn || !nextBtn) return;

        const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        function update() {
            const maxScroll = track.scrollWidth - track.clientWidth;
            const overflowing = maxScroll > 2;

            // Hide the arrows when every theme already fits
            prevBtn.hidden = nextBtn.hidden = !overflowing;

            prevBtn.setAttribute("aria-disabled", String(track.scrollLeft <= 2));
            nextBtn.setAttribute("aria-disabled", String(track.scrollLeft >= maxScroll - 2));
        }

        function page(direction) {
            const card = track.firstElementChild;
            if (!card) return;

            const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
            const step = card.offsetWidth + gap;
            const perPage = Math.max(1, Math.floor(track.clientWidth / step));

            track.scrollBy({ left: direction * perPage * step, behavior: smooth ? "smooth" : "auto" });
        }

        prevBtn.addEventListener("click", () => page(-1));
        nextBtn.addEventListener("click", () => page(1));

        let ticking = false;
        track.addEventListener("scroll", () => {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(() => {
                update();
                ticking = false;
            });
        }, { passive: true });

        if ("ResizeObserver" in window) {
            new ResizeObserver(update).observe(track);
        } else {
            window.addEventListener("resize", update);
        }

        update();
    }


    /* ======================================================
       4. SCROLL EFFECTS
    ====================================================== */

    function initScrollEffects() {
        const root = document.documentElement;
        const header = $(".site-header");
        const progress = $(".scroll-progress");

        /* ---------- Progress bar & header shadow ---------- */

        let ticking = false;

        function onScroll() {
            if (ticking) return;
            ticking = true;

            requestAnimationFrame(() => {
                const scrollable = root.scrollHeight - window.innerHeight;
                const ratio = scrollable > 0 ? window.scrollY / scrollable : 0;

                if (progress) progress.style.setProperty("--progress", clamp(ratio, 0, 1).toFixed(4));
                if (header) header.classList.toggle("is-scrolled", window.scrollY > 8);

                ticking = false;
            });
        }

        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll);
        onScroll();


        /* ---------- Reveal on scroll ---------- */

        const revealTargets = $$("[data-reveal]");

        if (!("IntersectionObserver" in window)) {
            revealTargets.forEach(element => element.classList.add("is-visible"));
        } else {
            /* Plays the animation whenever an element scrolls into view. */

            const showObserver = new IntersectionObserver(entries => {
                // Elements that arrive together are staggered, in reading order
                const arriving = entries
                    .filter(entry => entry.isIntersecting)
                    .sort((a, b) =>
                        a.boundingClientRect.top - b.boundingClientRect.top ||
                        a.boundingClientRect.left - b.boundingClientRect.left);

                arriving.forEach((entry, i) => {
                    entry.target.style.setProperty("--reveal-delay", `${Math.min(i, 8) * 0.09}s`);
                    entry.target.classList.add("is-visible");
                });
            }, {
                threshold: 0.12,
                rootMargin: "0px 0px -8% 0px"
            });

            /* Resets an element once it is completely off-screen, so the
               next scroll past it plays the animation again. Waiting until
               it is fully gone means nothing vanishes while still visible. */

            const resetObserver = new IntersectionObserver(entries => {
                entries.forEach(entry => {
                    if (!entry.isIntersecting) {
                        entry.target.classList.remove("is-visible");
                    }
                });
            }, { threshold: 0 });

            revealTargets.forEach(element => {
                showObserver.observe(element);
                resetObserver.observe(element);
            });
        }


        /* ---------- Highlight the current section in the nav ---------- */

        const navLinks = $$("#nav-menu a");
        const sections = navLinks
            .map(link => $(link.getAttribute("href")))
            .filter(Boolean);

        if (sections.length && "IntersectionObserver" in window) {
            const spy = new IntersectionObserver(entries => {
                entries.forEach(entry => {
                    if (!entry.isIntersecting) return;

                    navLinks.forEach(link => {
                        const active = link.getAttribute("href") === `#${entry.target.id}`;
                        link.classList.toggle("is-active", active);

                        if (active) {
                            link.setAttribute("aria-current", "true");
                        } else {
                            link.removeAttribute("aria-current");
                        }
                    });
                });
            }, {
                // A thin band across the middle of the screen
                rootMargin: "-45% 0px -50% 0px"
            });

            sections.forEach(section => spy.observe(section));
        }
    }


    /* ======================================================
       START
    ====================================================== */

    function start() {
        safely("navigation", initNavigation);
        safely("carousel", initCarousel);
        safely("themes", initThemes);
        safely("theme carousel", initThemeCarousel);
        safely("scroll effects", initScrollEffects);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", start);
    } else {
        start();
    }
})();
