// ============================================================================
//  GIGN RP — BOT D'IDENTIFICATION / NIGEND
//  - /identification : affiche un message Components V2 (image + explication)
//    avec un bouton qui ouvre un formulaire Discord (prénom, nom, accord de
//    confidentialité à recopier).
//  - Génère un matricule NIGEND aléatoire et unique, remplace le pseudo du membre
//  - Statut du bot en "En direct" (Streaming) avec un lien configurable
//  - Toute la configuration se trouve dans config.js et .env
// ============================================================================

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const {
  Client,
  GatewayIntentBits,
  ActivityType,
  MessageFlags,
  SlashCommandBuilder,
  REST,
  Routes,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder,
  EmbedBuilder,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
} = require('discord.js');
const config = require('./config');

// ----------------------------------------------------------------------------
// Petite base de données locale (JSON) : userId <-> NIGEND
// ----------------------------------------------------------------------------
const DATA_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'nigend.json');

function loadDb() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, JSON.stringify({ records: [] }, null, 2));
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  } catch (err) {
    console.error('Impossible de charger data/nigend.json, base vide utilisée.', err);
    return { records: [] };
  }
}

function saveDb(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

let db = loadDb();

function findRecord(userId) {
  return db.records.find((r) => r.userId === userId);
}

function generateUniqueNigend() {
  const max = 10 ** config.NIGEND_DIGITS;
  let nigend;
  do {
    nigend = String(Math.floor(Math.random() * max)).padStart(config.NIGEND_DIGITS, '0');
  } while (db.records.some((r) => r.nigend === nigend));
  return nigend;
}

// ----------------------------------------------------------------------------
// Client Discord
// ----------------------------------------------------------------------------
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages, // requis pour lire la commande texte !id
    GatewayIntentBits.MessageContent, // requis pour lire le contenu des messages (intent privilégié)
  ],
});

client.once('ready', async () => {
  console.log(`✅ Connecté en tant que ${client.user.tag}`);

  client.user.setPresence({
    status: config.PRESENCE_STATUS,
    activities: [
      {
        name: config.STATUS_TEXT, // 🔗discord.gg/bordeauxrp
        type: ActivityType.Streaming,
        url: config.STREAM_URL,
      },
    ],
  });

  await registerSlashCommands();
});

// ----------------------------------------------------------------------------
// Enregistrement de la commande /identification
// ----------------------------------------------------------------------------
async function registerSlashCommands() {
  const commands = [
    new SlashCommandBuilder().setName(config.COMMAND_NAME).setDescription(config.COMMAND_DESCRIPTION),
  ];

  const rest = new REST({ version: '10' }).setToken(config.TOKEN);
  try {
    await rest.put(Routes.applicationGuildCommands(client.user.id, config.GUILD_ID), { body: commands });
    console.log(`✅ Commande /${config.COMMAND_NAME} enregistrée sur le serveur.`);
  } catch (err) {
    console.error('Erreur lors de l\'enregistrement des commandes :', err);
  }
}

// ----------------------------------------------------------------------------
// Construit le message Components V2 d'introduction (image + explication + bouton)
// ----------------------------------------------------------------------------
function buildIntroPayload() {
  const attachment = new AttachmentBuilder(path.join(__dirname, config.INTRO_IMAGE_PATH), {
    name: 'identification.png',
  });

  const startButton = new ButtonBuilder()
    .setCustomId('nigend-start-identification')
    .setLabel(config.INTRO_BUTTON_LABEL)
    .setStyle(ButtonStyle.Primary);

  const container = new ContainerBuilder()
    .setAccentColor(parseInt(config.INTRO_COLOR.replace('#', ''), 16))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${config.INTRO_TITLE}\n${config.INTRO_MESSAGE}`))
    .addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems(
        new MediaGalleryItemBuilder().setURL('attachment://identification.png').setDescription('Identification GIGN')
      )
    )
    .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${config.INTRO_FOOTER}`))
    .addActionRowComponents(new ActionRowBuilder().addComponents(startButton));

  return { components: [container], files: [attachment] };
}

// ----------------------------------------------------------------------------
// Commande texte "!id" : accessible à tout le monde dans le salon
// ----------------------------------------------------------------------------
client.on('messageCreate', async (message) => {
  try {
    if (message.author.bot) return;
    if (message.content.trim().toLowerCase() !== config.TEXT_COMMAND.toLowerCase()) return;

    const existing = findRecord(message.author.id);
    if (existing) {
      return message.reply(
        config.ALREADY_REGISTERED_MESSAGE
          .replace('{prenom}', existing.prenom)
          .replace('{nom}', existing.nom)
          .replace('{nigend}', existing.nigend)
      );
    }

    const payload = buildIntroPayload();
    await message.channel.send({ ...payload, flags: MessageFlags.IsComponentsV2 });
  } catch (err) {
    console.error('Erreur lors du traitement de la commande texte !id :', err);
  }
});

