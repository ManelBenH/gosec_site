/* ================================================================
   SCRIPT.JS
   Ce fichier contient TOUTE la logique JavaScript du site.
   Il est composé de deux IIFE (Immediately Invoked Function
   Expression) totalement indépendantes :

   1. La première (lignes ~ci-dessous) gère la section "équipe" :
      elle va chercher les données des 9 participant·es dans
      data.json, construit les cartes (photo, nom, bio, QR codes),
      gère l'ouverture/fermeture d'une carte, le curseur personnalisé
      et le glisser-déposer horizontal avec inertie.

   2. La seconde gère uniquement le formulaire de la section
      "S'impliquer" (validation des champs, affichage d'un toast de
      confirmation, téléchargement des données saisies en .json).

   On utilise une IIFE = "(function(){ ... })();" pour chaque bloc
   afin que leurs variables (form, PEOPLE, cards, etc.) restent
   privées et ne polluent pas l'espace global (window) ni n'entrent
   en conflit entre elles.
   ================================================================ */

(function(){
  "use strict";

  /* ============================================================
     CHARGEMENT DES DONNÉES DEPUIS data.json
     ------------------------------------------------------------
     Les 9 profils (nom, rôle, bio, initiales, teinte, liens
     LinkedIn/GitHub, photo) ne sont plus codés en dur dans ce
     fichier JS : ils vivent dans data.json, à côté de index.html.

     Schéma attendu pour CHAQUE objet du tableau JSON :
       {
         "name"     : string  — nom complet affiché sur la carte.
         "role"     : string  — rôle/titre affiché sous le nom
                                 (peut être une chaîne vide "").
         "initials" : string  — initiales affichées tant qu'aucune
                                 photo n'est chargée (peut être "").
         "img"      : string  — chemin vers la photo, ex.
                                 "images/manel.jpg". Laisser ""
                                 pour garder les initiales par défaut.
         "hue"      : number  — teinte (0-360) posée en variable CSS
                                 --hue sur la carte, pour d'éventuelles
                                 déclinaisons de couleur par personne.
         "linkedin" : string  — URL du profil LinkedIn, ou "" pour
                                 ne pas afficher de QR code LinkedIn.
         "github"   : string  — URL du profil GitHub, ou "" pour
                                 ne pas afficher de QR code GitHub.
         "bio"      : string  — texte de la biographie affiché
                                 quand on ouvre la carte.
       }

     Pourquoi fetch() : on charge le fichier de façon asynchrone
     (le navigateur doit d'abord le lire sur le disque/serveur),
     donc TOUT le code qui dépend de PEOPLE (construction des
     cartes, mesure des noms, glisser-déposer...) est placé dans
     la fonction initTeam(), appelée seulement une fois que
     data.json a été chargé et transformé en tableau JS.

     ATTENTION : fetch() est bloqué par les navigateurs quand la
     page est ouverte directement en double-cliquant dessus
     (protocole file://). Il faut servir ce dossier via un serveur
     local (ex. "python3 -m http.server") ou un hébergement web.
     ============================================================ */
  fetch('data.json')
    .then(function(response){
      // response.json() lit le corps de la réponse et le parse
      // en objet/tableau JavaScript (ici : un tableau de 9 objets).
      return response.json();
    })
    .then(function(PEOPLE){
      // Une fois les données prêtes, on lance toute la logique
      // de la section équipe en lui passant le tableau PEOPLE.
      initTeam(PEOPLE);
    })
    .catch(function(err){
      // Si data.json est introuvable, mal formé, ou si la page est
      // ouverte en file:// (fetch bloqué), on log l'erreur au lieu
      // de laisser la section "équipe" planter silencieusement.
      console.error('Erreur de chargement de data.json :', err);
    });

  /**
   * initTeam(PEOPLE)
   * ------------------------------------------------------------
   * Point d'entrée principal de la section "équipe". Reçoit le
   * tableau de profils chargé depuis data.json et met en place :
   *   - la construction des 9 cartes dans le DOM,
   *   - le calcul de la taille de police des noms,
   *   - l'ouverture/fermeture d'une carte au clic/Entrée,
   *   - le curseur personnalisé (pastille "Glisser/Voir/Fermer"),
   *   - le glisser-déposer horizontal avec inertie (souris/trackpad)
   *     et le défilement tactile natif sur mobile.
   *
   * @param {Array<Object>} PEOPLE — tableau des profils (voir le
   *        schéma détaillé juste au-dessus de l'appel fetch()).
   */
  function initTeam(PEOPLE) {

  /* Icônes simples (Simple Icons, licence CC0) pour identifier
     LinkedIn et GitHub à côté de chaque QR code. */
  const QR_ICONS = {
    linkedin: '<svg class="qr-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.446-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>',
    github: '<svg class="qr-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>'
  };

  /**
   * extractHandle(url)
   * ------------------------------------------------------------
   * Extrait le pseudo/segment final d'une URL de profil, pour
   * l'afficher sous l'icône GitHub dans le QR code (ex. affichage
   * "ManelBenH" plutôt que l'URL complète).
   *
   * Exemple : "https://github.com/ManelBenH"      -> "ManelBenH"
   *           "https://github.com/ManelBenH/"     -> "ManelBenH"
   *              (le slash final est retiré avant de découper)
   *
   * @param {string} url — URL complète du profil.
   * @returns {string} le dernier segment du chemin de l'URL.
   */
  function extractHandle(url){
    return url.replace(/\/+$/, '').split('/').pop();
  }

  /**
   * buildQrItem(url, label, type, name)
   * ------------------------------------------------------------
   * Génère le HTML (sous forme de chaîne) d'une vignette QR code
   * cliquable pour un réseau donné (LinkedIn ou GitHub). Le QR
   * code lui-même est généré à la volée par un service externe
   * (api.qrserver.com) : on lui passe l'URL du profil encodée, et
   * il retourne une image PNG du QR code correspondant.
   *
   * Si aucune URL n'est fournie (profil sans LinkedIn ou sans
   * GitHub), la fonction retourne une chaîne vide : ainsi, cette
   * vignette n'apparaît simplement pas dans la grille, plutôt que
   * d'afficher un QR code cassé ou un lien vide.
   *
   * @param {string} url   — URL du profil (LinkedIn ou GitHub).
   *                         Chaîne vide "" ou falsy = pas de vignette.
   * @param {string} label — texte affiché au-dessus du pseudo,
   *                         ex. "LinkedIn" ou "GitHub".
   * @param {string} type  — clé dans QR_ICONS ("linkedin"|"github"),
   *                         pour choisir la bonne icône SVG.
   * @param {string} name  — nom ou pseudo affiché sous le label.
   * @returns {string} le balisage HTML de la vignette, ou "" si url
   *                    est vide.
   */
  function buildQrItem(url, label, type, name){
    if (!url) return '';
    // Construit l'URL du service qui génère l'image du QR code :
    // "data" (encodé) = l'URL vers laquelle le QR code doit pointer.
    const qrSrc = 'https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=0&data=' + encodeURIComponent(url);
    const icon = QR_ICONS[type] || '';
    return (
      '<a class="qr-item" href="' + url + '" target="_blank" rel="noopener noreferrer">' +
        '<img class="qr-code" src="' + qrSrc + '" alt="QR code ' + label + '" loading="lazy">' +
        '<span class="qr-label">' +
          icon +
          '<span class="qr-label-text">' +
            '<span class="qr-platform">' + label + '</span>' +
            '<span class="qr-name">' + name + '</span>' +
          '</span>' +
        '</span>' +
      '</a>'
    );
  }

  /* ============================================================
     CONSTRUCTION DES CARTES
     ------------------------------------------------------------
     On parcourt le tableau PEOPLE (chargé depuis data.json) et on
     construit, pour chaque personne, un élément <li class="card">
     qu'on insère dans <ul id="track"> (voir index.html). On passe
     par un DocumentFragment pour n'ajouter les 9 cartes au DOM
     qu'en une seule fois (meilleure performance que 9 insertions
     successives).
     ============================================================ */
  const track = document.getElementById('track');
  const frag = document.createDocumentFragment();

  PEOPLE.forEach((p, i) => {
    // Élément racine de la carte : un <li> car track est une <ul>.
    const li = document.createElement('li');
    li.className = 'card';
    li.dataset.index = i; // index numérique de la personne (0 à 8)

    // Pose la teinte propre à cette personne en variable CSS --hue,
    // exploitable dans style.css pour d'éventuelles déclinaisons
    // de couleur par carte.
    li.style.setProperty('--hue', p.hue);

    // Accessibilité : la carte se comporte comme un bouton
    // (activable au clavier avec Tab puis Entrée/Espace) et
    // annonce son état ouvert/fermé aux lecteurs d'écran via
    // aria-expanded (mis à jour dans toggleCard()).
    li.tabIndex = 0;
    li.setAttribute('role','button');
    li.setAttribute('aria-expanded','false');
    li.setAttribute('aria-label', p.name + ', ' + p.role + '. Activer pour lire la biographie.');

    // Si p.img est renseigné dans data.json, on pose la photo en
    // arrière-plan directement en style inline (plus simple que de
    // manipuler une classe par personne) et on ajoute la classe
    // has-photo, qui masque les initiales via le CSS
    // (.photo.has-photo .initials{ display:none; }).
    const hasPhoto = !!p.img;
    const photoStyle = hasPhoto ? ' style="background-image:url(\'' + p.img + '\')"' : '';

    // Construit les vignettes QR code (LinkedIn / GitHub) pour
    // cette personne. Si aucune des deux URLs n'est fournie,
    // qrGridHtml reste une chaîne vide : la grille de QR codes
    // n'est alors pas ajoutée du tout au balisage de la carte.
    const qrLinkedin = buildQrItem(p.linkedin, 'LinkedIn', 'linkedin', p.name.trim());
    const qrGithub = buildQrItem(p.github, 'GitHub', 'github', p.github ? extractHandle(p.github) : '');
    const qrGridHtml = (qrLinkedin || qrGithub)
      ? '<div class="qr-reveal"><div class="qr-grid">' + qrLinkedin + qrGithub + '</div></div>'
      : '';

    // Assemble tout le balisage interne de la carte :
    //  - .card-body > .card-main : photo + nom/rôle + trait
    //  - .card-body > .bio       : biographie (masquée par défaut,
    //                               révélée par la classe .active
    //                               posée dans toggleCard())
    //  - .qr-reveal              : grille de QR codes, sous la
    //                               photo, révélée en même temps
    //                               que la bio.
    li.innerHTML =
      '<div class="card-body">' +
        '<div class="card-main">' +
          '<div class="photo' + (hasPhoto ? ' has-photo' : '') + '"' + photoStyle + '>' +
            '<span class="initials">' + p.initials + '</span>' +
            '<span class="sweep"></span>' +
          '</div>' +
          '<div class="meta"><h3>' + p.name + '</h3><span class="role">+ ' + p.role + '</span></div>' +
          '<div class="divider"></div>' +
        '</div>' +
        '<div class="bio"><p>' + p.bio + '</p></div>' +
      '</div>' +
      qrGridHtml;

    frag.appendChild(li);
  });
  // Une seule insertion dans le DOM pour les 9 cartes d'un coup.
  track.appendChild(frag);

  // Liste des cartes réellement présentes dans le DOM, utilisée
  // dans tout le reste du script (fitNames, toggleCard, etc.).
  const cards = Array.from(track.querySelectorAll('.card'));

  /* ============================================================
     TAILLE DU NOM — une seule taille pour toutes les cartes,
     calculée pour que même le nom le plus long tienne sur une
     seule ligne sans dépasser la largeur de la photo (--card-w).
     ------------------------------------------------------------
     Principe : on utilise un <canvas> invisible (jamais ajouté au
     DOM) uniquement pour sa méthode measureText(), qui permet de
     calculer la largeur qu'un texte occuperait avec une police et
     une taille données, SANS avoir à l'afficher réellement à
     l'écran. On mesure ainsi le nom le plus long parmi les 9, on
     compare sa largeur à la largeur disponible (celle de la
     photo), et si besoin on réduit uniformément la taille de
     police de TOUS les noms (via la variable CSS --name-size) pour
     que le plus long tienne quand même sur une ligne.
     ============================================================ */
  const nameEls = cards.map(c => c.querySelector('.meta h3')).filter(Boolean);
  const BASE_NAME_SIZE = 40; // px, valeur définie dans le CSS (.meta h3)
  const measureCanvas = document.createElement('canvas');
  const measureCtx = measureCanvas.getContext('2d');

  /**
   * fitNames()
   * ------------------------------------------------------------
   * Recalcule et applique la taille de police optimale pour tous
   * les noms de la section équipe. Appelée une première fois au
   * chargement, puis à chaque redimensionnement de la fenêtre
   * (la largeur disponible pour le nom peut changer).
   */
  function fitNames(){
    if (!nameEls.length) return;

    // Largeur de référence = largeur réelle du bloc "identité"
    // (photo + nom), qui ne change pas quand une carte s'ouvre.
    const cardMain = cards[0].querySelector('.card-main');
    const maxWidth = cardMain.getBoundingClientRect().width;
    if (!maxWidth) return;

    // Configure le contexte du canvas avec la même graisse et la
    // même police que les noms affichés à l'écran, pour que la
    // mesure soit fidèle à ce qui sera réellement rendu.
    const style = getComputedStyle(nameEls[0]);
    measureCtx.font = style.fontWeight + ' ' + BASE_NAME_SIZE + 'px ' + style.fontFamily;

    // Cherche, parmi les 9 noms, celui qui est le plus large une
    // fois rendu à la taille de base (40px).
    let longest = 0;
    nameEls.forEach(el => {
      const w = measureCtx.measureText(el.textContent).width;
      if (w > longest) longest = w;
    });
    if (!longest) return;

    // Calcule un facteur d'échelle qui ferait tenir le nom le plus
    // long dans la largeur disponible (jamais plus grand que 1 :
    // on ne veut jamais agrandir au-delà de la taille de base).
    const scale = Math.min(1, maxWidth / longest);
    // On applique ce même facteur à tous les noms (via une seule
    // variable CSS partagée), avec un plancher de 14px pour rester
    // lisible même sur un nom extrêmement long.
    const size = Math.max(14, BASE_NAME_SIZE * scale);
    document.documentElement.style.setProperty('--name-size', size + 'px');
  }

  fitNames();
  window.addEventListener('resize', fitNames);

  /* ============================================================
     OUVERTURE / FERMETURE D'UNE CARTE
     ============================================================ */
  /**
   * toggleCard(card)
   * ------------------------------------------------------------
   * Ouvre ou ferme la biographie d'une carte, avec une petite
   * chorégraphie en deux temps pour éviter que le texte de la bio
   * apparaisse/disparaisse brutalement pendant que la carte change
   * de largeur (animation CSS sur .card.active, voir style.css) :
   *
   *   OUVERTURE :
   *     1. On ajoute la classe .active tout de suite : la carte
   *        commence immédiatement à s'agrandir (transition CSS).
   *     2. Le texte de la bio, lui, n'apparaît (opacity: 1) qu'après
   *        300ms, une fois que la carte a eu le temps de s'élargir,
   *        pour éviter un texte qui se retrouve écrasé/compressé
   *        pendant l'agrandissement.
   *
   *   FERMETURE (ordre inverse) :
   *     1. Le texte disparaît (opacity: 0) tout de suite.
   *     2. On attend 300ms (le temps que le texte finisse de
   *        s'estomper) avant de retirer .active, ce qui relance le
   *        rétrécissement de la carte, et on recalcule les bornes
   *        de glisser-déposer (computeBounds()) puisque la largeur
   *        totale de la piste vient de changer.
   *
   * @param {HTMLElement} card — l'élément .card à ouvrir/fermer.
   */
  function toggleCard(card){
    const willOpen = !card.classList.contains('active');
    const bio = card.querySelector('.bio');

    if(willOpen){
      // 1. La carte s'agrandit et les cartes voisines s'éloignent
      card.classList.add('active');
      card.setAttribute('aria-expanded', 'true');

      // 2. Le texte apparaît après 0,3 seconde
      bio.style.opacity = '0';

      setTimeout(() => {
        bio.style.opacity = '1';
      }, 300);

    }else{
      // 1. Le texte disparaît
      bio.style.opacity = '0';

      // 2. Attendre 0,3 seconde avant de refermer la carte
      setTimeout(() => {
        card.classList.remove('active');
        card.setAttribute('aria-expanded', 'false');
        bio.style.opacity = '';
        computeBounds();
      }, 300);
    }
  }

  // Permet d'ouvrir/fermer une carte au clavier (accessibilité) :
  // une carte a tabIndex=0 et role="button", donc on écoute
  // Entrée et Espace comme on le ferait pour un vrai <button>.
  cards.forEach(card => {
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' '){
        e.preventDefault(); // évite le défilement de page sur Espace
        toggleCard(card);
      }
    });
  });

  const teamSection = document.getElementById('team');

  /* ============================================================
     CURSEUR PERSONNALISÉ (glisser / voir / fermer)
     ------------------------------------------------------------
     Sur les appareils à pointeur fin (souris/trackpad), le curseur
     système est masqué (voir style.css) et remplacé par une petite
     pastille ronde ("chip") qui suit la souris et affiche un
     libellé contextuel : "Glisser" au-dessus du fond, "Voir"
     au-dessus d'une carte fermée, "Fermer" au-dessus d'une carte
     déjà ouverte. Sur tactile (pointer: coarse), cette pastille est
     simplement masquée en CSS et on utilise le défilement natif.
     ============================================================ */
  /* "viewport" = la zone qu'on glisse = tout le bloc .team-row
     (en-tête + piste), pour que le texte suive les cartes. */
  const viewport = document.getElementById('teamRow');
  const chip = document.getElementById('cursorChip');
  const label = document.getElementById('cursorLabel');
  const dashL = document.getElementById('dashL');
  const dashR = document.getElementById('dashR');
  const isFinePointer = window.matchMedia('(pointer: fine)').matches;

  /**
   * setChipLabel(text, withDash)
   * ------------------------------------------------------------
   * Met à jour le texte affiché dans la pastille du curseur, avec
   * ou sans les petits tirets décoratifs de part et d'autre
   * (utilisés pour "Glisser", mais pas pour "Voir"/"Fermer").
   *
   * @param {string} text       — libellé à afficher.
   * @param {boolean} withDash  — true pour afficher "—" de chaque côté.
   */
  function setChipLabel(text, withDash){
    label.textContent = text;
    dashL.textContent = withDash ? '—' : '';
    dashR.textContent = withDash ? '—' : '';
  }

  let lastPointerX = null, lastPointerY = null;

  /**
   * refreshChipLabel()
   * ------------------------------------------------------------
   * Recalcule quel libellé afficher dans la pastille, en fonction
   * de ce qui se trouve actuellement sous le curseur : une carte
   * ouverte ("Fermer"), une carte fermée ("Voir"), ou rien de
   * particulier ("Glisser"). Ne fait rien pendant un glisser-
   * déposer actif (isDragging), pour ne pas interférer avec le
   * libellé "Glisser" déjà affiché à ce moment-là.
   */
  function refreshChipLabel(){
    if (lastPointerX === null || isDragging) return;
    const el = document.elementFromPoint(lastPointerX, lastPointerY);
    const overCard = el && el.closest('.card');
    chip.classList.toggle('cursor-chip--hover', !!overCard);
    if (overCard){
      setChipLabel(overCard.classList.contains('active') ? 'Fermer' : 'Voir', false);
    } else {
      setChipLabel('Glisser', true);
    }
  }

  if (isFinePointer){
    // Fait suivre la pastille à la souris et met à jour son
    // libellé en continu, sauf pendant un glisser actif (où le
    // libellé "Glisser" reste figé, voir refreshChipLabel()).
    viewport.addEventListener('pointermove', e => {
      chip.style.left = e.clientX + 'px';
      chip.style.top = e.clientY + 'px';
      lastPointerX = e.clientX;
      lastPointerY = e.clientY;

      if (isDragging){ chip.classList.remove('cursor-chip--hover'); setChipLabel('Glisser', true); return; }
      refreshChipLabel();
    });
    // Affiche/masque la pastille seulement quand la souris est
    // au-dessus de la zone équipe (elle ne doit pas apparaître
    // ailleurs sur la page).
    viewport.addEventListener('pointerenter', () => chip.classList.add('visible'));
    viewport.addEventListener('pointerleave', () => chip.classList.remove('visible'));
  }

  /* ============================================================
     GLISSER-DÉFILER AVEC INERTIE (pointeurs fins)
     Le transform s'applique sur tout le bloc .team-row : le texte
     d'intro et les cartes se déplacent donc ensemble, au même rythme.
     ------------------------------------------------------------
     Principe général : on ne laisse pas le navigateur défiler
     nativement ; à la place, on déplace le bloc .team-row via
     transform: translate3d(posX, 0, 0), où posX est une valeur en
     pixels toujours négative ou nulle (0 = tout à gauche, minX =
     butée de droite). Pendant le glisser, on suit le déplacement
     de la souris/du doigt en direct ; au relâchement, si le
     mouvement était assez rapide, on prolonge le défilement avec
     un effet d'inertie qui ralentit progressivement (runMomentum).
     ============================================================ */
  let posX = 0;          // position actuelle du bloc entier
  let minX = 0;           // borne gauche (négative)
  let isDragging = false; // vrai pendant un glisser actif (souris enfoncée)
  let startClientX = 0;   // position X de la souris au début du glisser
  let startPosX = 0;      // valeur de posX au début du glisser
  let lastClientX = 0;    // position X de la souris à la dernière frame
  let lastTime = 0;       // horodatage de la dernière frame (pour la vélocité)
  let velocity = 0;       // vitesse instantanée du glisser (px/frame)
  let momentumFrame = null; // id de la requestAnimationFrame en cours pour l'inertie
  let moved = 0;           // distance totale parcourue pendant le glisser en cours

  /**
   * computeBounds()
   * ------------------------------------------------------------
   * Recalcule la borne gauche (minX) du glisser-déposer, c'est-à-
   * dire jusqu'où on peut faire glisser le contenu vers la gauche
   * avant d'atteindre la fin de la piste. Dépend de la largeur
   * totale du contenu (rowWidth) et de la largeur visible de la
   * section (availableWidth) : si tout le contenu tient déjà à
   * l'écran, minX vaut 0 (aucun glisser possible). Appelée au
   * chargement, à chaque redimensionnement de fenêtre, et après la
   * fermeture d'une carte (sa largeur ayant changé).
   */
  function computeBounds(){
    const rowWidth = viewport.scrollWidth;        // largeur totale (en-tête + cartes)
    const availableWidth = teamSection.clientWidth; // largeur visible de la section
    minX = Math.min(0, availableWidth - rowWidth - 24);
  }
  computeBounds();
  window.addEventListener('resize', computeBounds);

  /**
   * applyTransform()
   * ------------------------------------------------------------
   * Applique la position horizontale actuelle (posX) au bloc
   * .team-row via une transformation CSS 3D (translate3d), plus
   * performante qu'animer "left" ou "margin" car elle profite de
   * l'accélération matérielle du navigateur.
   */
  function applyTransform(){
    viewport.style.transform = 'translate3d(' + posX + 'px,0,0)';
  }

  /**
   * clamp(v, lo, hi)
   * ------------------------------------------------------------
   * Fonction utilitaire classique : ramène la valeur v à
   * l'intérieur de l'intervalle [lo, hi] si elle en sort.
   *
   * @param {number} v  — valeur à contraindre.
   * @param {number} lo — borne minimale.
   * @param {number} hi — borne maximale.
   * @returns {number} v si déjà dans l'intervalle, sinon lo ou hi.
   */
  function clamp(v, lo, hi){ return Math.max(lo, Math.min(hi, v)); }

  /**
   * stopMomentum()
   * ------------------------------------------------------------
   * Annule l'animation d'inertie en cours (s'il y en a une), par
   * exemple quand l'utilisateur reclique/retouche l'écran avant
   * que le défilement inertiel ne soit terminé.
   */
  function stopMomentum(){
    if (momentumFrame){ cancelAnimationFrame(momentumFrame); momentumFrame = null; }
  }

  /**
   * runMomentum()
   * ------------------------------------------------------------
   * Boucle d'animation (via requestAnimationFrame) qui prolonge le
   * défilement après le relâchement du glisser, en simulant un
   * frottement : la vélocité est réduite de 8% à chaque frame
   * (velocity *= 0.92) jusqu'à devenir négligeable (< 0.4px), ou
   * jusqu'à ce que le contenu atteigne une des deux bornes (0 ou
   * minX), moment où l'inertie s'arrête net.
   */
  function runMomentum(){
    velocity *= 0.92;
    posX = clamp(posX + velocity, minX, 0);
    applyTransform();
    if (Math.abs(velocity) > 0.4 && posX > minX && posX < 0){
      momentumFrame = requestAnimationFrame(runMomentum);
    }
  }

  if (isFinePointer){
    // ---- Souris/trackpad : glisser-déposer avec la Pointer Events API ----

    // Début du glisser : on ne réagit qu'au clic gauche (button 0),
    // on mémorise la position de départ et on stoppe une éventuelle
    // inertie encore en cours.
    viewport.addEventListener('pointerdown', e => {
      if (e.button !== undefined && e.button !== 0) return;
      isDragging = true;
      moved = 0;
      stopMomentum();
      startClientX = lastClientX = e.clientX;
      startPosX = posX;
      lastTime = performance.now();
      velocity = 0;
      viewport.classList.add('dragging');
      // setPointerCapture garantit que les événements pointermove/up
      // continuent d'être reçus par "viewport" même si le curseur
      // sort de cet élément pendant le glisser.
      viewport.setPointerCapture(e.pointerId);
    });

    // Pendant le glisser : on déplace le bloc en direct (dx = delta
    // par rapport au point de départ), et on calcule au passage une
    // vélocité instantanée (distance / temps écoulé, ramenée à une
    // base de 16ms ~ 60fps) qui servira à l'inertie au relâchement.
    viewport.addEventListener('pointermove', e => {
      if (!isDragging) return;
      const dx = e.clientX - startClientX;
      moved = Math.max(moved, Math.abs(dx));
      posX = clamp(startPosX + dx, minX, 0);
      applyTransform();

      const now = performance.now();
      const dt = now - lastTime;
      if (dt > 0){
        velocity = (e.clientX - lastClientX) / dt * 16;
        lastTime = now;
        lastClientX = e.clientX;
      }
    });

    /**
     * endDrag(e)
     * ----------------------------------------------------------
     * Appelée au relâchement du bouton (pointerup) ou si le
     * glisser est annulé par le système (pointercancel).
     *  - Si la vélocité au moment du relâchement est suffisante,
     *    on lance l'inertie (runMomentum).
     *  - Si le déplacement total a été très faible (< 6px), on
     *    considère qu'il s'agissait d'un simple clic (pas d'un
     *    glisser) et on ouvre/ferme la carte sous le curseur.
     */
    function endDrag(e){
      if (!isDragging) return;
      isDragging = false;
      viewport.classList.remove('dragging');
      if (Math.abs(velocity) > 0.5) runMomentum();

      if (moved < 6){
        const el = document.elementFromPoint(e.clientX, e.clientY);
        const card = el && el.closest('.card');
        if (card) toggleCard(card);
      }
      refreshChipLabel();
    }
    viewport.addEventListener('pointerup', endDrag);
    viewport.addEventListener('pointercancel', endDrag);

    // Molette de souris/trackpad : on ne réagit qu'au défilement
    // majoritairement horizontal (deltaX > deltaY), pour laisser le
    // défilement vertical normal de la page fonctionner ailleurs.
    // preventDefault() empêche le navigateur de défiler la page en
    // plus de notre propre déplacement horizontal.
    viewport.addEventListener('wheel', e => {
      if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) return;
      e.preventDefault();
      stopMomentum();
      posX = clamp(posX - e.deltaX, minX, 0);
      applyTransform();
    }, { passive:false });
  } else {
    /* pointeurs tactiles : défilement natif (voir CSS) + tap pour ouvrir */
    // Sur mobile/tablette, on laisse le navigateur gérer le défilement
    // horizontal nativement (overflow-x: auto en CSS, voir la media
    // query "pointer: coarse" dans style.css) ; on se contente ici de
    // détecter un tap (déplacement < 6px) pour ouvrir/fermer une carte,
    // afin de distinguer un tap d'un geste de défilement.
    let touchStartX = 0, touchMoved = 0;
    viewport.addEventListener('touchstart', e => {
      touchStartX = e.touches[0].clientX;
      touchMoved = 0;
    }, { passive:true });
    viewport.addEventListener('touchmove', e => {
      touchMoved = Math.max(touchMoved, Math.abs(e.touches[0].clientX - touchStartX));
    }, { passive:true });
    viewport.addEventListener('touchend', e => {
      if (touchMoved < 6){
        const card = e.target.closest('.card');
        if (card) toggleCard(card);
      }
    });
  }
  } // fin de initTeam(PEOPLE)
})();

