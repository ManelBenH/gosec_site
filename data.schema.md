# Schéma de `data.json`

Le format JSON standard n'accepte pas les commentaires : en ajouter
directement dans `data.json` empêcherait `fetch('data.json').then(r =>
r.json())` de fonctionner (la page « équipe » resterait vide). Ce
fichier documente donc, à côté, le sens de chaque champ.

`data.json` est un tableau contenant un objet par personne (9 au
total). Chaque objet accepte les champs suivants :

| Champ      | Type   | Obligatoire | Description |
|------------|--------|:-----------:|-------------|
| `name`     | string | oui | Nom complet affiché sur la carte et dans le libellé d'accessibilité (`aria-label`). |
| `role`     | string | non (peut être `""`) | Rôle/titre affiché sous le nom, précédé d'un « + » dans le HTML généré. |
| `initials` | string | non (peut être `""`) | Initiales affichées tant qu'aucune photo n'est chargée (masquées automatiquement dès que `img` est renseigné). |
| `img`      | string | non (peut être `""`) | Chemin vers la photo de la personne, relatif à `index.html` — ex. `"images/manel.jpg"`. Laisser `""` pour garder les initiales par défaut. |
| `hue`      | number | non | Teinte de 0 à 360, posée en variable CSS `--hue` sur la carte (réservée à d'éventuelles déclinaisons de couleur par personne dans `style.css`). |
| `linkedin` | string | non (peut être `""`) | URL complète du profil LinkedIn. Si vide, aucune vignette QR code LinkedIn n'est affichée pour cette personne. |
| `github`   | string | non (peut être `""`) | URL complète du profil GitHub. Si vide, aucune vignette QR code GitHub n'est affichée. Le pseudo affiché est extrait automatiquement du dernier segment de l'URL (ex. `.../ManelBenH` → `ManelBenH`). |
| `bio`      | string | oui | Texte de la biographie, affiché quand on clique/appuie sur Entrée sur la carte pour l'ouvrir. |

## Exemple minimal d'une entrée

```json
{
  "name": "Prénom Nom",
  "role": "",
  "initials": "PN",
  "img": "",
  "hue": 200,
  "linkedin": "",
  "github": "",
  "bio": "Texte de présentation de la personne."
}
```

## Pour ajouter/modifier une personne

1. Ouvrez `data.json`.
2. Copiez un objet existant (entre `{` et `}`), séparez-le du
   précédent par une virgule.
3. Remplissez les champs selon le tableau ci-dessus.
4. Pour ajouter une photo : déposez le fichier image dans un
   dossier `images/` à côté de `index.html`, et indiquez son chemin
   dans `img` (ex. `"images/camille.jpg"`).

Ce fichier est chargé et interprété par `script.js` — voir les
commentaires détaillés dans la fonction `initTeam()` de ce fichier
pour le détail du traitement de chaque champ.
