// ============================================================================
//  CONFIG.JS — Tout ce qu'il y a à modifier se trouve dans ce fichier.
//  Les valeurs sensibles (token, IDs) viennent du fichier .env (voir .env.example)
// ============================================================================

module.exports = {
  // --- Discord ------------------------------------------------------------
  TOKEN: process.env.DISCORD_TOKEN,
  GUILD_ID: process.env.GUILD_ID, // serveur "Bordeaux RP"

  // Salon où est annoncée publiquement chaque intégration confirmée (optionnel)
  // Laisse vide dans le .env pour désactiver l'annonce publique.
  INTEGRATION_ANNOUNCE_CHANNEL_ID: process.env.INTEGRATION_ANNOUNCE_CHANNEL_ID || null,

  // --- Statut du bot ----------------------------------------------------------
  PRESENCE_STATUS: 'online', // 'online' | 'idle' | 'dnd' | 'invisible'
  STATUS_TEXT: '🔗discord.gg/bordeauxrp',
  // ⚠️ Le badge violet "En direct" ne s'affiche que si cette URL pointe vers
  // twitch.tv ou youtube.com. Mets un vrai lien Twitch/YouTube ici si tu veux
  // garantir le badge ; le texte affiché (STATUS_TEXT) restera le lien Discord.
  STREAM_URL: process.env.STREAM_URL || 'https://discord.gg/bordeauxrp',

  // --- Commande /identification ------------------------------------------------
  COMMAND_NAME: 'identification',
  COMMAND_DESCRIPTION: 'Démarrer la procédure d\'identification et obtenir votre NIGEND',

  // Commande texte équivalente, tapable par n'importe qui dans un salon (ex: "!id")
  TEXT_COMMAND: '!id',

  // --- Message d'introduction (Components V2, image en dessous du texte) -----
  INTRO_IMAGE_PATH: './assets/identification.png',
  INTRO_TITLE: '<:Insigne_GIGN:1551924487270961262> - PROCEDURE D\'IDENTIFICATION — GIGN',
  INTRO_MESSAGE:
    '## <:Blue_fleche:1551924312498241616> Bienvenue dans la procédure d\'identification du **GIGN**.\n\n' +
    'Cette étape permet d\'enregistrer votre identité RP et de vous attribuer votre matricule **NIGEND**, ' +
    'qui remplacera votre pseudo sur ce serveur.\n\n' +
    '<:Design_sans_titre__5_removebgpre:1552020071902093345> **Clause de confidentialité :** > en poursuivant, vous reconnaissez que les opérations, informations et ' +
    'procédures internes de l\'unité sont strictement confidentielles. Toute divulgation non autorisée, à ' +
    'l\'intérieur comme à l\'extérieur du serveur, pourra entraîner des sanctions disciplinaires immédiates ' +
    'pouvant aller jusqu\'à l\'exclusion.\n\n' +
    '*<:Design_sans_titre__5_removebgpre:1552020071902093345> Cliquez ci-dessous pour ouvrir le formulaire d\'identification.*',
  INTRO_COLOR: '#1c2938',
  INTRO_FOOTER: '<:Insigne_GIGN:1551924487270961262> - Gendarmerie Nationale — GIGN',
  INTRO_BUTTON_LABEL: '🪪 Commencer l\'identification',

  // --- Formulaire (modale Discord) ---------------------------------------------
  MODAL_TITLE: 'Identification — GIGN',
  MODAL_PRENOM_LABEL: 'Prénom (RP)',
  MODAL_NOM_LABEL: 'Nom (RP)',
  // Champ d'accord de confidentialité intégré au formulaire : la personne doit
  // recopier ce mot-clé exactement pour que son intégration soit validée.
  MODAL_CONFIDENTIALITY_LABEL: 'Tapez J\'ACCEPTE pour valider',
  MODAL_CONFIDENTIALITY_PLACEHOLDER: 'J\'ACCEPTE',
  CONFIDENTIALITY_KEYWORD: 'J\'ACCEPTE',
  CONFIDENTIALITY_REFUSED_MESSAGE:
    '❌ Ton intégration n\'a pas été validée : il fallait recopier exactement **"J\'ACCEPTE"** dans le champ prévu.\n' +
    'Relance `/identification` pour réessayer.',

  // --- Génération du NIGEND ------------------------------------------------
  NIGEND_DIGITS: 6, // nombre de chiffres du matricule (ex: 6 => 000000 à 999999)
  // {nigend} est remplacé par le matricule généré (ex: 483920)
  NICKNAME_FORMAT: '{nom} | {nigend}', // devient le nouveau pseudo de la personne

  // --- Message de confirmation (visible uniquement par la personne) --------
  CONFIRM_TITLE: '🪖 Intégration confirmée — GIGN',
  CONFIRM_MESSAGE:
    'Identité enregistrée : **{prenom} {nom}**\n' +
    'Votre **NIGEND** a été généré : **{nigend}**\n\n' +
    'Votre pseudo a été mis à jour en conséquence. Bienvenue au sein de l\'unité.',
  CONFIRM_FOOTER: 'Gendarmerie Nationale — GIGN RP',
  CONFIRM_NICKNAME_FAILED_NOTE:
    '\n\n <:Design_sans_titre__5_removebgpre:1552020071902093345> Votre pseudo n\'a pas pu être modifié automatiquement (permissions insuffisantes). ' +
    'Un gradé devra le faire manuellement.',
  ALREADY_REGISTERED_MESSAGE:
    'Vous êtes déjà identifié(e) : **{prenom} {nom}** — **NIGEND {nigend}**.',

  // --- Annonce publique (si INTEGRATION_ANNOUNCE_CHANNEL_ID est défini) ------
  ANNOUNCE_TITLE: '<:Insigne_GIGN:1551924487270961262> - Nouvelle intégration confirmée',
  ANNOUNCE_MESSAGE: '<:Design_sans_titre__5_removebgpre:1552020071902093345> **{user}** a validé son identification. Matricule attribué : **NIGEND {nigend}**.',
  ANNOUNCE_COLOR: '#1c2938',
  ANNOUNCE_FOOTER: 'Gendarmerie Nationale — GIGN',
};
