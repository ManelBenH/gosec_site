/* Chargement du JSON */

async function loadData() {
    const response = await fetch("data.json");

    if (!response.ok) {
        throw new Error(`Erreur de chargement de data.json : ${response.status}`);
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


/* Modules */

function initModules(modulesData) {
    const cards = document.querySelectorAll(".module-card");
    const backdrop = document.querySelector("#moduleBackdrop");
    const modal = document.querySelector("#moduleModal");
    const closeButton = document.querySelector("#moduleModalClose");

    const modalLogo = document.querySelector("#moduleModalLogo");
    const modalTitle = document.querySelector("#moduleModalTitle");
    const modalDescription = document.querySelector("#moduleModalDescription");

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

    cards.forEach((card) => {
        const id = Number(card.dataset.id);
        const module = modulesData[id];

        if (!module) {
            return;
        }

        const logo = card.querySelector(".module-logo");
        const title = card.querySelector(".module-title");

        /* Les logos restent affichés sur les cartes */

        if (logo && module.logo) {
            logo.src = module.logo;
            logo.alt = module.titre;
        }

        if (title) {
            title.textContent = module.titre;
        }

        card.addEventListener("click", () => {
            modalLogo.src = module.logo;
            modalLogo.alt = module.titre;

            modalTitle.textContent = module.titre;
            modalDescription.textContent = module.descriptif;

            backdrop.classList.add("is-visible");
            modal.classList.add("is-visible");

            backdrop.setAttribute("aria-hidden", "false");
            modal.setAttribute("aria-hidden", "false");

            document.body.style.overflow = "hidden";
            closeButton.focus();
        });
    });

    function closeModal() {
        backdrop.classList.remove("is-visible");
        modal.classList.remove("is-visible");

        backdrop.setAttribute("aria-hidden", "true");
        modal.setAttribute("aria-hidden", "true");

        document.body.style.overflow = "";
    }

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


/* Participants */

function initParticipants(people) {
    const teamSection = document.querySelector(".team");
    const teamRow = document.querySelector(".team-row");
    const track = document.querySelector("#track");
    const cursorChip = document.querySelector("#cursorChip");
    const cursorLabel = document.querySelector("#cursorLabel");

    if (!teamSection || !teamRow || !track) {
        return;
    }

    people.forEach((person, index) => {
        const card = document.createElement("li");

        card.className = "card";
        card.dataset.index = index;

        /* hue est conservé */

        if (person.hue !== undefined) {
            card.dataset.hue = person.hue;
        }

        const photo = document.createElement("div");
        photo.className = "photo";

        const initials = document.createElement("span");
        initials.className = "initials";
        initials.textContent = person.initials || "";

        const sweep = document.createElement("span");
        sweep.className = "sweep";

        photo.appendChild(initials);
        photo.appendChild(sweep);

        if (person.img) {
            photo.style.backgroundImage = `url("${person.img}")`;
            photo.classList.add("has-photo");
        }

        const meta = document.createElement("div");
        meta.className = "meta";

        const name = document.createElement("h3");
        name.textContent = person.name;

        meta.appendChild(name);

        if (person.role) {
            const role = document.createElement("span");
            role.className = "role";
            role.textContent = person.role;

            meta.appendChild(role);
        }

        const divider = document.createElement("div");
        divider.className = "divider";

        const bio = document.createElement("div");
        bio.className = "bio";

        const bioText = document.createElement("p");
        bioText.textContent = person.bio;

        bio.appendChild(bioText);

        card.appendChild(photo);
        card.appendChild(meta);
        card.appendChild(divider);
        card.appendChild(bio);

        track.appendChild(card);

        card.addEventListener("click", () => {
            const isActive = card.classList.contains("active");

            document.querySelectorAll(".card.active").forEach((activeCard) => {
                activeCard.classList.remove("active");
            });

            if (!isActive) {
                card.classList.add("active");
            }
        });
    });


    /* Animation de glissement existante */

    let positionX = 0;
    let velocity = 0;
    let isDragging = false;
    let startX = 0;
    let lastX = 0;
    let moved = false;
    let animationFrame = null;

    function getBounds() {
        const viewportWidth = teamSection.clientWidth;
        const contentWidth = teamRow.scrollWidth;

        return {
            minX: Math.min(0, viewportWidth - contentWidth),
            maxX: 0
        };
    }

    function clampPosition() {
        const bounds = getBounds();

        positionX = Math.max(
            bounds.minX,
            Math.min(bounds.maxX, positionX)
        );
    }

    function updatePosition() {
        teamRow.style.transform =
            `translate3d(${positionX}px, 0, 0)`;
    }

    function stopMomentum() {
        if (animationFrame) {
            cancelAnimationFrame(animationFrame);
            animationFrame = null;
        }
    }

    function momentum() {
        velocity *= 0.94;

        if (Math.abs(velocity) < 0.1) {
            animationFrame = null;
            return;
        }

        positionX += velocity;

        clampPosition();
        updatePosition();

        animationFrame = requestAnimationFrame(momentum);
    }

    teamRow.addEventListener("pointerdown", (event) => {
        if (
            event.pointerType === "mouse" &&
            event.button !== 0
        ) {
            return;
        }

        stopMomentum();

        isDragging = true;
        moved = false;

        startX = event.clientX;
        lastX = event.clientX;
        velocity = 0;

        teamRow.classList.add("dragging");

        try {
            teamRow.setPointerCapture(event.pointerId);
        } catch (error) {
            /* Capture non disponible */
        }
    });

    teamRow.addEventListener("pointermove", (event) => {
        if (!isDragging) {
            return;
        }

        const delta = event.clientX - lastX;

        if (Math.abs(event.clientX - startX) > 6) {
            moved = true;
        }

        positionX += delta;
        velocity = delta;

        clampPosition();
        updatePosition();

        lastX = event.clientX;
    });

    function endDrag() {
        if (!isDragging) {
            return;
        }

        isDragging = false;
        teamRow.classList.remove("dragging");

        if (Math.abs(velocity) > 0.5) {
            animationFrame = requestAnimationFrame(momentum);
        }
    }

    teamRow.addEventListener("pointerup", endDrag);
    teamRow.addEventListener("pointercancel", endDrag);
    teamRow.addEventListener("lostpointercapture", endDrag);

    window.addEventListener("resize", () => {
        clampPosition();
        updatePosition();
    });

    if (
        cursorChip &&
        cursorLabel &&
        window.matchMedia("(pointer: fine)").matches
    ) {
        document.addEventListener("pointermove", (event) => {
            cursorChip.style.left = `${event.clientX}px`;
            cursorChip.style.top = `${event.clientY}px`;

            if (event.target.closest(".card")) {
                cursorLabel.textContent = "Voir";
                cursorChip.classList.add("visible");
            } else if (isDragging) {
                cursorLabel.textContent = "Glisser";
                cursorChip.classList.add("visible");
            } else {
                cursorChip.classList.remove("visible");
            }
        });
    }

    clampPosition();
    updatePosition();
}


/* Formulaire */

function initInvolvementForm() {
    const form = document.querySelector("#involve-form");

    if (!form) {
        return;
    }

    const autreCheck = document.querySelector("#autre-check");
    const autreTexte = document.querySelector("#autre-texte");
    const toast = document.querySelector("#involve-toast");
    const toastText = document.querySelector("#involve-toast-text");

    const fields = {
        prenom: document.querySelector("#prenom"),
        nom: document.querySelector("#nom"),
        courriel: document.querySelector("#courriel")
    };

    const errors = {
        prenom: document.querySelector("#err-prenom"),
        nom: document.querySelector("#err-nom"),
        courriel: document.querySelector("#err-courriel")
    };


    /* Champ Autre */

    autreCheck.addEventListener("change", () => {
        autreTexte.disabled = !autreCheck.checked;

        if (autreCheck.checked) {
            autreTexte.focus();
        } else {
            autreTexte.value = "";
        }
    });


    /* Validation */

    function setError(field, error, message) {
        field.classList.add("invalid");
        error.textContent = message;
    }

    function clearError(field, error) {
        field.classList.remove("invalid");
        error.textContent = "";
    }

    function validate() {
        let valid = true;

        if (!fields.prenom.value.trim()) {
            setError(
                fields.prenom,
                errors.prenom,
                "Veuillez entrer votre prénom."
            );

            valid = false;
        } else {
            clearError(fields.prenom, errors.prenom);
        }

        if (!fields.nom.value.trim()) {
            setError(
                fields.nom,
                errors.nom,
                "Veuillez entrer votre nom."
            );

            valid = false;
        } else {
            clearError(fields.nom, errors.nom);
        }

        const email = fields.courriel.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!email) {
            setError(
                fields.courriel,
                errors.courriel,
                "Veuillez entrer votre adresse courriel."
            );

            valid = false;
        } else if (!emailRegex.test(email)) {
            setError(
                fields.courriel,
                errors.courriel,
                "Veuillez entrer une adresse courriel valide."
            );

            valid = false;
        } else {
            clearError(fields.courriel, errors.courriel);
        }

        return valid;
    }


    /* Soumission */

    form.addEventListener("submit", (event) => {
        event.preventDefault();

        if (!validate()) {
            return;
        }

        const interests = [];

        form
            .querySelectorAll('input[name="interets"]:checked')
            .forEach((checkbox) => {
                interests.push(checkbox.value);
            });

        if (
            autreCheck.checked &&
            autreTexte.value.trim()
        ) {
            interests.push(
                `Autre : ${autreTexte.value.trim()}`
            );
        }

        const newsletter = form.querySelector(
            'input[name="newsletter"]:checked'
        );

        const submission = {
            prenom: fields.prenom.value.trim(),
            nom: fields.nom.value.trim(),
            courriel: fields.courriel.value.trim(),
            organisation: document.querySelector("#organisation").value.trim(),
            interets: interests,
            newsletter: Boolean(newsletter),
            date_soumission: new Date().toISOString()
        };

        const blob = new Blob(
            [JSON.stringify(submission, null, 2)],
            { type: "application/json" }
        );

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = `simpliquer-${Date.now()}.json`;

        document.body.appendChild(link);
        link.click();
        link.remove();

        URL.revokeObjectURL(url);

        toastText.textContent =
            "Demande enregistrée. Le fichier JSON a été téléchargé.";

        toast.classList.add("show");

        setTimeout(() => {
            toast.classList.remove("show");
        }, 4000);

        form.reset();

        autreTexte.disabled = true;

        Object.keys(fields).forEach((key) => {
            clearError(fields[key], errors[key]);
        });
    });
}


/* Initialisation */

document.addEventListener("DOMContentLoaded", async () => {
    try {
        const data = await loadData();

        initModules(data.modulesData);
        initParticipants(data.people);
        initInvolvementForm();

        console.log("data.json chargé avec succès.");
    } catch (error) {
        console.error(
            "Erreur lors du chargement des données :",
            error
        );
    }
});