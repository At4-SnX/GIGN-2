# 🪖 GIGN RP — Bot d'identification / NIGEND

Bot Discord.js v14 prêt à déployer sur **Railway**.

## Ce que fait le bot

1. Un membre tape **`!id`** dans un salon (accessible à tout le monde), ou lance la commande slash **`/identification`**.
2. Le bot répond avec un message **Components V2** (nouveau format Discord) : titre, explication de la procédure, **la clause de confidentialité**, et l'image ci-jointe affichée en dessous du texte, avec un bouton **🪪 Commencer l'identification**.
3. Le clic sur le bouton ouvre un **formulaire Discord** (modale) avec 3 champs : Prénom, Nom, et un champ où la personne doit **recopier "J'ACCEPTE"** pour valider l'accord de confidentialité.
4. Si le mot-clé est correct :
   - un **matricule NIGEND** est généré aléatoirement (unique, jamais réattribué) ;
   - le **pseudo du membre est remplacé** par ce matricule (ex : `NIGEND 483920`) ;
   - une confirmation privée (Components V2) est envoyée à la personne ;
   - si `INTEGRATION_ANNOUNCE_CHANNEL_ID` est configuré, une annonce publique est postée.
5. Si le mot-clé est incorrect, l'intégration n'est pas validée ; la personne peut relancer `!id` / `/identification`.
6. Si la personne a déjà un NIGEND, le bot le lui rappelle au lieu d'en générer un nouveau.
7. **Statut du bot** : activité de type **Streaming** ("En direct") avec le texte `🔗discord.gg/bordeauxrp`.
   - ⚠️ **Limitation Discord** : le badge violet "En direct" ne s'affiche vraiment que si le lien associé pointe vers **twitch.tv** ou **youtube.com**. Renseigne un vrai lien dans `STREAM_URL` si tu veux garantir le badge — le texte affiché reste `🔗discord.gg/bordeauxrp` dans tous les cas.

## 1. Modifier le bot (tout est dans `config.js`)

Titres, textes, clause de confidentialité, mot-clé à recopier (`CONFIDENTIALITY_KEYWORD`), commande texte (`TEXT_COMMAND`, `!id` par défaut), format du matricule (`NIGEND_DIGITS`), format du pseudo (`NICKNAME_FORMAT`) — tout se change dans ce seul fichier.

Pour changer l'image affichée dans le message d'introduction : remplace `assets/identification.png` par ta propre image (même nom, ou change `INTRO_IMAGE_PATH` dans `config.js`).

## 2. Créer l'application Discord

1. Va sur https://discord.com/developers/applications → **New Application**.
2. Onglet **Bot** → **Reset Token** → copie le token (à mettre dans `DISCORD_TOKEN`).
3. Toujours dans l'onglet **Bot**, active l'intent privilégié :
   - **Message Content Intent** (nécessaire pour lire la commande texte `!id`)
4. Onglet **OAuth2 → URL Generator** : coche `bot` + `applications.commands`, permissions `Send Messages`, `Use Slash Commands`, **`Manage Nicknames`** (indispensable pour renommer les membres), puis invite le bot avec le lien généré.

⚠️ Le bot doit avoir un **rôle placé au-dessus** des membres dont il doit changer le pseudo (hiérarchie des rôles Discord), sinon le changement de pseudo échoue silencieusement (la personne reçoit alors un message l'informant qu'un gradé doit le faire manuellement).

## 3. Récupérer les IDs

Active le **Mode développeur** (Discord → Paramètres → Avancés), puis clic droit :
- sur le serveur → Copier l'ID → `GUILD_ID`
- (optionnel) sur le salon d'annonce d'intégration → Copier l'ID → `INTEGRATION_ANNOUNCE_CHANNEL_ID`

## 4. Déployer sur Railway

1. Crée un nouveau projet Railway → **Deploy from GitHub repo** (ou upload direct du dossier).
2. Dans l'onglet **Variables**, ajoute les variables du fichier `.env.example` (jamais le fichier `.env` lui-même).
3. Railway détecte automatiquement `package.json` et lance `npm install` puis `npm start`.
4. **Recommandé** : ajoute un **Volume** Railway monté sur `/app/data` pour que la liste des NIGEND attribués survive aux redéploiements.

## 5. Test en local (optionnel)

```bash
npm install
cp .env.example .env   # puis remplis les valeurs
npm start
```

## Notes

- Les NIGEND attribués sont stockés dans `data/nigend.json` (ignoré par Git — ne le commit jamais, utilise un Volume Railway pour la persistance en production).
- Un NIGEND n'est jamais réattribué à quelqu'un d'autre : la génération vérifie l'unicité avant de valider.
