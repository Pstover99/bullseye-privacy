/* Bullseye Ballistics site. One script for every page, and every page works without it:
 * a carousel is still a row you can swipe, the showcase still shows its first screen, and a
 * screenshot is still an image. The script adds the controls on top.
 *
 *   [data-carousel]  a row of screens with arrows, dots and a counter
 *   [data-showcase]  the home page's feature tabs beside one phone frame
 *   #sagitta-hero    the Sagitta slides at the top of the home page
 *   .frame img       tap any screenshot to see it full size; arrows step through its group
 *   .tour-links      the feature tour's bar marks the section on screen
 *   .bb-tech         Under the Hood: draws the wind charts and the drift diagram
 *   .gn              the site nav: dropdowns on wide screens, the Menu button on phones
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
    // Step from where the row actually sits. At the end of the row the counter shows the last
    // screen, but the row can't scroll as far as the screen before it, so "current - 1" would
    // ask for a place it can't reach and Back would do nothing.
    bar.querySelector(".prev").addEventListener("click", () => {
      const left = track.scrollLeft;
      let i = 0;
      slides.forEach((_, k) => { if (stop(k) < left - 4) i = k; });
      go(i);
    });
    bar.querySelector(".next").addEventListener("click", () => {
      const left = track.scrollLeft;
      const i = slides.findIndex((_, k) => stop(k) > left + 4);
      go(i < 0 ? slides.length - 1 : i);
    });
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
      // A link that belongs to one tab, shown while that tab is.
      root.querySelectorAll("[data-tab]").forEach((l) => { l.hidden = l.dataset.tab !== tabs[i].id; });
      const now = root.querySelector(".sc-now");
      if (now) now.innerHTML = tabs[i].querySelector(".sc-desc").innerHTML; // keeps any bold
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

  /* Sagitta slides: they move on by themselves, and hold still while the mouse or a finger is
     on them, while one has focus, while they are off screen or the tab is hidden, and for
     anyone who has asked for reduced motion. data-interval is each slide's time in ms. */
  function sagitta(root) {
    const INTERVAL = parseInt(root.dataset.interval, 10) || 8000;
    const track = root.querySelector(".sg-track");
    const slides = [...root.querySelectorAll(".sg-slide")];
    const bar = root.querySelector(".sg-progress span");
    const pauseBtn = root.querySelector(".sg-pause");
    const n = slides.length;
    let idx = 0, userPaused = reduced.matches;
    let hovering = false, focusInside = false, touching = false, inView = true;
    let elapsed = 0, last = performance.now();
    const dots = slides.map((s, i) => {
      s.setAttribute("aria-label", `${i + 1} of ${n}`);
      const b = document.createElement("button");
      b.type = "button";
      b.className = "sg-dot";
      b.setAttribute("aria-label", `Go to slide ${i + 1}`);
      b.addEventListener("click", () => go(i));
      root.querySelector(".sg-dots").append(b);
      return b;
    });
    const go = (i) => {
      idx = (i + n) % n;
      track.style.transform = `translate3d(${-idx * 100}%,0,0)`;
      slides.forEach((s, k) => {
        s.setAttribute("aria-hidden", k === idx ? "false" : "true");
        s.inert = k !== idx;
      });
      dots.forEach((d, k) => d.setAttribute("aria-current", k === idx ? "true" : "false"));
      elapsed = 0;
      bar.style.transform = "scaleX(0)";
    };
    const syncPause = () => {
      root.classList.toggle("sg-paused", userPaused);
      pauseBtn.setAttribute("aria-label", userPaused ? "Start automatic slide show" : "Pause automatic slide show");
      track.setAttribute("aria-live", userPaused ? "polite" : "off");
    };
    const tick = (t) => {
      const dt = Math.min(t - last, 100);
      last = t;
      if (!userPaused && !hovering && !focusInside && !touching && inView && !document.hidden) {
        elapsed += dt;
        bar.style.transform = `scaleX(${Math.min(elapsed / INTERVAL, 1)})`;
        if (elapsed >= INTERVAL) go(idx + 1);
      }
      requestAnimationFrame(tick);
    };
    root.querySelector(".sg-next").addEventListener("click", () => go(idx + 1));
    root.querySelector(".sg-prev").addEventListener("click", () => go(idx - 1));
    pauseBtn.addEventListener("click", () => { userPaused = !userPaused; syncPause(); });
    root.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") hovering = true; });
    root.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") hovering = false; });
    root.addEventListener("focusin", () => { focusInside = true; });
    root.addEventListener("focusout", () => { focusInside = false; });
    root.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") go(idx + 1);
      else if (e.key === "ArrowLeft") go(idx - 1);
    });
    // Swipe with a finger or pen.
    let x0 = null, y0 = null;
    track.addEventListener("pointerdown", (e) => {
      if (e.pointerType === "mouse") return;
      x0 = e.clientX; y0 = e.clientY; touching = true;
    });
    track.addEventListener("pointerup", (e) => {
      if (x0 === null) return;
      const dx = e.clientX - x0, dy = e.clientY - y0;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) go(idx + (dx < 0 ? 1 : -1));
      x0 = y0 = null;
      touching = false;
    });
    track.addEventListener("pointercancel", () => { x0 = y0 = null; touching = false; });
    // Only run while it is on screen.
    new IntersectionObserver(([e]) => { inView = e.isIntersecting; }, { threshold: 0.25 }).observe(root);
    go(0);
    syncPause();
    requestAnimationFrame(tick);
  }
  const sagittaHero = document.getElementById("sagitta-hero");
  if (sagittaHero) sagitta(sagittaHero);

  /* External Display simulator: the footer becomes a level bar once the cant passes half a
     degree, shows LEVEL briefly when it is back within 0.4, then returns. The angle in the header
     turns amber while it moves and gray once it would have been sent, and the holds are then
     solved again for it. Same states, timings and solver as the owner's mockup of the display
     (External HUD/StickS3/sticks3_hud_with_level_bar.html). */

  // Point-mass G7 solver for the sim's load. The trajectory is integrated in the line-of-sight
  // frame with gravity resolved by the shooting angle, so uphill and downhill holds come from the
  // real trajectory.
  const HUD_LOAD = { mv: 2710, bc: 0.326, sh: 1.75, zero: 100, sg: 1.75 }, HUD_RANGE_YD = 1024, HUD_WIND_MPH = 7, HUD_WIND_CLOCK = 3;
  const G7 = [[0,.1198],[.05,.1197],[.1,.1196],[.15,.1194],[.2,.1193],[.25,.1194],[.3,.1194],[.35,.1194],[.4,.1193],[.45,.1193],[.5,.1194],[.55,.1193],[.6,.1194],[.65,.1197],[.7,.1202],[.725,.1207],[.75,.1215],[.775,.1226],[.8,.1242],[.825,.1266],[.85,.1306],[.875,.1368],[.9,.1464],[.925,.166],[.95,.2054],[.975,.2993],[1,.3803],[1.025,.4015],[1.05,.4043],[1.075,.4034],[1.1,.4014],[1.125,.3987],[1.15,.3955],[1.2,.3884],[1.25,.381],[1.3,.3732],[1.35,.3657],[1.4,.358],[1.5,.344],[1.55,.3376],[1.6,.3315],[1.65,.326],[1.7,.3209],[1.75,.316],[1.8,.3117],[1.85,.3078],[1.9,.3042],[1.95,.301],[2,.298],[2.05,.2951],[2.1,.2922],[2.15,.2892],[2.2,.2864],[2.25,.2835],[2.3,.2807],[2.35,.2779],[2.4,.2752],[2.45,.2725],[2.5,.2697],[2.55,.267],[2.6,.2643],[2.65,.2615],[2.7,.2588],[2.75,.2561],[2.8,.2533],[2.85,.2506],[2.9,.2479],[2.95,.2451],[3,.2424]];
  const IN = 0.0254, YD = 0.9144, FPS = 0.3048, MPH = 0.44704, GRAV = 9.80665, SOS = 340.29, RHO = 1.225;
  const cdG7 = (m) => {
    if (m >= 3) return 0.2424;
    let i = 1;
    while (G7[i][0] < m) i++;
    const [a, b] = G7[i - 1], [c, d] = G7[i];
    return b + (d - b) * (m - a) / (c - a);
  };
  const fly = (launch, angDeg, R, cross) => {
    const k = RHO * (Math.PI / 8) * (IN * IN / 0.45359237) / HUD_LOAD.bc, ph = angDeg * Math.PI / 180;
    const gx = -GRAV * Math.sin(ph), gy = -GRAV * Math.cos(ph), dt = 0.0005;
    let x = 0, y = -HUD_LOAD.sh * IN, z = 0, vx = HUD_LOAD.mv * FPS * Math.cos(launch), vy = HUD_LOAD.mv * FPS * Math.sin(launch), vz = 0, t = 0;
    while (true) {
      const rz = vz + cross, vr = Math.hypot(vx, vy, rz), a = k * cdG7(vr / SOS) * vr, px = x, py = y, pz = z, pt = t;
      vx += (-a * vx + gx) * dt; vy += (-a * vy + gy) * dt; vz += (-a * rz) * dt;
      x += vx * dt; y += vy * dt; z += vz * dt; t += dt;
      if (x >= R) {
        const f = (R - px) / (x - px);
        return { y: py + (y - py) * f, z: pz + (z - pz) * f, t: pt + (t - pt) * f, v: Math.hypot(vx, vy, vz) };
      }
    }
  };
  let zeroLaunch = null;
  const hudSolve = (angDeg) => {
    if (zeroLaunch === null) {
      let lo = -0.01, hi = 0.02;
      for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; fly(m, 0, HUD_LOAD.zero * YD, 0).y > 0 ? hi = m : lo = m; }
      zeroLaunch = (lo + hi) / 2;
    }
    const R = HUD_RANGE_YD * YD, cross = HUD_WIND_MPH * MPH * Math.sin(HUD_WIND_CLOCK / 12 * 2 * Math.PI), r = fly(zeroLaunch, angDeg, R, cross);
    const spin = 1.25 * (HUD_LOAD.sg + 1.2) * Math.pow(r.t, 1.83) * IN;
    return { elev: -r.y / R * 1000, wind: -(r.z + spin) / R * 1000, tof: r.t, vel: r.v / FPS };
  };

  function hudSim(root) {
    const $ = (k) => root.querySelector(`[data-${k}]`);
    const cs = $("cant"), as = $("angle"), foot = $("foot"), bar = $("bar"), msg = $("msg"), mk = $("mk"), lb = $("lb"), ang = $("ang");
    let state = "FOOTER", enterT = null, confT = null, sendT = null, msgT = null, sent = 3.1;
    const fmtA = (v) => (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(v).toFixed(1) + "°";
    const level = hudSolve(0);
    const holds = (angDeg) => {
      const h = hudSolve(angDeg);
      $("ev").textContent = h.elev.toFixed(2);
      $("wv").textContent = Math.abs(h.wind).toFixed(2);
      $("wa").textContent = h.wind < 0 ? "◀" : "▶";
      $("fv").textContent = Math.round(h.vel) + " fps";
      $("ft").textContent = h.tof.toFixed(2) + " s";
      const d = h.elev - level.elev;
      $("cmp").textContent = Math.abs(angDeg) < 0.05
        ? `Level ground: elevation ${level.elev.toFixed(2)} mil at ${HUD_RANGE_YD} yd`
        : `At ${fmtA(angDeg)}: elevation ${h.elev.toFixed(2)} mil vs ${level.elev.toFixed(2)} mil on level ground (${Math.abs(d) < 0.005 ? "" : d < 0 ? "−" : "+"}${Math.abs(d).toFixed(2)} mil)`;
    };
    const show = () => {
      if (msgT) { foot.hidden = true; bar.hidden = true; msg.hidden = false; return; }
      msg.hidden = true;
      foot.hidden = state !== "FOOTER";
      bar.hidden = state === "FOOTER";
    };
    const drawBar = () => {
      const v = parseFloat(cs.value), a = Math.abs(v);
      mk.style.left = `calc(${50 + Math.max(-1, Math.min(1, v / 5)) * 44}% - 9 * var(--u))`;
      let c, t;
      if (state === "LEVEL_CONFIRM") { c = "#97C459"; t = "LEVEL"; }
      else { c = a <= 1.5 ? "#EF9F27" : "#E24B4A"; t = v < 0 ? "◀ " + a.toFixed(1) + "°" : a.toFixed(1) + "° ▶"; }
      mk.style.background = c;
      lb.style.color = c;
      lb.textContent = t;
    };
    const cant = () => {
      const v = parseFloat(cs.value), a = Math.abs(v);
      $("co").textContent = (v > 0 ? "R " : v < 0 ? "L " : "") + a.toFixed(1) + "°";
      if (state === "FOOTER") {
        if (a > 0.5) {
          if (!enterT) enterT = setTimeout(() => {
            enterT = null;
            if (Math.abs(parseFloat(cs.value)) > 0.5) { state = "LEVEL_BAR"; drawBar(); show(); }
          }, 150);
        } else { clearTimeout(enterT); enterT = null; }
      } else if (state === "LEVEL_BAR") {
        if (a <= 0.4) { state = "LEVEL_CONFIRM"; confT = setTimeout(() => { state = "FOOTER"; show(); }, 700); }
      } else if (state === "LEVEL_CONFIRM") {
        if (a > 0.5) { clearTimeout(confT); state = "LEVEL_BAR"; }
      }
      drawBar();
      show();
    };
    const angle = () => {
      const v = parseFloat(as.value);
      $("ao").textContent = fmtA(v);
      ang.textContent = fmtA(v);
      ang.style.color = Math.abs(v - sent) >= 0.5 ? "#EF9F27" : "#D3D1C7";
      clearTimeout(sendT);
      sendT = setTimeout(() => { sent = v; ang.style.color = "#D3D1C7"; holds(v); }, 600);
    };
    const flash = (t, c) => {
      clearTimeout(msgT);
      msg.textContent = t;
      msg.style.color = c;
      msgT = setTimeout(() => { msgT = null; show(); }, 1000);
      show();
    };
    $("zero").addEventListener("click", () => {
      const c = Math.abs(parseFloat(cs.value)), a = Math.abs(parseFloat(as.value));
      if (c <= 10 && a <= 10) {
        cs.value = 0; as.value = 0;
        clearTimeout(confT); clearTimeout(enterT); enterT = null;
        state = "FOOTER"; sent = 0;
        cant(); angle();
        flash("ZEROED", "#97C459");
      } else flash("ZERO FAILED", "#E24B4A");
    });
    cs.addEventListener("input", cant);
    as.addEventListener("input", angle);
    cant();
    angle();
    holds(sent);
  }
  document.querySelectorAll("[data-hud-sim]").forEach(hudSim);

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

  /* Under the Hood: the charts are drawn here so their numbers come from the same constants.
     The smoothing time constants are the app's defaults (WindSmoothingLevel in AppSettings.kt):
     Responsive (alpha 0.50) for 0-500 yd and Smooth (alpha 0.30) for 1,000-1,500 yd, at the
     Calypso's 1 Hz, tau = -1 / ln(1 - alpha). */
  const tech = document.querySelector(".bb-tech");
  if (tech) {
    const NS = "http://www.w3.org/2000/svg";
    const TAU_NEAR = -1 / Math.log(1 - 0.5), TAU_FAR = -1 / Math.log(1 - 0.3);
    const el = (tag, attrs, parent) => {
      const e = document.createElementNS(NS, tag);
      for (const k in attrs) e.setAttribute(k, attrs[k]);
      if (parent) parent.appendChild(e);
      return e;
    };
    const txt = (parent, x, y, s, attrs) => {
      const t = el("text", Object.assign({ x, y }, attrs || {}), parent);
      t.textContent = s;
      return t;
    };

    // Compass ticks.
    const ticks = document.getElementById("bb-ticks");
    for (let d = 0; d < 360; d += 10) {
      const a = d * Math.PI / 180, r1 = d % 90 === 0 ? 114 : 121;
      el("line", { x1: 160 + r1 * Math.sin(a), y1: 160 - r1 * Math.cos(a), x2: 160 + 128 * Math.sin(a), y2: 160 - 128 * Math.cos(a), "stroke-width": d % 90 === 0 ? 2 : 1 }, ticks);
    }

    // Raw against smoothed wind: an illustrative gusty trace, smoothed at both time constants.
    (() => {
      const svg = document.getElementById("bb-ema");
      const W = 760, H = 290, L = 48, R = 16, T = 14, B = 34, T_END = 30, Y_MAX = 18, DT = 0.1;
      let seed = 7;
      const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      const gusts = [[5.5, 5, 0.7], [12.5, 3.5, 1.4], [16, -3.5, 1.0], [22.5, 6.5, 0.6], [26.5, 3, 0.9]];
      const raw = [], near = [], far = [];
      const an = 1 - Math.exp(-DT / TAU_NEAR), af = 1 - Math.exp(-DT / TAU_FAR);
      let n = 0;
      for (let i = 0; i <= T_END / DT; i++) {
        const t = i * DT;
        let v = 8 + 1.5 * Math.sin(2 * Math.PI * t / 22);
        gusts.forEach((g) => { v += g[1] * Math.exp(-Math.pow((t - g[0]) / g[2], 2)); });
        n = 0.75 * n + 1.1 * (rnd() * 2 - 1);
        v = Math.max(0.5, v + n);
        raw.push(v);
        near.push(i ? near[i - 1] + an * (v - near[i - 1]) : v);
        far.push(i ? far[i - 1] + af * (v - far[i - 1]) : v);
      }
      const X = (t) => L + t / T_END * (W - L - R);
      const Y = (v) => T + (1 - v / Y_MAX) * (H - T - B);
      for (let y = 0; y <= Y_MAX; y += 3) {
        el("line", { x1: L, x2: W - R, y1: Y(y), y2: Y(y), stroke: "var(--bb-line)" }, svg);
        txt(svg, L - 8, Y(y) + 4, y, { "text-anchor": "end" });
      }
      for (let s = 5; s <= T_END; s += 5) txt(svg, X(s), H - 12, s + " s", { "text-anchor": "middle" });
      txt(svg, L - 8, H - 12, "mph", { "text-anchor": "end" });
      const path = (arr, color, w) => {
        const d = arr.map((v, i) => (i ? "L" : "M") + X(i * DT).toFixed(1) + " " + Y(v).toFixed(1)).join("");
        el("path", { d, fill: "none", stroke: color, "stroke-width": w, "stroke-linejoin": "round" }, svg);
      };
      path(raw, "var(--bb-raw)", 1.5);
      path(near, "var(--bb-near)", 2.5);
      path(far, "var(--bb-accent)", 3.5);
      const gi = Math.round(22.5 / DT);
      el("line", { x1: X(22.5), x2: X(22.5), y1: Y(raw[gi]) - 6, y2: Y(raw[gi]) - 26, stroke: "var(--bb-muted)" }, svg);
      txt(svg, X(22.5), Y(raw[gi]) - 32, "gust: on screen instantly", { "text-anchor": "middle", class: "bb-strong" });
    })();

    // How much each second of past wind counts toward the hold, with the range switch.
    (() => {
      const svg = document.getElementById("bb-weights");
      const W = 760, H = 250, L = 48, R = 16, T = 30, B = 34, N = 10, MAX = 0.65;
      const draw = (tau) => {
        while (svg.firstChild) svg.removeChild(svg.firstChild);
        const w = [];
        for (let k = 0; k < N; k++) w.push(Math.exp(-k / tau) - Math.exp(-(k + 1) / tau));
        const slot = (W - L - R) / N, bw = slot * 0.62;
        const Y = (v) => T + (1 - v / MAX) * (H - T - B);
        [0, 0.2, 0.4, 0.6].forEach((v) => {
          el("line", { x1: L, x2: W - R, y1: Y(v), y2: Y(v), stroke: "var(--bb-line)" }, svg);
          txt(svg, L - 8, Y(v) + 4, Math.round(v * 100) + "%", { "text-anchor": "end" });
        });
        let cum = 0, cut = 0;
        w.forEach((v, k) => {
          cum += v;
          const x = L + k * slot + (slot - bw) / 2;
          el("rect", { x, y: Y(v), width: bw, height: Y(0) - Y(v), fill: k < 5 ? "var(--bb-accent)" : "var(--bb-raw)" }, svg);
          txt(svg, x + bw / 2, Y(v) - 6, (v * 100).toFixed(v < 0.1 ? 1 : 0) + "%", { "text-anchor": "middle", class: k === 0 ? "bb-strong" : "" });
          txt(svg, x + bw / 2, H - 12, k === 0 ? "newest" : k + " s ago", { "text-anchor": "middle" });
          if (k === 4) cut = cum;
        });
        const xr = L + 5 * slot;
        el("line", { x1: xr, x2: xr, y1: T - 18, y2: Y(0), stroke: "var(--bb-fg)", "stroke-dasharray": "4 4" }, svg);
        txt(svg, xr - 8, T - 6, "last 5 s: " + Math.round(cut * 100) + "% of the hold", { "text-anchor": "end", class: "bb-strong" });
      };
      const btns = tech.querySelectorAll(".bb-toggle button");
      btns.forEach((b) => b.addEventListener("click", () => {
        btns.forEach((o) => o.setAttribute("aria-pressed", o === b ? "true" : "false"));
        draw(b.dataset.band === "near" ? TAU_NEAR : TAU_FAR);
      }));
      draw(TAU_FAR);
    })();

    // Drift to hold: drift grows with flight time, then wind drift, spin drift and the zero
    // offset stack at the target.
    (() => {
      const svg = document.getElementById("bb-drift");
      const X0 = 60, X1 = 640, Y0 = 250, DRIFT = 150, K = 0.8, WIND = 0.82;
      const defs = el("defs", {}, svg);
      const m = el("marker", { id: "bb-ah3", viewBox: "0 0 10 10", refX: 8, refY: 5, markerWidth: 7, markerHeight: 7, orient: "auto-start-reverse" }, defs);
      el("path", { d: "M0 0L10 5L0 10z", fill: "context-stroke" }, m);
      [140, 260, 380, 500].forEach((x) => {
        el("line", { x1: x, y1: 292, x2: x, y2: 270, stroke: "var(--bb-near)", "stroke-width": 2, opacity: 0.55, "marker-end": "url(#bb-ah3)" }, svg);
      });
      el("line", { x1: X0, y1: Y0, x2: X1 + 40, y2: Y0, stroke: "var(--bb-muted)", "stroke-dasharray": "2 5" }, svg);
      txt(svg, X1 + 40, Y0 + 18, "line of sight", { "text-anchor": "end" });
      // Lag: time of flight minus the vacuum time, normalized.
      const lag = (u) => (Math.exp(K * u) - 1) / K - u;
      const LMAX = lag(1);
      const yAt = (u) => Y0 - lag(u) / LMAX * DRIFT * WIND;
      let d = "";
      for (let i = 0; i <= 100; i++) {
        const u = i / 100;
        d += (i ? "L" : "M") + (X0 + u * (X1 - X0)).toFixed(1) + " " + yAt(u).toFixed(1);
      }
      el("path", { d, fill: "none", stroke: "var(--bb-accent)", "stroke-width": 3 }, svg);
      [0.25, 0.5, 0.75].forEach((u) => {
        const x = X0 + u * (X1 - X0);
        el("line", { x1: x, x2: x, y1: Y0, y2: yAt(u), stroke: "var(--bb-accent)", "stroke-width": 1, opacity: 0.5 }, svg);
        txt(svg, x, Y0 + 18, Math.round(u * 100) + "% of range", { "text-anchor": "middle" });
      });
      const yW = Y0 - DRIFT * WIND, ySp = yW - DRIFT * 0.1, yZ = ySp - DRIFT * 0.08;
      const seg = (y1, y2, color, label) => {
        el("line", { x1: X1 + 26, x2: X1 + 26, y1, y2, stroke: color, "stroke-width": 8 }, svg);
        txt(svg, X1 + 38, (y1 + y2) / 2 + 4, label, {});
      };
      seg(Y0, yW, "var(--bb-accent)", "wind drift");
      seg(yW, ySp, "var(--bb-near)", "spin drift");
      seg(ySp, yZ, "var(--bb-muted)", "zero offset");
      el("circle", { cx: X0, cy: Y0, r: 6, fill: "var(--bb-fg)" }, svg);
      txt(svg, X0, Y0 + 18, "muzzle", { "text-anchor": "middle" });
      el("circle", { cx: X1, cy: Y0, r: 10, fill: "none", stroke: "var(--bb-fg)", "stroke-width": 2 }, svg);
      el("line", { x1: X0, y1: Y0, x2: X1, y2: yZ, stroke: "var(--bb-fg)", "stroke-width": 1.5, "stroke-dasharray": "6 4" }, svg);
      const ang = Math.atan2(Y0 - yZ, X1 - X0), rA = 120;
      el("path", { d: "M" + (X0 + rA) + " " + Y0 + " A " + rA + " " + rA + " 0 0 0 " + (X0 + rA * Math.cos(ang)).toFixed(1) + " " + (Y0 - rA * Math.sin(ang)).toFixed(1), fill: "none", stroke: "var(--bb-fg)", "stroke-width": 1.5 }, svg);
      txt(svg, X0 + rA + 8, Y0 - 4, "hold", { class: "bb-disp" });
    })();
  }
})();

