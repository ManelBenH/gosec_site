"use strict";

/* ============================================================
   CHARGEMENT DES DONNÉES
   ============================================================ */

async function loadData() {
  const response = await fetch("data.json");

  if (!response.ok) {
    throw new Error(
      `Erreur de chargement de data.json : ${response.status}`
    );
  }

  const data = await response.json();

  if (!Array.isArray(data.modulesData)) {
    throw new Error("modulesData doit être un tableau.");
  }

  if (!Array.isArray(data.people)) {
    throw new Error("people doit être un tableau.");
  }

  return data;
}

/* ============================================================
   MODULES + MODAL
   ============================================================ */

function initModules(modulesData) {
  const cards = document.querySelectorAll(".module-card");
  const backdrop = document.getElementById("moduleBackdrop");
  const modal = document.getElementById("moduleModal");
  const closeButton = document.getElementById("moduleModalClose");
  const modalLogo = document.getElementById("moduleModalLogo");
  const modalTitle = document.getElementById("moduleModalTitle");
  const modalDescription = document.getElementById(
    "moduleModalDescription"
  );

  if (
    !cards.length ||
    !backdrop ||
    !modal ||
    !closeButton ||
    !modalLogo ||
    !modalTitle ||
    !modalDescription
  ) {
    return;
  }

  function openModal(module) {
    if (module.logo) {
      modalLogo.src = module.logo;
      modalLogo.alt = module.titre || "";
      modalLogo.style.display = "";
    } else {
      modalLogo.removeAttribute("src");
      modalLogo.alt = "";
      modalLogo.style.display = "none";
    }

    modalTitle.textContent = module.titre || "";
    modalDescription.textContent = module.descriptif || "";

    backdrop.classList.add("is-visible");
    modal.classList.add("is-visible");

    backdrop.setAttribute("aria-hidden", "false");
    modal.setAttribute("aria-hidden", "false");

    document.body.style.overflow = "hidden";

    closeButton.focus();
  }

  function closeModal() {
    backdrop.classList.remove("is-visible");
    modal.classList.remove("is-visible");

    backdrop.setAttribute("aria-hidden", "true");
    modal.setAttribute("aria-hidden", "true");

    document.body.style.overflow = "";
  }

  cards.forEach((card) => {
    const id = Number(card.dataset.id);
    const module = modulesData[id];

    if (!module) {
      return;
    }

    const logo = card.querySelector(".module-logo");
    const title = card.querySelector(".module-title");

    if (title) {
      title.textContent = module.titre || "";
    }

    if (logo) {
      if (module.logo) {
        logo.src = module.logo;
        logo.alt = module.titre || "";
        logo.style.display = "";
      } else {
        logo.removeAttribute("src");
        logo.alt = "";
        logo.style.display = "none";
      }
    }

    card.addEventListener("click", () => {
      openModal(module);
    });

    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openModal(module);
      }
    });

    card.setAttribute("tabindex", "0");
    card.setAttribute("role", "button");
  });

  closeButton.addEventListener("click", closeModal);

  backdrop.addEventListener("click", closeModal);

  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      modal.classList.contains("is-visible")
    ) {
      closeModal();
    }
  });
}

/* ============================================================
   PERSONNES / ÉQUIPE
   ============================================================ */

