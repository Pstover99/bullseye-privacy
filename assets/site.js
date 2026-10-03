/* Bullseye Ballistics site. One script for every page, and every page works without it:
 * a carousel is still a row you can swipe, the showcase still shows its first screen, and a
 * screenshot is still an image. The script adds the controls on top.
 *
 *   [data-carousel]  a row of screens with arrows, dots and a counter
 *   [data-showcase]  the home page's feature tabs beside one phone frame
 *   .frame img       tap any screenshot to see it full size; arrows step through its group
 *   .tour-links      the feature tour's bar marks the section on screen
 */
(() => {
  "use strict";
  document.documentElement.classList.add("js");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const pad = (n) => String(n).padStart(2, "0");

  /* Carousel: the track is a native scroll-snap row, so touch, trackpad and keyboard
     scrolling all work; the buttons and dots only drive and follow that scroll. */
  function carousel(root) {
    const track = root.querySelector(".track");
    const slides = [...track.children];
    if (slides.length < 2) return;
    const bar = document.createElement("div");
    bar.className = "car-bar";
    bar.innerHTML =
      '<button class="car-btn prev" type="button" aria-label="Previous screen"></button>' +
      '<div class="car-dots" role="group" aria-label="Choose a screen"></div>' +
      '<span class="car-count label" aria-live="polite"></span>' +
      '<button class="car-btn next" type="button" aria-label="Next screen"></button>';
    root.append(bar);
    const dots = bar.querySelector(".car-dots");
    const count = bar.querySelector(".car-count");
    slides.forEach((s, i) => {
      const d = document.createElement("button");
      d.type = "button";
      const name = s.querySelector("figcaption .label");
      d.setAttribute("aria-label", `Screen ${i + 1}${name ? ": " + name.textContent : ""}`);
      d.addEventListener("click", () => go(i));
      dots.append(d);
    });
    let current = 0;
    // Where slide i sits when it is the first one in view.
    const stop = (i) => slides[i].offsetLeft - slides[0].offsetLeft;
    const go = (i) => {
      i = Math.max(0, Math.min(slides.length - 1, i));
      track.scrollTo({ left: stop(i), behavior: reduced.matches ? "auto" : "smooth" });
    };
    const sync = () => {
      const left = track.scrollLeft;
      const atEnd = left + track.clientWidth >= track.scrollWidth - 4;
      let best = 0;
      slides.forEach((_, i) => { if (Math.abs(stop(i) - left) < Math.abs(stop(best) - left)) best = i; });
      // At the end of the row the last screen is the one just brought in, not the leftmost.
      current = atEnd && left > 4 ? slides.length - 1 : best;
      [...dots.children].forEach((d, i) => d.setAttribute("aria-current", i === current ? "true" : "false"));
      count.textContent = `${pad(current + 1)} / ${pad(slides.length)}`;
      bar.querySelector(".prev").disabled = left <= 4;
      bar.querySelector(".next").disabled = atEnd;
      root.classList.toggle("fits", track.scrollWidth <= track.clientWidth + 4);
    };
    bar.querySelector(".prev").addEventListener("click", () => go(current - 1));
    bar.querySelector(".next").addEventListener("click", () => go(current + 1));
    let raf = 0;
    track.addEventListener("scroll", () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(sync); }, { passive: true });
    addEventListener("resize", sync);
    track.querySelectorAll("img").forEach((img) => img.complete || img.addEventListener("load", sync, { once: true }));
    sync();
  }
  document.querySelectorAll("[data-carousel]").forEach(carousel);

  /* Showcase: one tab per feature, one screen per tab. It moves on by itself until the visitor
     touches it, and never moves for anyone who has asked for reduced motion. */
  function showcase(root) {
    const tabs = [...root.querySelectorAll("[role=tab]")];
    const panes = [...root.querySelectorAll("[role=tabpanel]")];
    const DWELL = 6000;
    let i = 0, timer = 0, stopped = reduced.matches;
    const show = (n, focus) => {
      i = (n + tabs.length) % tabs.length;
      tabs.forEach((t, k) => {
        t.setAttribute("aria-selected", k === i ? "true" : "false");
        t.tabIndex = k === i ? 0 : -1;
      });
      panes.forEach((p, k) => p.classList.toggle("on", k === i));
      const now = root.querySelector(".sc-now");
      if (now) now.textContent = tabs[i].querySelector(".sc-desc").textContent;
      if (focus) tabs[i].focus();
      const strip = root.querySelector(".sc-tabs");
      if (strip.scrollWidth > strip.clientWidth) {
        strip.scrollTo({ left: tabs[i].offsetLeft - strip.offsetLeft - 16, behavior: reduced.matches ? "auto" : "smooth" });
      }
      schedule();
    };
    const schedule = () => {
      clearTimeout(timer);
      root.classList.toggle("auto", !stopped);
      root.style.setProperty("--dwell", DWELL + "ms");
      tabs.forEach((t) => t.classList.remove("run"));
      if (stopped) return;
      void tabs[i].offsetWidth; // restart the progress bar's animation
      tabs[i].classList.add("run");
      timer = setTimeout(() => show(i + 1), DWELL);
    };
    const stop = () => { if (!stopped) { stopped = true; schedule(); } };
    tabs.forEach((t, k) => t.addEventListener("click", () => { stop(); show(k); }));
    root.querySelector(".sc-tabs").addEventListener("keydown", (e) => {
      const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
      if (e.key === "Home") { e.preventDefault(); stop(); show(0, true); }
      else if (e.key === "End") { e.preventDefault(); stop(); show(tabs.length - 1, true); }
      else if (step) { e.preventDefault(); stop(); show(i + step, true); }
    });
    root.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") clearTimeout(timer), tabs[i].classList.add("paused"); });
    root.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") tabs[i].classList.remove("paused"), stopped || (timer = setTimeout(() => show(i + 1), DWELL / 2)); });
    // Swipe the phone to step through.
    const stage = root.querySelector(".sc-stage");
    let x0 = null;
    stage.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; }, { passive: true });
    stage.addEventListener("touchend", (e) => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0;
      x0 = null;
      if (Math.abs(dx) > 40) { stop(); show(i + (dx < 0 ? 1 : -1)); }
    });
    root.querySelector(".sc-prev")?.addEventListener("click", () => { stop(); show(i - 1); });
    root.querySelector(".sc-next")?.addEventListener("click", () => { stop(); show(i + 1); });
    // Only run while it is on screen.
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting) schedule(); else clearTimeout(timer);
    }, { threshold: 0.35 }).observe(root);
    show(0);
  }
  document.querySelectorAll("[data-showcase]").forEach(showcase);

  /* Lightbox: any screenshot opens full size. Arrows, swipe and the keyboard step through the
     other screens in the same group (a carousel, a showcase or a section). */
  const box = document.createElement("dialog");
  box.className = "lightbox";
  box.setAttribute("aria-label", "Screenshot");
  box.innerHTML =
    '<button class="lb-close" type="button" aria-label="Close"></button>' +
    '<button class="lb-btn prev" type="button" aria-label="Previous screenshot"></button>' +
    '<figure><img alt=""><figcaption><span class="label lb-count"></span><span class="lb-cap"></span></figcaption></figure>' +
    '<button class="lb-btn next" type="button" aria-label="Next screenshot"></button>';
  document.body.append(box);
  const lbImg = box.querySelector("img");
  let group = [], at = 0;
  const caption = (img) => {
    const pane = img.closest("[role=tabpanel]");
    const tab = pane && document.getElementById(pane.getAttribute("aria-labelledby"));
    if (tab) return tab.querySelector(".sc-title").textContent + ". " + tab.querySelector(".sc-desc").textContent;
    const fig = img.closest("figure");
    const cap = fig && fig.querySelector("figcaption");
    if (!cap) return "";
    return [...cap.children].map((c) => c.textContent.trim().replace(/\.$/, "")).filter(Boolean).join(". ") + ".";
  };
  const render = () => {
    const img = group[at];
    lbImg.src = img.currentSrc || img.src;
    lbImg.alt = img.alt;
    box.querySelector(".lb-count").textContent = group.length > 1 ? `${pad(at + 1)} / ${pad(group.length)}` : "";
    box.querySelector(".lb-cap").textContent = caption(img);
    box.querySelectorAll(".lb-btn").forEach((b) => (b.hidden = group.length < 2));
  };
  const step = (d) => { at = (at + d + group.length) % group.length; render(); };
  document.addEventListener("click", (e) => {
    const img = e.target.closest(".frame img, .sc-stage img");
    if (!img || box.open) return;
    const scope = img.closest("[data-carousel], [data-showcase], .tour, section") || document;
    group = [...scope.querySelectorAll(".frame img, .sc-stage img")].filter((x, k, a) => a.findIndex((y) => y.src === x.src) === k);
    at = Math.max(0, group.findIndex((x) => x.src === img.src));
    render();
    box.showModal();
  });
  box.querySelector(".prev").addEventListener("click", () => step(-1));
  box.querySelector(".next").addEventListener("click", () => step(1));
  box.querySelector(".lb-close").addEventListener("click", () => box.close());
  box.addEventListener("click", (e) => { if (e.target === box) box.close(); });
  box.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") step(1);
    if (e.key === "ArrowLeft") step(-1);
  });
  let lx = null;
  box.addEventListener("touchstart", (e) => { lx = e.touches[0].clientX; }, { passive: true });
  box.addEventListener("touchend", (e) => {
    if (lx === null) return;
    const dx = e.changedTouches[0].clientX - lx;
    lx = null;
    if (Math.abs(dx) > 40) step(dx < 0 ? 1 : -1);
  });

  /* Feature tour: mark the section on screen in the sticky bar. */
  const links = [...document.querySelectorAll(".tour-links a")];
  if (links.length) {
    const byId = new Map(links.map((a) => [a.hash.slice(1), a]));
    const seen = new Map();
    const mark = () => {
      let best = null;
      seen.forEach((v, id) => {
        if (v.isIntersecting && (best === null || v.boundingClientRect.top < seen.get(best).boundingClientRect.top)) best = id;
      });
      if (!best) return;
      links.forEach((a) => a.removeAttribute("aria-current"));
      const a = byId.get(best);
      a.setAttribute("aria-current", "true");
      const strip = a.closest(".tour-links");
      const r = a.getBoundingClientRect(), s = strip.getBoundingClientRect();
      if (r.left < s.left || r.right > s.right) strip.scrollTo({ left: a.offsetLeft - strip.offsetLeft - 24, behavior: reduced.matches ? "auto" : "smooth" });
    };
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => seen.set(e.target.id, e));
      mark();
    }, { rootMargin: "-80px 0px -55% 0px" });
    byId.forEach((_, id) => { const el = document.getElementById(id); if (el) io.observe(el); });
  }
})();
