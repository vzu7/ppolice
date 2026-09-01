const { 
    Client, 
    GatewayIntentBits, 
    SlashCommandBuilder, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle, 
    PermissionFlagsBits, 
    ChannelType 
} = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// === رابط الصورة الموحد وحسابات الإعدادات ===
const IMAGE_URL = "https://cdn.discordapp.com/attachments/1501300022808023351/1544373963856281733/A9197E36-7273-4E51-8E9E-DE317E9A0E48.jpg?ex=6a9845d6&is=6a96f456&hm=bede527aef0a9a59ac7b65087c70138b5dce0d8cee0ebff05aa07ae13771a002&";

const CONFIG = {
    ADMIN_ROLE_ID: "ضع_اي_دي_رتبة_الادارة_هنا",
    TICKET_CATEGORY_ID: "ضع_اي_دي_كتيجوري_التذاكر_هنا"
};

// قواميس بيانات لتخزين الإحصائيات والتذاكر المستلمة
const adminStats = new Map();
const activeTickets = new Map();

function getStats(userId) {
    if (!adminStats.has(userId)) {
        adminStats.set(userId, { claimedTickets: 0, memberComplaints: 0, adminComplaints: 0, bans: 0, kicks: 0, timeouts: 0, warns: 0 });
    }
    return adminStats.get(userId);
}

// === تسجيل أوامر السلاش ===
client.on('ready', async () => {
    console.log(`تم تشغيل البوت بنجاح باسم: ${client.user.tag}`);

    const commands = [
        new SlashCommandBuilder().setName('ticket').setDescription('إرسال لوحة فتح التذاكر'),
        new SlashCommandBuilder()
            .setName('info')
            .setDescription('عرض إحصائيات الإداري')
            .addUserOption(opt => opt.setName('admin').setDescription('اختر الإداري').setRequired(true)),
        new SlashCommandBuilder()
            .setName('طرد')
            .setDescription('طرد عضو من السيرفر')
            .addUserOption(opt => opt.setName('user').setDescription('العضو').setRequired(true))
            .addStringOption(opt => opt.setName('reason').setDescription('السبب').setRequired(true)),
        new SlashCommandBuilder()
            .setName('باند')
            .setDescription('حظر عضو من السيرفر')
            .addUserOption(opt => opt.setName('user').setDescription('العضو').setRequired(true))
            .addStringOption(opt => opt.setName('reason').setDescription('السبب').setRequired(true)),
        new SlashCommandBuilder()
            .setName('تايم')
            .setDescription('إعطاء تايم أوت للعضو (بالدقائق)')
            .addUserOption(opt => opt.setName('user').setDescription('العضو').setRequired(true))
            .addIntegerOption(opt => opt.setName('duration').setDescription('المدة بالدقائق').setRequired(true))
            .addStringOption(opt => opt.setName('reason').setDescription('السبب').setRequired(true)),
        new SlashCommandBuilder()
            .setName('تحذير')
            .setDescription('إرسال تحذير للعضو في الخاص')
            .addUserOption(opt => opt.setName('user').setDescription('العضو').setRequired(true))
            .addStringOption(opt => opt.setName('reason').setDescription('السبب').setRequired(true)),
        new SlashCommandBuilder().setName('اداره').setDescription('إرسال رسالة القوانين الإدارية والنقاط')
    ];

    await client.application.commands.set(commands);
});