function initTeam(PEOPLE) {
  const QR_ICONS = {
    linkedin: `
      <svg
        class="qr-icon"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.446-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    `,

    github: `
      <svg
        class="qr-icon"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
      </svg>
    `
  };

  const track = document.getElementById("track");

  if (!track) {
    return;
  }

  function extractHandle(url) {
    return url.replace(/\/+$/, "").split("/").pop();
  }

  function buildQrItem(url, label, type, name) {
    if (!url) {
      return "";
    }

    const qrSrc =
      "https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=0&data=" +
      encodeURIComponent(url);

    const icon = QR_ICONS[type] || "";

    return `
      <a
        class="qr-item"
        href="${url}"
        target="_blank"
        rel="noopener noreferrer"
      >
        <img
          class="qr-code"
          src="${qrSrc}"
          alt="QR code ${label}"
          loading="lazy"
        >

        <span class="qr-label">
          ${icon}

          <span class="qr-label-text">
            <span class="qr-platform">${label}</span>
            <span class="qr-name">${name}</span>
          </span>
        </span>
      </a>
    `;
  }

  /* ------------------------------------------------------------
     Création des cartes
     ------------------------------------------------------------ */

  const fragment = document.createDocumentFragment();

  PEOPLE.forEach((person, index) => {
    const card = document.createElement("li");

    card.className = "card";
    card.dataset.index = index;
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-expanded", "false");

    if (person.hue !== undefined) {
      card.style.setProperty("--hue", person.hue);
    }

    card.setAttribute(
      "aria-label",
      `${person.name || "Participant"}, ${person.role || ""
      }. Activer pour lire la biographie.`
    );

    const hasPhoto = Boolean(person.img);

    const photoStyle = hasPhoto
      ? `style="background-image: url('${person.img}')"`
      : "";

    const qrLinkedin = buildQrItem(
      person.linkedin,
      "LinkedIn",
      "linkedin",
      (person.name || "").trim()
    );

    const qrGithub = buildQrItem(
      person.github,
      "GitHub",
      "github",
      person.github ? extractHandle(person.github) : ""
    );

    const qrGrid =
      qrLinkedin || qrGithub
        ? `
          <div
            class="qr-reveal"
            aria-hidden="true"
          >
            <div class="qr-grid">
              ${qrLinkedin}
              ${qrGithub}
            </div>
          </div>
        `
        : "";

    /*
      IMPORTANT :
      Le QR est placé dans .card-main.
      Il sera donc directement sous la photo / les informations
      de la personne.
    */

    card.innerHTML = `
      <div class="card-body">

        <div class="card-main">

          <div
            class="photo${hasPhoto ? " has-photo" : ""}"
            ${photoStyle}
          >
            <span class="initials">
              ${person.initials || ""}
            </span>

            <span class="sweep"></span>
          </div>

          <div class="meta">
            <h3>${person.name || ""}</h3>

            <span class="role">
              + ${person.role || ""}
            </span>
          </div>

          <div class="divider"></div>

          ${qrGrid}

        </div>

        <div class="bio">
          <p>${person.bio || ""}</p>
        </div>

      </div>
    `;

    fragment.appendChild(card);
  });

  track.appendChild(fragment);

  const cards = Array.from(
    track.querySelectorAll(".card")
  );

  /* ------------------------------------------------------------
     Taille des noms
     ------------------------------------------------------------ */

  const nameEls = cards
    .map((card) => card.querySelector(".meta h3"))
    .filter(Boolean);

  const BASE_NAME_SIZE = 40;

  const measureCanvas = document.createElement("canvas");
  const measureCtx = measureCanvas.getContext("2d");

  function fitNames() {
    if (!nameEls.length || !measureCtx || !cards.length) {
      return;
    }

    const cardMain = cards[0].querySelector(".card-main");

    if (!cardMain) {
      return;
    }

    const maxWidth = cardMain.getBoundingClientRect().width;

    if (!maxWidth) {
      return;
    }

    const style = getComputedStyle(nameEls[0]);

    measureCtx.font =
      `${style.fontWeight} ${BASE_NAME_SIZE}px ${style.fontFamily}`;

    let longest = 0;

    nameEls.forEach((element) => {
      const width = measureCtx.measureText(
        element.textContent
      ).width;

      if (width > longest) {
        longest = width;
      }
    });

    if (!longest) {
      return;
    }

    const scale = Math.min(1, maxWidth / longest);

    const size = Math.max(
      BASE_NAME_SIZE * scale,
      14
    );

    document.documentElement.style.setProperty(
      "--name-size",
      `${size}px`
    );
  }

  fitNames();

  window.addEventListener("resize", fitNames);

  /* ------------------------------------------------------------
     Ouverture / fermeture des cartes
     ------------------------------------------------------------ */

  let computeBounds;

  function toggleCard(card) {
    const willOpen =
      !card.classList.contains("active");

    const bio = card.querySelector(".bio");

    if (!bio) {
      return;
    }

    if (willOpen) {
      /*
        Ferme les autres cartes avant d'ouvrir celle-ci.
      */
      cards.forEach((otherCard) => {
        if (
          otherCard !== card &&
          otherCard.classList.contains("active")
        ) {
          otherCard.classList.remove("active");
          otherCard.setAttribute(
            "aria-expanded",
            "false"
          );

          const otherQr =
            otherCard.querySelector(".qr-reveal");

          if (otherQr) {
            otherQr.setAttribute(
              "aria-hidden",
              "true"
            );
          }
        }
      });

      card.classList.add("active");

      card.setAttribute(
        "aria-expanded",
        "true"
      );

      const qrReveal =
        card.querySelector(".qr-reveal");

      if (qrReveal) {
        qrReveal.setAttribute(
          "aria-hidden",
          "false"
        );
      }

      bio.style.opacity = "0";

      setTimeout(() => {
        bio.style.opacity = "1";
      }, 300);

      if (computeBounds) {
        computeBounds();
      }

      const onOpenEnd = (event) => {
        if (event.propertyName !== "width") {
          return;
        }

        card.removeEventListener(
          "transitionend",
          onOpenEnd
        );

        if (computeBounds) {
          computeBounds();
        }
      };

      card.addEventListener(
        "transitionend",
        onOpenEnd
      );
    } else {
      bio.style.opacity = "0";

      setTimeout(() => {
        card.classList.remove("active");

        card.setAttribute(
          "aria-expanded",
          "false"
        );

        const qrReveal =
          card.querySelector(".qr-reveal");

        if (qrReveal) {
          qrReveal.setAttribute(
            "aria-hidden",
            "true"
          );
        }

        bio.style.opacity = "";

        if (computeBounds) {
          computeBounds();
        }
      }, 300);
    }
  }

  cards.forEach((card) => {
    card.addEventListener("keydown", (event) => {
      if (
        event.key === "Enter" ||
        event.key === " "
      ) {
        event.preventDefault();
        toggleCard(card);
      }
    });
  });

  /* ============================================================
     CURSEUR PERSONNALISÉ
     ============================================================ */

  const teamSection =
    document.getElementById("team");

  const viewport =
    document.getElementById("teamRow");

  const chip =
    document.getElementById("cursorChip");

  const label =
    document.getElementById("cursorLabel");

  const dashL =
    document.getElementById("dashL");

  const dashR =
    document.getElementById("dashR");

  if (
    !teamSection ||
    !viewport ||
    !chip ||
    !label ||
    !dashL ||
    !dashR
  ) {
    return;
  }

  const isFinePointer =
    window.matchMedia(
      "(pointer: fine)"
    ).matches;

  function setChipLabel(text, withDash) {
    label.textContent = text;

    dashL.textContent = withDash
      ? "—"
      : "";

    dashR.textContent = withDash
      ? "—"
      : "";
  }

  let lastPointerX = null;
  let lastPointerY = null;

  function refreshChipLabel() {
    if (
      lastPointerX === null ||
      isDragging
    ) {
      return;
    }

    const element =
      document.elementFromPoint(
        lastPointerX,
        lastPointerY
      );

    const card =
      element?.closest(".card");

    chip.classList.toggle(
      "cursor-chip--hover",
      Boolean(card)
    );

    if (card) {
      setChipLabel(
        card.classList.contains("active")
          ? "Fermer"
          : "Voir",
        false
      );
    } else {
      setChipLabel(
        "Glisser",
        true
      );
    }
  }

  if (isFinePointer) {
    viewport.addEventListener(
      "pointermove",
      (event) => {
        chip.style.left =
          `${event.clientX}px`;

        chip.style.top =
          `${event.clientY}px`;

        lastPointerX =
          event.clientX;

        lastPointerY =
          event.clientY;

        if (isDragging) {
          chip.classList.remove(
            "cursor-chip--hover"
          );

          setChipLabel(
            "Glisser",
            true
          );

          return;
        }

        refreshChipLabel();
      }
    );

    viewport.addEventListener(
      "pointerenter",
      () => {
        chip.classList.add("visible");
      }
    );

    viewport.addEventListener(
      "pointerleave",
      () => {
        chip.classList.remove("visible");
      }
    );
  }

  /* ============================================================
     GLISSER-DÉFILER + INERTIE
     ============================================================ */

  let posX = 0;
  let minX = 0;

  let isDragging = false;

  let startClientX = 0;
  let startPosX = 0;

  let lastClientX = 0;
  let lastTime = 0;

  let velocity = 0;
  let momentumFrame = null;

  let moved = 0;

  computeBounds = function () {
    const rowWidth =
      viewport.scrollWidth;

    const availableWidth =
      teamSection.clientWidth;

    minX = Math.min(
      0,
      availableWidth -
      rowWidth -
      24
    );

    posX = clamp(
      posX,
      minX,
      0
    );
  };

  function applyTransform() {
    viewport.style.transform =
      `translate3d(${posX}px, 0, 0)`;
  }

  function clamp(value, min, max) {
    return Math.max(
      min,
      Math.min(max, value)
    );
  }

  function stopMomentum() {
    if (momentumFrame) {
      cancelAnimationFrame(
        momentumFrame
      );

      momentumFrame = null;
    }
  }

  function runMomentum() {
    velocity *= 0.92;

    posX = clamp(
      posX + velocity,
      minX,
      0
    );

    applyTransform();

    if (
      Math.abs(velocity) > 0.4 &&
      posX > minX &&
      posX < 0
    ) {
      momentumFrame =
        requestAnimationFrame(
          runMomentum
        );
    } else {
      momentumFrame = null;
    }
  }

  computeBounds();

  window.addEventListener(
    "resize",
    computeBounds
  );

  if (isFinePointer) {
    viewport.addEventListener(
      "pointerdown",
      (event) => {
        if (
          event.button !== undefined &&
          event.button !== 0
        ) {
          return;
        }

        isDragging = true;
        moved = 0;

        stopMomentum();

        startClientX =
          event.clientX;

        lastClientX =
          event.clientX;

        startPosX = posX;

        lastTime =
          performance.now();

        velocity = 0;

        viewport.classList.add(
          "dragging"
        );

        viewport.setPointerCapture(
          event.pointerId
        );
      }
    );

    viewport.addEventListener(
      "pointermove",
      (event) => {
        if (!isDragging) {
          return;
        }

        const dx =
          event.clientX -
          startClientX;

        moved = Math.max(
          moved,
          Math.abs(dx)
        );

        posX = clamp(
          startPosX + dx,
          minX,
          0
        );

        applyTransform();

        const now =
          performance.now();

        const dt =
          now - lastTime;

        if (dt > 0) {
          velocity =
            ((event.clientX -
              lastClientX) /
              dt) *
            16;

          lastTime = now;
          lastClientX =
            event.clientX;
        }
      }
    );

    function endDrag(event) {
      if (!isDragging) {
        return;
      }

      isDragging = false;

      viewport.classList.remove(
        "dragging"
      );

      if (Math.abs(velocity) > 0.5) {
        runMomentum();
      }

      if (moved < 6) {
        const element =
          document.elementFromPoint(
            event.clientX,
            event.clientY
          );

        const card =
          element?.closest(".card");

        if (card) {
          toggleCard(card);
        }
      }

      refreshChipLabel();
    }

    viewport.addEventListener(
      "pointerup",
      endDrag
    );

    viewport.addEventListener(
      "pointercancel",
      endDrag
    );

    viewport.addEventListener(
      "wheel",
      (event) => {
        if (
          Math.abs(event.deltaX) <
          Math.abs(event.deltaY)
        ) {
          return;
        }

        event.preventDefault();

        stopMomentum();

        posX = clamp(
          posX - event.deltaX,
          minX,
          0
        );

        applyTransform();
      },
      { passive: false }
    );
  } else {
    /* ----------------------------------------------------------
       MOBILE
       ---------------------------------------------------------- */

    let touchStartX = 0;
    let touchMoved = 0;

    viewport.addEventListener(
      "touchstart",
      (event) => {
        touchStartX =
          event.touches[0].clientX;

        touchMoved = 0;
      },
      { passive: true }
    );

    viewport.addEventListener(
      "touchmove",
      (event) => {
        touchMoved = Math.max(
          touchMoved,
          Math.abs(
            event.touches[0].clientX -
            touchStartX
          )
        );
      },
      { passive: true }
    );

    viewport.addEventListener(
      "touchend",
      (event) => {
        if (touchMoved >= 6) {
          return;
        }

        const card =
          event.target.closest(".card");

        if (card) {
          toggleCard(card);
        }
      }
    );
  }
}