// Grouped site nav: dropdowns on wide screens, a full menu on phones.
(function () {
  var bar = document.querySelector('.gn');
  if (!bar) return;
  var toggle = bar.querySelector('.gn-toggle');
  var groups = Array.prototype.slice.call(bar.querySelectorAll('.gn-group'));
  var hover = window.matchMedia('(hover: hover) and (min-width: 901px)');

  function closeGroups(except) {
    groups.forEach(function (g) {
      if (g === except) return;
      g.classList.remove('gn-show');
      g.querySelector('button').setAttribute('aria-expanded', 'false');
    });
  }
  function setMenu(open) {
    bar.classList.toggle('gn-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    document.documentElement.classList.toggle('gn-lock', open);
  }

  groups.forEach(function (g) {
    var btn = g.querySelector('button');
    var leaving = 0;
    btn.addEventListener('click', function (e) {
      var open = !g.classList.contains('gn-show');
      // With a mouse, hovering already opened it: a click on the button (e.detail is 0 for a
      // keyboard press) would close the panel just as the pointer heads for its links.
      if (!open && hover.matches && e.detail > 0) return;
      closeGroups(g);
      g.classList.toggle('gn-show', open);
      btn.setAttribute('aria-expanded', String(open));
    });
    g.addEventListener('mouseenter', function () {
      if (!hover.matches) return;
      clearTimeout(leaving);
      closeGroups(g);
      g.classList.add('gn-show');
      btn.setAttribute('aria-expanded', 'true');
    });
    // A short grace period, so a pointer that cuts a corner on its way to a link doesn't close it.
    g.addEventListener('mouseleave', function () {
      if (!hover.matches) return;
      leaving = setTimeout(function () {
        g.classList.remove('gn-show');
        btn.setAttribute('aria-expanded', 'false');
      }, 250);
    });
  });

  toggle.addEventListener('click', function () { setMenu(!bar.classList.contains('gn-open')); });
  // A link to a section of the page you're on doesn't load a new page, so close the menu for it.
  bar.addEventListener('click', function (e) {
    if (!e.target.closest('a')) return;
    closeGroups();
    if (bar.classList.contains('gn-open')) setMenu(false);
  });

  document.addEventListener('click', function (e) { if (!bar.contains(e.target)) closeGroups(); });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    closeGroups();
    if (bar.classList.contains('gn-open')) { setMenu(false); toggle.focus(); }
  });
  window.addEventListener('resize', function () { if (window.innerWidth > 900) setMenu(false); });
})();