// === التفاعل مع الأوامر ===
client.on('interactionCreate', async interaction => {
    if (interaction.isChatInputCommand()) {
        const { commandName } = interaction;

        // امر /ticket
        if (commandName === 'ticket') {
            const embed = new EmbedBuilder()
                .setTitle("نظام التذاكر")
                .setDescription("اهلا بكً في كي دي دي، لطلب المساعده، الشكوى سواء على \"عضو\" او \"اداري\" الضغط على الزر ادناه\n\nملاحظه: \"فتح التكت لطقطقه قد يودي الى تحذيرك\"")
                .setColor("Blue")
                .setImage(IMAGE_URL);

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('ticket_member').setLabel('الشكوى على عضو').setEmoji('📩').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('ticket_admin').setLabel('الشكوى على اداري').setEmoji('🎫').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('ticket_inquiry').setLabel('استفسار').setEmoji('📥').setStyle(ButtonStyle.Secondary)
            );

            return interaction.reply({ embeds: [embed], components: [row] });
        }

        // امر /info
        if (commandName === 'info') {
            const target = interaction.options.getUser('admin');
            const stats = getStats(target.id);

            const embed = new EmbedBuilder()
                .setTitle(`إحصائيات الإداري: ${target.username}`)
                .setColor("DarkPurple")
                .addFields(
                    { name: 'عدد التذاكر المستلمة 🎫', value: `${stats.claimedTickets}`, inline: true },
                    { name: 'الشكاوى الموجهة ضده كعضو 📩', value: `${stats.memberComplaints}`, inline: true },
                    { name: 'الشكاوى الموجهة ضده كإداري 🎫', value: `${stats.adminComplaints}`, inline: true },
                    { name: 'عدد مرات الباند 🔨', value: `${stats.bans}`, inline: true },
                    { name: 'عدد مرات الطرد 👞', value: `${stats.kicks}`, inline: true },
                    { name: 'عدد مرات التايم ⏰', value: `${stats.timeouts}`, inline: true },
                    { name: 'عدد التحذيرات ⚠️', value: `${stats.warns}`, inline: true }
                );

            return interaction.reply({ embeds: [embed] });
        }

        // امر /اداره
        if (commandName === 'اداره') {
            const embed = new EmbedBuilder()
                .setTitle("تنبيهات وقوانين الإدارة")
                .setDescription("اقولهم كل اداري فيكم يمتلك ١٠ نقاط، كل مشكله، مخالفه للقوانين، بتنخصم منك على حسب المشكله، اذا انتهت العشره لايمكنك الرجوع للاداره وتحسب عليك.\nاتمنى ان تمشون على القوانين السيرفر هذا حاله حال سيرفر بندر.")
                .setColor("Gold")
                .setImage(IMAGE_URL);

            return interaction.reply({ embeds: [embed] });
        }

        // أوامر العقوبات الإدارية
        if (['طرد', 'باند', 'تايم', 'تحذير'].includes(commandName)) {
            if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
                return interaction.reply({ content: "ليس لديك صلاحية لاستخدام هذا الأمر.", ephemeral: true });
            }

            const targetUser = interaction.options.getUser('user');
            const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
            const reason = interaction.options.getString('reason');
            const adminStatsData = getStats(interaction.user.id);

            if (commandName === 'طرد') {
                if (targetMember) await targetMember.kick(reason);
                adminStatsData.kicks++;
                return interaction.reply({ content: `تم طرد ${targetUser.username} بنجاح. السبب: ${reason}` });
            }

            if (commandName === 'باند') {
                await interaction.guild.members.ban(targetUser.id, { reason });
                adminStatsData.bans++;
                return interaction.reply({ content: `تم حظر ${targetUser.username} بنجاح. السبب: ${reason}` });
            }

            if (commandName === 'تايم') {
                const duration = interaction.options.getInteger('duration');
                if (targetMember) await targetMember.timeout(duration * 60 * 1000, reason);
                adminStatsData.timeouts++;
                return interaction.reply({ content: `تم إعطاء تايم أوت لـ ${targetUser.username} لمدة ${duration} دقيقة. السبب: ${reason}` });
            }

            if (commandName === 'تحذير') {
                adminStatsData.warns++;
                await targetUser.send(`لقد تلقيت تحذيراً من إدارة السيرفر.\nالسبب: ${reason}`).catch(() => null);
                return interaction.reply({ content: `تم إرسال التحذير للعضو ${targetUser.username} في الخاص.` });
            }
        }
    }

    // === ضغطات الأزرار ===
    if (interaction.isButton()) {
        const { customId } = interaction;

        if (customId === 'ticket_member') {
            const modal = new ModalBuilder().setCustomId('modal_member').setTitle('استبيان الشكوى على عضو');
            modal.addComponents(
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('target').setLabel('اسم العضو ويوزره').setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('desc').setLabel('وصف المشكلة').setStyle(TextInputStyle.Paragraph).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('img').setLabel('إرفاق صورة (اختياري)').setStyle(TextInputStyle.Short).setRequired(false))
            );
            return interaction.showModal(modal);
        }

        if (customId === 'ticket_admin') {
            const modal = new ModalBuilder().setCustomId('modal_admin').setTitle('استبيان الشكوى على إداري');
            modal.addComponents(
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('target').setLabel('اكتب اسم الإداري الذي تود الشكوى عليه').setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('desc').setLabel('وصف المشكلة').setStyle(TextInputStyle.Paragraph).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('img').setLabel('إرفاق صورة (اختياري)').setStyle(TextInputStyle.Short).setRequired(false))
            );
            return interaction.showModal(modal);
        }

        if (customId === 'ticket_inquiry') {
            return createTicketChannel(interaction, "استفسار", null);
        }

        // استلام التكت
        if (customId === 'claim_ticket') {
            if (!interaction.member.roles.cache.has(CONFIG.ADMIN_ROLE_ID)) {
                return interaction.reply({ content: "هذا الزر مخصص للإداريين فقط.", ephemeral: true });
            }

            if (activeTickets.has(interaction.channel.id)) {
                return interaction.reply({ content: "التذكرة مستلمة بالفعل من قبل إداري آخر.", ephemeral: true });
            }

            activeTickets.set(interaction.channel.id, interaction.user.id);
            getStats(interaction.user.id).claimedTickets++;

            // منع باقي الإداريين من الكتابة
            await interaction.channel.permissionOverwrites.set([
                { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                { id: CONFIG.ADMIN_ROLE_ID, allow: [PermissionFlagsBits.ViewChannel], deny: [PermissionFlagsBits.SendMessages] },
                { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
                { id: interaction.channel.topic, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
            ]);

            return interaction.reply({ content: `تم استلام التذكرة بواسطة ${interaction.user}` });
        }

        // إغلاق التكت
        if (customId === 'close_ticket') {
            if (!interaction.member.roles.cache.has(CONFIG.ADMIN_ROLE_ID)) {
                return interaction.reply({ content: "فقط الإداري يمكنه إغلاق التذكرة.", ephemeral: true });
            }

            const modal = new ModalBuilder().setCustomId('modal_close_reason').setTitle('سبب إغلاق التذكرة');
            modal.addComponents(
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('close_reason').setLabel('اكتب للعضو سبب إغلاق التذكرة').setStyle(TextInputStyle.Paragraph).setRequired(true))
            );
            return interaction.showModal(modal);
        }
    }

    // === استقبال تعبئة الاستبيان (Modal Submits) ===
    if (interaction.isModalSubmit()) {
        const { customId } = interaction;

        if (customId === 'modal_member') {
            const target = interaction.fields.getTextInputValue('target');
            const desc = interaction.fields.getTextInputValue('desc');
            const img = interaction.fields.getTextInputValue('img');
            return createTicketChannel(interaction, "شكوى-عضو", { target, desc, img });
        }

        if (customId === 'modal_admin') {
            const target = interaction.fields.getTextInputValue('target');
            const desc = interaction.fields.getTextInputValue('desc');
            const img = interaction.fields.getTextInputValue('img');
            return createTicketChannel(interaction, "شكوى-إداري", { target, desc, img });
        }

        if (customId === 'modal_close_reason') {
            const reason = interaction.fields.getTextInputValue('close_reason');
            const ticketOwnerId = interaction.channel.topic;

            if (ticketOwnerId) {
                const owner = await client.users.fetch(ticketOwnerId).catch(() => null);
                if (owner) {
                    await owner.send(`تم إغلاق تذكرتك في السيرفر.\nالسبب: ${reason}`).catch(() => null);
                }
            }

            await interaction.reply("جاري إغلاق التذكرة وحذفها...");
            setTimeout(() => interaction.channel.delete().catch(() => null), 3000);
        }
    }
});