/* ============================================================
   FORMULAIRE — S'IMPLIQUER
   ============================================================ */

function initForm() {
  const form = document.getElementById("involve-form");
  const autreCheck = document.getElementById("autre-check");
  const autreTexte = document.getElementById("autre-texte");
  const toast = document.getElementById("involve-toast");
  const toastText = document.getElementById("involve-toast-text");
  const submitBtn = document.getElementById("submit-btn");

  if (
    !form ||
    !autreCheck ||
    !autreTexte ||
    !toast ||
    !toastText
  ) {
    return;
  }

  autreCheck.addEventListener("change", () => {
    autreTexte.disabled = !autreCheck.checked;

    if (autreCheck.checked) {
      autreTexte.focus();
    } else {
      autreTexte.value = "";
    }
  });

  function showToast(message) {
    toastText.textContent = message;
    toast.classList.add("show");

    clearTimeout(showToast.timer);

    showToast.timer = setTimeout(() => {
      toast.classList.remove("show");
    }, 3800);
  }

  function setError(fieldId, message) {
    const input = document.getElementById(fieldId);
    const error = document.getElementById(`err-${fieldId}`);

    if (!input || !error) {
      return;
    }

    input.classList.toggle("invalid", Boolean(message));
    error.textContent = message;
  }

  function validEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function validate() {
    let valid = true;

    const prenom = document.getElementById("prenom").value.trim();
    const nom = document.getElementById("nom").value.trim();
    const courriel = document.getElementById("courriel").value.trim();

    if (!prenom) {
      setError("prenom", "Le prénom est requis.");
      valid = false;
    } else {
      setError("prenom", "");
    }

    if (!nom) {
      setError("nom", "Le nom est requis.");
      valid = false;
    } else {
      setError("nom", "");
    }

    if (!courriel) {
      setError("courriel", "Le courriel est requis.");
      valid = false;
    } else if (!validEmail(courriel)) {
      setError("courriel", "Format de courriel invalide.");
      valid = false;
    } else {
      setError("courriel", "");
    }

    return valid;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!validate()) {
      showToast("Veuillez corriger les champs en rouge.");
      return;
    }

    const interets = Array.from(
      form.querySelectorAll('input[name="interets"]:checked')
    ).map((input) => input.value);

    const autreInteret =
      autreCheck.checked
        ? autreTexte.value.trim()
        : "";

    if (autreInteret) {
      interets.push(`Autre: ${autreInteret}`);
    }

    const formData = new FormData(form);

    // On s'assure que le champ "Autre" est envoyé correctement
    formData.set("autre_interet", autreInteret);

    // Les intérêts sélectionnés sont envoyés dans une seule valeur
    formData.delete("interets");
    formData.append("interets", interets.join(", "));

    // Date de soumission
    formData.set(
      "date_soumission",
      new Date().toISOString()
    );

    try {
      if (submitBtn) {
        submitBtn.disabled = true;
      }

      const response = await fetch("/", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams(formData).toString()
      });

      if (!response.ok) {
        throw new Error("Erreur lors de l'envoi du formulaire.");
      }

      showToast(
        "Demande envoyée. Merci pour votre intérêt !"
      );

      form.reset();

      autreTexte.disabled = true;

      document.getElementById("newsletter").checked = true;

      // Nettoyage des erreurs
      setError("prenom", "");
      setError("nom", "");
      setError("courriel", "");

    } catch (error) {
      console.error(error);

      showToast(
        "Une erreur est survenue. Veuillez réessayer."
      );

    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
      }
    }
  });
}

/* ============================================================
   INITIALISATION
   ============================================================ */

document.addEventListener(
  "DOMContentLoaded",
  async () => {
    try {
      const data =
        await loadData();

      /* Modules */
      initModules(
        data.modulesData
      );

      /* Équipe */
      initTeam(
        data.people
      );
    } catch (error) {
      console.error(
        "Erreur lors du chargement des données :",
        error
      );
    }

    /* Formulaire */
    initForm();
  }
);