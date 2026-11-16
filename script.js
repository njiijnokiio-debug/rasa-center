/* ==========================================================================
   Центр «Раса» — интерактив лендинга
   Без зависимостей. Всё, что влияет на аналитику, собрано в CONFIG.
   ========================================================================== */

(function () {
  "use strict";

  const CONFIG = {
    // Номер счётчика Яндекс Метрики. Пока null — цели только пишутся в консоль.
    metrikaId: null
  };

  const header = document.getElementById("header");
  const burger = document.querySelector(".burger");
  const mobileMenu = document.getElementById("mobile-menu");
  const navLinks = Array.from(document.querySelectorAll(".nav__link"));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------------------------
     Аналитика
     ------------------------------------------------------------------------ */

  function trackGoal(goal) {
    if (!goal) return;
    if (typeof window.ym === "function" && CONFIG.metrikaId) {
      window.ym(CONFIG.metrikaId, "reachGoal", goal);
    }
    document.dispatchEvent(new CustomEvent("rasa:goal", { detail: { goal } }));
    if (CONFIG.metrikaId === null) {
      console.debug("[Раса] цель:", goal);
    }
  }

  document.addEventListener("click", function (event) {
    const target = event.target.closest("[data-goal]");
    if (target) trackGoal(target.dataset.goal);
  });

  /* ------------------------------------------------------------------------
     Шапка: тень при прокрутке, бургер, активный пункт меню
     ------------------------------------------------------------------------ */

  let lastScroll = 0;
  function onScrollHeader() {
    const y = window.scrollY;
    if (header) header.classList.toggle("is-scrolled", y > 12);
    lastScroll = y;
  }
  window.addEventListener("scroll", onScrollHeader, { passive: true });
  onScrollHeader();

  function closeMenu() {
    if (!mobileMenu || !burger) return;
    mobileMenu.hidden = true;
    burger.classList.remove("is-open");
    burger.setAttribute("aria-expanded", "false");
    burger.setAttribute("aria-label", "Открыть меню");
    document.body.classList.remove("menu-open");
  }

  function openMenu() {
    if (!mobileMenu || !burger) return;
    mobileMenu.hidden = false;
    burger.classList.add("is-open");
    burger.setAttribute("aria-expanded", "true");
    burger.setAttribute("aria-label", "Закрыть меню");
    document.body.classList.add("menu-open");
  }

  if (burger && mobileMenu) {
    burger.addEventListener("click", function () {
      if (mobileMenu.hidden) openMenu();
      else closeMenu();
    });

    mobileMenu.addEventListener("click", function (event) {
      if (event.target.closest("a")) closeMenu();
    });

    document.addEventListener("click", function (event) {
      if (mobileMenu.hidden) return;
      if (!event.target.closest(".site-header")) closeMenu();
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !mobileMenu.hidden) {
        closeMenu();
        burger.focus();
      }
    });

    let resizeTimer;
    window.addEventListener("resize", function () {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(function () {
        if (window.innerWidth > 1220) closeMenu();
      }, 120);
    });
  }

  // Скролл-спай: подсвечиваем раздел, который сейчас на экране
  const spySections = ["offline", "program", "life", "summer", "support", "contact"]
    .map(function (id) { return document.getElementById(id); })
    .filter(Boolean);

  let spyTicking = false;
  function updateActiveLink() {
    if (!spySections.length) return;
    const headerH = header ? header.offsetHeight : 76;
    const line = window.scrollY + headerH + Math.min(180, window.innerHeight * 0.28);
    let currentId = "";
    spySections.forEach(function (section) {
      if (section.offsetTop <= line) currentId = section.id;
    });
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
      currentId = "contact";
    }
    navLinks.forEach(function (link) {
      const active = link.getAttribute("href") === "#" + currentId;
      link.classList.toggle("is-active", active);
      if (active) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });
    spyTicking = false;
  }
  function requestSpy() {
    if (spyTicking) return;
    spyTicking = true;
    window.requestAnimationFrame(updateActiveLink);
  }
  window.addEventListener("scroll", requestSpy, { passive: true });
  window.addEventListener("resize", requestSpy);
  updateActiveLink();

  /* ------------------------------------------------------------------------
     Мягкое появление блоков
     ------------------------------------------------------------------------ */

  const revealItems = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    const revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    revealItems.forEach(function (item) { revealObserver.observe(item); });
  } else {
    revealItems.forEach(function (item) { item.classList.add("is-visible"); });
  }

  /* ------------------------------------------------------------------------
     Cookie-баннер
     ------------------------------------------------------------------------ */

  const cookieBanner = document.getElementById("cookie-banner");
  const cookieAccept = document.getElementById("cookie-accept");
  const COOKIE_KEY = "rasa-cookie-consent";

  function readConsent() {
    try { return window.localStorage.getItem(COOKIE_KEY); }
    catch (error) { return null; }
  }
  function saveConsent() {
    try { window.localStorage.setItem(COOKIE_KEY, "1"); }
    catch (error) { /* приватный режим — просто скрываем баннер */ }
  }

  if (cookieBanner && !readConsent()) {
    window.setTimeout(function () { cookieBanner.hidden = false; }, 900);
  }
  if (cookieAccept) {
    cookieAccept.addEventListener("click", function () {
      saveConsent();
      if (cookieBanner) cookieBanner.hidden = true;
    });
  }

  /* ------------------------------------------------------------------------
     Галерея-litebox
     ------------------------------------------------------------------------ */

  const galleryButtons = Array.from(document.querySelectorAll("[data-lightbox]"));
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightbox-img");
  const lightboxCaption = document.getElementById("lightbox-caption");
  const lightboxCounter = document.getElementById("lightbox-counter");
  let currentPhoto = 0;

  function showPhoto(index) {
    if (!galleryButtons.length || !lightboxImg) return;
    currentPhoto = (index + galleryButtons.length) % galleryButtons.length;
    const button = galleryButtons[currentPhoto];
    const img = button.querySelector("img");
    if (!img) return;

    lightboxImg.src = img.currentSrc || img.src;
    lightboxImg.alt = img.alt || "";
    if (lightboxCaption) lightboxCaption.textContent = button.dataset.caption || img.alt || "";
    if (lightboxCounter) {
      lightboxCounter.textContent = (currentPhoto + 1) + " / " + galleryButtons.length;
    }
  }

  function openLightbox(index) {
    if (!lightbox) return;
    showPhoto(index);
    if (typeof lightbox.showModal === "function") {
      lightbox.showModal();
      document.body.classList.add("lightbox-open");
    } else if (lightboxImg) {
      window.open(lightboxImg.src, "_blank", "noopener");
    }
  }

  if (galleryButtons.length && lightbox) {
    galleryButtons.forEach(function (button, index) {
      button.addEventListener("click", function () { openLightbox(index); });
    });

    const closeBtn = document.getElementById("lightbox-close");
    const prevBtn = document.getElementById("lightbox-prev");
    const nextBtn = document.getElementById("lightbox-next");

    if (closeBtn) closeBtn.addEventListener("click", function () { lightbox.close(); });
    if (prevBtn) prevBtn.addEventListener("click", function () { showPhoto(currentPhoto - 1); });
    if (nextBtn) nextBtn.addEventListener("click", function () { showPhoto(currentPhoto + 1); });

    lightbox.addEventListener("click", function (event) {
      if (event.target === lightbox) lightbox.close();
    });

    lightbox.addEventListener("keydown", function (event) {
      if (event.key === "ArrowLeft") { event.preventDefault(); showPhoto(currentPhoto - 1); }
      if (event.key === "ArrowRight") { event.preventDefault(); showPhoto(currentPhoto + 1); }
    });

    lightbox.addEventListener("close", function () {
      document.body.classList.remove("lightbox-open");
    });
  }

  /* ------------------------------------------------------------------------
     Мелочи
     ------------------------------------------------------------------------ */

  // Возвращаем фокус на кнопку бургера после закрытия меню по Escape уже сделан.
  // Плавный скролл обеспечивает CSS; здесь только закрываем меню при переходе.
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener("click", function () {
      if (mobileMenu && !mobileMenu.hidden) closeMenu();
    });
  });
})();