/* ================================================================
   SCRIPT — Section "S'impliquer"
   ------------------------------------------------------------
   Gère le formulaire de contact indépendant de la section équipe :
   validation des champs (prénom, nom, courriel), activation/
   désactivation du champ "Autre :", affichage d'un toast de
   confirmation, et téléchargement des données saisies sous forme
   de fichier .json (aucun envoi réseau : tout reste côté navigateur,
   voir downloadJSON() plus bas).
   ================================================================ */
(function(){
  const form = document.getElementById('involve-form');
  const autreCheck = document.getElementById('autre-check');
  const autreTexte = document.getElementById('autre-texte');
  const toast = document.getElementById('involve-toast');
  const toastText = document.getElementById('involve-toast-text');

  // Le champ texte "Précisez votre intérêt" n'est activable que si
  // la case "Autre :" est cochée ; on le vide et on le désactive
  // dès qu'elle est décochée, et on lui donne le focus dès qu'elle
  // est cochée (pour guider directement l'utilisateur vers la saisie).
  autreCheck.addEventListener('change', function(){
    autreTexte.disabled = !this.checked;
    if(!this.checked){ autreTexte.value = ''; }
    else { autreTexte.focus(); }
  });

  /**
   * showToast(msg)
   * ------------------------------------------------------------
   * Affiche une petite notification temporaire (le "toast") en
   * bas de l'écran avec le message fourni, puis la masque
   * automatiquement après 3,8 secondes. clearTimeout() annule un
   * précédent minuteur en cours si un nouveau toast est déclenché
   * avant que l'ancien n'ait eu le temps de disparaître.
   *
   * @param {string} msg — texte à afficher dans le toast.
   */
  function showToast(msg){
    toastText.textContent = msg;
    toast.classList.add('show');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(()=> toast.classList.remove('show'), 3800);
  }

  /**
   * setError(fieldId, msg)
   * ------------------------------------------------------------
   * Affiche (ou efface, si msg est vide/falsy) un message d'erreur
   * sous le champ dont l'id est fieldId, et bascule la classe
   * "invalid" sur le champ correspondant pour le mettre en
   * évidence visuellement (voir style.css, .field input.invalid).
   *
   * Suppose l'existence d'un élément avec l'id "err-" + fieldId
   * juste sous chaque champ concerné (voir index.html).
   *
   * @param {string} fieldId — id du champ input (ex. "prenom").
   * @param {string} msg     — message d'erreur, ou "" pour l'effacer.
   */
  function setError(fieldId, msg){
    const input = document.getElementById(fieldId);
    const err = document.getElementById('err-' + fieldId);
    if(msg){
      input.classList.add('invalid');
      err.textContent = msg;
    } else {
      input.classList.remove('invalid');
      err.textContent = '';
    }
  }

  /**
   * validEmail(v)
   * ------------------------------------------------------------
   * Vérifie qu'une chaîne ressemble à une adresse courriel valide,
   * via une expression régulière volontairement simple (pas de
   * validation exhaustive selon la RFC, juste "quelque chose@
   * quelque chose.quelque chose" sans espaces).
   *
   * @param {string} v — valeur à tester.
   * @returns {boolean} true si le format ressemble à un courriel.
   */
  function validEmail(v){
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }

  /**
   * validate()
   * ------------------------------------------------------------
   * Valide les champs obligatoires du formulaire (prénom, nom,
   * courriel) avant l'envoi, et met à jour les messages d'erreur
   * sous chaque champ via setError(). Retourne un booléen global
   * indiquant si TOUS les champs obligatoires sont valides.
   *
   * @returns {boolean} true si le formulaire peut être soumis.
   */
  function validate(){
    let ok = true;
    const prenom = document.getElementById('prenom').value.trim();
    const nom = document.getElementById('nom').value.trim();
    const courriel = document.getElementById('courriel').value.trim();

    if(!prenom){ setError('prenom', 'Le prénom est requis.'); ok = false; } else { setError('prenom', ''); }
    if(!nom){ setError('nom', 'Le nom est requis.'); ok = false; } else { setError('nom', ''); }
    if(!courriel){ setError('courriel', 'Le courriel est requis.'); ok = false; }
    else if(!validEmail(courriel)){ setError('courriel', 'Format de courriel invalide.'); ok = false; }
    else { setError('courriel', ''); }

    return ok;
  }

  /**
   * downloadJSON(data)
   * ------------------------------------------------------------
   * Déclenche le téléchargement, côté navigateur uniquement (sans
   * aucun appel réseau ni serveur), d'un fichier .json contenant
   * les données fournies. Fonctionnement :
   *   1. On sérialise l'objet en texte JSON indenté.
   *   2. On l'enveloppe dans un Blob (fichier "virtuel" en mémoire).
   *   3. On crée une URL temporaire pointant vers ce Blob.
   *   4. On crée un lien <a download="..."> invisible, on simule
   *      un clic dessus pour déclencher le téléchargement, puis on
   *      le retire du DOM et on libère l'URL temporaire.
   *
   * Le nom de fichier inclut un horodatage (ex.
   * "simpliquer-2026-09-18T12-34-56-789Z.json") pour éviter que
   * deux soumissions successives n'écrasent le même fichier.
   *
   * @param {Object} data — objet à sérialiser et télécharger.
   */
  function downloadJSON(data){
    const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const stamp = new Date().toISOString().replace(/[:.]/g,'-');
    a.href = url;
    a.download = 'simpliquer-' + stamp + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url); // libère la mémoire occupée par le Blob
  }

  // Gestionnaire de soumission du formulaire : empêche le
  // rechargement de page par défaut, valide les champs, puis
  // construit un objet "data" avec toutes les réponses (y compris
  // les cases à cocher "interets" et l'éventuel texte "Autre :"),
  // le télécharge en .json, affiche un toast de confirmation et
  // réinitialise le formulaire pour une éventuelle nouvelle saisie.
  form.addEventListener('submit', function(e){
    e.preventDefault();
    if(!validate()){
      showToast('Veuillez corriger les champs en rouge.');
      return;
    }

    // Récupère la liste des intérêts cochés parmi les 4 cases à
    // cocher "interets", et y ajoute le texte libre de "Autre :"
    // s'il a été rempli et coché.
    const interets = Array.from(form.querySelectorAll('input[name="interets"]:checked')).map(i => i.value);
    if(autreCheck.checked && autreTexte.value.trim()){
      interets.push('Autre : ' + autreTexte.value.trim());
    }

    const data = {
      prenom: document.getElementById('prenom').value.trim(),
      nom: document.getElementById('nom').value.trim(),
      courriel: document.getElementById('courriel').value.trim(),
      organisation: document.getElementById('organisation').value.trim(),
      interets: interets,
      infolettre: document.getElementById('newsletter').checked,
      date_soumission: new Date().toISOString()
    };

    downloadJSON(data);
    showToast('Demande envoyée. Merci pour votre intérêt !');
    form.reset();
    // form.reset() décoche aussi "newsletter" (qui est coché par
    // défaut dans le HTML) et réactive "autre-texte" malgré son
    // attribut disabled initial : on remet donc ces deux champs
    // manuellement dans leur état par défaut voulu.
    autreTexte.disabled = true;
    document.getElementById('newsletter').checked = true;
  });
})();