// === دالة إنشاء التذكرة ===
async function createTicketChannel(interaction, type, details) {
    const guild = interaction.guild;
    const user = interaction.user;

    const channel = await guild.channels.create({
        name: `${type}-${user.username}`,
        type: ChannelType.GuildText,
        parent: CONFIG.TICKET_CATEGORY_ID || null,
        topic: user.id,
        permissionOverwrites: [
            { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
            { id: CONFIG.ADMIN_ROLE_ID, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
            { id: user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
        ]
    });

    const embed = new EmbedBuilder()
        .setTitle("اهلا بك في تذكرتك الخاصة")
        .setColor("Gold")
        .setImage(IMAGE_URL);

    if (details) {
        embed.addFields(
            { name: "المشتكى عليه", value: details.target || "غير محدد" },
            { name: "وصف المشكلة", value: details.desc || "لا يوجد" }
        );
        if (details.img) embed.addFields({ name: "المرفقات", value: details.img });
    }

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('close_ticket').setLabel('إغلاق التذكرة').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('claim_ticket').setLabel('استلام').setStyle(ButtonStyle.Success)
    );

    await channel.send({ content: `<@&${CONFIG.ADMIN_ROLE_ID}>`, embeds: [embed], components: [row] });
    return interaction.reply({ content: `تم فتح تذكرتك بنجاح: ${channel}`, ephemeral: true });
}

client.login(process.env.TOKEN);