// ----------------------------------------------------------------------------
// Interactions
// ----------------------------------------------------------------------------
client.on('interactionCreate', async (interaction) => {
  try {
    if (interaction.isChatInputCommand() && interaction.commandName === config.COMMAND_NAME) {
      return handleIdentificationCommand(interaction);
    }
    if (interaction.isButton() && interaction.customId === 'nigend-start-identification') {
      return handleStartButton(interaction);
    }
    if (interaction.isModalSubmit() && interaction.customId === 'identification-modal') {
      return handleModalSubmit(interaction);
    }
  } catch (err) {
    console.error('Erreur lors du traitement de l\'interaction :', err);
    if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: '❌ Une erreur est survenue, réessaie plus tard.', ephemeral: true });
    }
  }
});

// --- Étape 1 : /identification -> message Components V2 (image + explication) --
async function handleIdentificationCommand(interaction) {
  const existing = findRecord(interaction.user.id);
  if (existing) {
    return interaction.reply({
      content: config.ALREADY_REGISTERED_MESSAGE
        .replace('{prenom}', existing.prenom)
        .replace('{nom}', existing.nom)
        .replace('{nigend}', existing.nigend),
      ephemeral: true,
    });
  }

  const payload = buildIntroPayload();

  await interaction.reply({
    ...payload,
    flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
  });
}

// --- Étape 2 : clic sur le bouton -> ouvre le formulaire Discord ------------
async function handleStartButton(interaction) {
  if (findRecord(interaction.user.id)) {
    return interaction.reply({ content: '✅ Ton identification est déjà validée.', ephemeral: true });
  }

  const modal = new ModalBuilder().setCustomId('identification-modal').setTitle(config.MODAL_TITLE);

  const prenomInput = new TextInputBuilder()
    .setCustomId('prenom')
    .setLabel(config.MODAL_PRENOM_LABEL)
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(32);

  const nomInput = new TextInputBuilder()
    .setCustomId('nom')
    .setLabel(config.MODAL_NOM_LABEL)
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(32);

  const confidentialiteInput = new TextInputBuilder()
    .setCustomId('confidentialite')
    .setLabel(config.MODAL_CONFIDENTIALITY_LABEL)
    .setStyle(TextInputStyle.Short)
    .setPlaceholder(config.MODAL_CONFIDENTIALITY_PLACEHOLDER)
    .setRequired(true)
    .setMaxLength(16);

  modal.addComponents(
    new ActionRowBuilder().addComponents(prenomInput),
    new ActionRowBuilder().addComponents(nomInput),
    new ActionRowBuilder().addComponents(confidentialiteInput)
  );

  await interaction.showModal(modal);
}

// --- Étape 3 : soumission du formulaire --------------------------------------
async function handleModalSubmit(interaction) {
  const prenom = interaction.fields.getTextInputValue('prenom').trim();
  const nom = interaction.fields.getTextInputValue('nom').trim();
  const confidentialite = interaction.fields.getTextInputValue('confidentialite').trim();

  const accepted = confidentialite.toUpperCase() === config.CONFIDENTIALITY_KEYWORD.toUpperCase();

  if (!accepted) {
    return interaction.reply({ content: config.CONFIDENTIALITY_REFUSED_MESSAGE, ephemeral: true });
  }

  // Un membre a pu se faire attribuer un NIGEND entre-temps (double soumission, etc.)
  if (findRecord(interaction.user.id)) {
    return interaction.reply({ content: '✅ Ton identification est déjà validée.', ephemeral: true });
  }

  const nigend = generateUniqueNigend();
  const record = {
    userId: interaction.user.id,
    prenom,
    nom,
    nigend,
    date: new Date().toISOString(),
  };
  db.records.push(record);
  saveDb(db);

  let nicknameFailed = false;
  try {
    const newNickname = config.NICKNAME_FORMAT.replace('{nigend}', nigend);
    await interaction.member.setNickname(newNickname);
  } catch (err) {
    nicknameFailed = true;
    console.warn(`⚠️ Impossible de renommer ${interaction.user.tag} :`, err.message);
  }

  let description = config.CONFIRM_MESSAGE
    .replace('{prenom}', record.prenom)
    .replace('{nom}', record.nom)
    .replace('{nigend}', record.nigend);
  if (nicknameFailed) description += config.CONFIRM_NICKNAME_FAILED_NOTE;

  const confirmContainer = new ContainerBuilder()
    .setAccentColor(parseInt(config.INTRO_COLOR.replace('#', ''), 16))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${config.CONFIRM_TITLE}\n${description}`))
    .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${config.CONFIRM_FOOTER}`));

  await interaction.reply({
    components: [confirmContainer],
    flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
  });

  if (config.INTEGRATION_ANNOUNCE_CHANNEL_ID) {
    try {
      const channel = interaction.guild.channels.cache.get(config.INTEGRATION_ANNOUNCE_CHANNEL_ID);
      if (channel) {
        const embed = new EmbedBuilder()
          .setTitle(config.ANNOUNCE_TITLE)
          .setDescription(
            config.ANNOUNCE_MESSAGE.replace('{user}', `<@${interaction.user.id}>`).replace('{nigend}', record.nigend)
          )
          .setColor(config.ANNOUNCE_COLOR)
          .setFooter({ text: config.ANNOUNCE_FOOTER })
          .setTimestamp();
        await channel.send({ embeds: [embed] });
      }
    } catch (err) {
      console.error('Erreur lors de l\'annonce publique d\'intégration :', err);
    }
  }
}

client.login(config.TOKEN);
