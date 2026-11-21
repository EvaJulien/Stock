# La cuisine d'Eva — v2

Appli de recettes, menu de la semaine, liste de courses et stock automatique.
Toutes les données restent sur le téléphone (rien n'est envoyé en ligne).

## Contenu du dossier

| Fichier | Rôle |
|---|---|
| `index.html` | La page de l'appli |
| `app.js` | Tout le fonctionnement (recettes, semaine, courses, stock) |
| `style.css` | Le style (couleurs pastel, polices rondes) |
| `seed.js` | Les recettes de départ (reprises de la v1, dont les pâtes aux champignons d'Eva) |
| `manifest.webmanifest`, `sw.js` | Ce qui rend l'appli installable et utilisable hors connexion |
| `version.json` | Le numéro de la version en ligne (sert au bandeau de mise à jour) |
| `icons/` | Icône de l'appli + dossier `ingredients/` pour les icônes d'ingrédients |

## Tester sur l'ordinateur

Double-cliquer sur `index.html` suffit pour voir l'appli dans le navigateur
(l'installation et le hors-connexion ne marchent qu'une fois l'appli en ligne).

## Mettre en ligne (gratuit) pour l'installer sur les téléphones

1. Créer un compte sur github.com, puis un dépôt public (ex. `cuisine-eva`).
2. « Add file » → « Upload files » : glisser **tout le contenu** de ce dossier.
3. Settings → Pages → Branch : `main` → Save. Après 1-2 minutes, l'adresse
   `https://<ton-pseudo>.github.io/cuisine-eva/` est prête.
4. Sur iPhone : ouvrir l'adresse dans **Safari** → bouton Partager → « Sur l'écran d'accueil ».
   Sur Android : Chrome → menu ⋮ → « Installer l'application ».
5. Toujours ouvrir l'appli depuis l'icône (sur iPhone, Safari et l'icône ont des données séparées).

## Mettre à jour l'appli sur les téléphones

Le numéro de version est écrit à **4 endroits**, qui doivent toujours être identiques :

| Où | Quoi |
|---|---|
| `app.js` (1re ligne de code) | `var APP_VERSION = '2.16.0';` |
| `version.json` | `{"version": "2.16.0"}` |
| `index.html` | les `?v=2.16.0` après `style.css`, `seed.js` et `app.js` |
| `sw.js` | `var VERSION = '2.16.0';` |

Marche à suivre à chaque nouvelle version :

1. Changer le numéro aux 4 endroits (Claude le fait et indique les fichiers à envoyer).
2. Sur GitHub, envoyer **tous les fichiers modifiés en une fois** (dont `version.json`),
   puis cliquer sur « Commit changes ». Maximum 100 fichiers par envoi : pour beaucoup
   d'icônes, les envoyer directement dans `icons/ingredients-pixel` en plusieurs fois.
3. Attendre la **coche verte** à côté du dernier envoi (1 à 2 minutes).
4. Ouvrir l'appli sur le téléphone (ou revenir dessus) : un bandeau
   « Nouvelle version disponible » apparaît → « Mettre à jour ».
   Les données (recettes, semaine, stock) ne sont jamais effacées.

Si le bandeau rouge « La version x.y.z ne s'installe pas » apparaît : un fichier
n'a pas été remplacé sur GitHub (souvent `app.js` ou `style.css`). Renvoyer tous les
fichiers, attendre la coche verte, puis « Réessayer ».

Dans Réglages → Mise à jour : la version installée, « Vérifier les mises à jour »
et « Forcer la mise à jour » (vide le cache de l'appli et recharge, sans toucher aux données).

## Récupérer les recettes de la v1

Les recettes présentes dans la v1 au 16/11/2026 sont déjà incluses. Si Eva en a ajouté
d'autres depuis : dans la v1, Réglages → « Copier une sauvegarde », puis dans la v2,
Réglages → « Restaurer une ancienne sauvegarde copiée (texte) ».

## Icônes d'ingrédients

Déposer les images dans `icons/ingredients/` : carré 256 px, fond transparent,
format `.webp`, nom en minuscules avec tirets (`tomate.webp`, `pois-chiches.webp`,
`huile-olive.webp`). Sans image, l'appli affiche une pastille colorée avec l'initiale.
Les variantes de noms (tomates cerises → tomate) sont dans `ICON_ALIAS` en haut de `app.js`.
