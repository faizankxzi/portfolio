const root = document.body;

function smoothScrollToY(targetY, duration = 900) {
  const startY = window.scrollY;
  const difference = targetY - startY;
  const startTime = performance.now();

  function easeInOutCubic(progress) {
    return progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;
  }

  function step(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easeInOutCubic(progress);

    window.scrollTo(0, startY + difference * easedProgress);

    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  }

  window.requestAnimationFrame(step);
}

function getHeaderOffset() {
  const header = document.querySelector(".site-header");

  if (!header) {
    return 96;
  }

  const headerStyles = window.getComputedStyle(header);
  const stickyTop = Number.parseFloat(headerStyles.top) || 0;

  return header.getBoundingClientRect().height + stickyTop + 20;
}

function getSectionScrollTarget(section) {
  return section.querySelector(".section-heading, .contact-card, .hero-copy") || section;
}

function scrollToSectionTarget(targetId) {
  if (targetId === "home") {
    smoothScrollToY(0, 950);
    return;
  }

  const targetSection = document.getElementById(targetId);
  if (!targetSection) {
    return;
  }

  const scrollTarget = getSectionScrollTarget(targetSection);
  const headerOffset = getHeaderOffset();
  const targetTop = scrollTarget.getBoundingClientRect().top + window.scrollY - headerOffset;
  smoothScrollToY(Math.max(targetTop, 0), 950);
}

function safeInit(task) {
  try {
    task();
  } catch (error) {
    console.error(error);
  }
}

safeInit(() => {
  const toggleButton = document.querySelector(".theme-toggle");

  function applyTheme(theme, persist = true) {
    root.dataset.theme = theme;
    toggleButton?.setAttribute("aria-pressed", String(theme === "dark"));
    if (persist) {
      localStorage.setItem("faizan-theme", theme);
    }
  }

  applyTheme("light", false);

  toggleButton?.addEventListener("click", () => {
    const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
  });
});

safeInit(() => {
  const revealElements = document.querySelectorAll(".reveal");

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );

    revealElements.forEach((element, index) => {
      element.style.transitionDelay = `${Math.min(index * 70, 320)}ms`;
      observer.observe(element);
    });
  } else {
    revealElements.forEach((element) => {
      element.classList.add("is-visible");
    });
  }
});

safeInit(() => {
  const railLinks = Array.from(document.querySelectorAll("[data-section-link]"));
  const topNavLinks = Array.from(document.querySelectorAll(".site-nav a[href^='#']"));
  const trackedSections = Array.from(document.querySelectorAll("main section[id]"));

  if ((!railLinks.length && !topNavLinks.length) || !trackedSections.length) {
    return;
  }

  let activeSectionId = "home";

  function setActiveSection(sectionId) {
    activeSectionId = sectionId;

    railLinks.forEach((link) => {
      const isActive = link.dataset.sectionLink === sectionId;
      link.classList.toggle("is-active", isActive);
      if (isActive) {
        link.setAttribute("aria-current", "true");
      } else {
        link.removeAttribute("aria-current");
      }
    });

    topNavLinks.forEach((link) => {
      const targetId = link.getAttribute("href")?.replace("#", "");
      const isActive = targetId === sectionId;
      if (isActive) {
        link.setAttribute("aria-current", "true");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  function toggleRailVisibility() {
    root.classList.toggle("rail-visible", window.scrollY > window.innerHeight * 0.35);
  }

  if ("IntersectionObserver" in window) {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visibleEntries.length) {
          setActiveSection(visibleEntries[0].target.id);
        }
      },
      {
        threshold: [0.2, 0.35, 0.55, 0.75],
        rootMargin: "-20% 0px -45% 0px",
      }
    );

    trackedSections.forEach((section) => sectionObserver.observe(section));
  } else {
    function updateActiveSectionFromScroll() {
      let closestSection = trackedSections[0];
      let smallestDistance = Number.POSITIVE_INFINITY;

      trackedSections.forEach((section) => {
        const distance = Math.abs(section.getBoundingClientRect().top - window.innerHeight * 0.24);
        if (distance < smallestDistance) {
          smallestDistance = distance;
          closestSection = section;
        }
      });

      if (closestSection) {
        setActiveSection(closestSection.id);
      }
    }

    window.addEventListener("scroll", updateActiveSectionFromScroll, { passive: true });
    updateActiveSectionFromScroll();
  }

  window.addEventListener("scroll", toggleRailVisibility, { passive: true });
  toggleRailVisibility();
  setActiveSection(activeSectionId);
});

safeInit(() => {
  const sectionLinks = Array.from(document.querySelectorAll('a[href^="#"]'));

  sectionLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const href = link.getAttribute("href");
      if (!href || href === "#") {
        return;
      }

      const targetId = href.replace("#", "");
      const targetElement = document.getElementById(targetId);

      if (!targetElement && targetId !== "home") {
        return;
      }

      event.preventDefault();
      scrollToSectionTarget(targetId);
    });
  });
});

safeInit(() => {
  const nav = document.querySelector(".site-nav");
  const shell = document.querySelector(".island-shell");

  if (!nav || !shell) {
    return;
  }

  function updateNavHint() {
    const hasOverflow = nav.scrollWidth > nav.clientWidth + 4;
    const hasMoved = nav.scrollLeft > 18;
    const isNearEnd = nav.scrollLeft + nav.clientWidth >= nav.scrollWidth - 18;
    shell.classList.toggle("nav-hint-hidden", !hasOverflow || hasMoved || isNearEnd);
  }

  nav.addEventListener("scroll", updateNavHint, { passive: true });
  window.addEventListener("resize", updateNavHint);
  updateNavHint();
});

safeInit(() => {
  function updateScrollHint() {
    root.classList.toggle("scroll-hint-hidden", window.scrollY > 72);
  }

  window.addEventListener("scroll", updateScrollHint, { passive: true });
  updateScrollHint();
});

safeInit(() => {
  const projectLinkCards = Array.from(document.querySelectorAll("[data-project-url]"));

  projectLinkCards.forEach((card) => {
    const openProjectLink = () => {
      const projectUrl = card.getAttribute("data-project-url");

      if (!projectUrl) {
        return;
      }

      window.open(projectUrl, "_blank", "noopener,noreferrer");
    };

    card.addEventListener("click", openProjectLink);
    card.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") {
        return;
      }

      event.preventDefault();
      openProjectLink();
    });
  });
});

safeInit(() => {
  const cursorDot = document.querySelector(".cursor-dot");
  const cursorRing = document.querySelector(".cursor-ring");
  const usesTouchPointer = window.matchMedia("(hover: none), (pointer: coarse)").matches;

  if (!cursorDot || !cursorRing || usesTouchPointer) {
    return;
  }

  root.classList.add("cursor-enabled");
  root.classList.add("cursor-visible");

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let ringX = mouseX;
  let ringY = mouseY;
  let dotX = mouseX;
  let dotY = mouseY;
  let animationStarted = false;

  const interactiveSelector = "a, button, .card";

  cursorDot.style.opacity = "1";
  cursorRing.style.opacity = "1";
  cursorDot.style.transform = `translate3d(${dotX}px, ${dotY}px, 0) translate(-50%, -50%)`;
  cursorRing.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;

  function renderCursor() {
    dotX += (mouseX - dotX) * 0.35;
    dotY += (mouseY - dotY) * 0.35;
    ringX += (mouseX - ringX) * 0.16;
    ringY += (mouseY - ringY) * 0.16;

    cursorDot.style.transform = `translate3d(${dotX}px, ${dotY}px, 0) translate(-50%, -50%)`;
    cursorRing.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;

    window.requestAnimationFrame(renderCursor);
  }

  function startCursor() {
    if (animationStarted) {
      return;
    }

    animationStarted = true;
    window.requestAnimationFrame(renderCursor);
  }

  function handlePointerMove(event) {
    if (event.pointerType && event.pointerType !== "mouse") {
      return;
    }

    startCursor();
    mouseX = event.clientX;
    mouseY = event.clientY;
    root.classList.add("cursor-visible");
  }

  function handleHoverState(event) {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    root.classList.toggle("cursor-hover", Boolean(target.closest(interactiveSelector)));
  }

  window.addEventListener("pointermove", handlePointerMove);
  window.addEventListener("mousemove", handlePointerMove);
  document.addEventListener("mouseover", handleHoverState);
  window.addEventListener("mousedown", () => root.classList.add("cursor-hover"));
  window.addEventListener("mouseup", () => root.classList.remove("cursor-hover"));
});
