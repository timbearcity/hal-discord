import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    ChannelType,
    ChatInputCommandInteraction,
    type Collection,
    type GuildBasedChannel,
    type GuildMember,
    MessageFlags,
    PermissionsBitField,
    SlashCommandBuilder,
    type SlashCommandOptionsOnlyBuilder,
    VoiceChannel
} from "discord.js";
import type {IHandler} from "../ihandler.js";

export class TeamsHandler implements IHandler {
    public static readonly name: string = "teams";
    public static readonly startButtonId: string = "start";
    public static readonly stopButtonId: string = "stop";

    public static readonly slashCommandBuilder: SlashCommandOptionsOnlyBuilder = new SlashCommandBuilder()
        .setName(TeamsHandler.name)
        .setDescription("Randomize teams")
        .addUserOption(option => option
            .setName("exclude")
            .setDescription("Exclude a user from the teams.")
            .setRequired(false));

    private readonly teams: Map<string, Map<number, GuildMember[]>> = new Map<string, Map<number, GuildMember[]>>();

    public async handleSlashCommand(interaction: ChatInputCommandInteraction) {
        if (interaction.guild === null) {
            await interaction.reply({ content: "This command can only be used in a server." });
            return;
        }

        const targetVoiceChannels = interaction.guild.channels.cache.filter(c =>
            c.type === ChannelType.GuildVoice
            && c.name.startsWith("🎮"));

        if (targetVoiceChannels?.size !== 2) {
            await interaction.reply({ content: "There needs to be exactly two voice channels with names starting with a 🎮." });
            return;
        }

        const excludedUser = interaction.options.getUser("exclude");
        const members = new Array<GuildMember>();
        for (const [, channel] of targetVoiceChannels) {
            for (const [, member] of channel.members as Map<string, GuildMember>) {
                if (member.id !== excludedUser?.id) {
                    members.push(member);
                }
            }
        }

        members.sort(() => Math.random() - 0.5);
        const middle = Math.ceil(members.length / 2);
        const team1 = members.slice(0, middle);
        const team2 = members.slice(middle);
        this.teams.set(interaction.guild.id, new Map<number, GuildMember[]>([[1, team1], [2, team2]]));

        let content = "Team 1: ";
        for (const member of team1) {
            content += `${member}, `;
        }

        content += "\nTeam 2: ";
        for (const member of team2) {
            content += `${member}, `;
        }

        const stopButton = new ButtonBuilder()
            .setCustomId(TeamsHandler.stopButtonId)
            .setLabel("Stop")
            .setStyle(ButtonStyle.Danger);

        const startButton = new ButtonBuilder()
            .setCustomId(TeamsHandler.startButtonId)
            .setLabel("Start")
            .setStyle(ButtonStyle.Success);

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(stopButton, startButton);

        await interaction.reply({
            content: content,
            components: [row],
        });
    }

    public async handleButtonPress(interaction: ButtonInteraction) {
        if (interaction.guild === null) {
            await interaction.reply({ content: "This button can only be used in a server." });
            return;
        }

        if (!interaction.memberPermissions?.has(PermissionsBitField.Flags.MoveMembers)) {
            await interaction.reply({ content: "You don't have permission to move members.", flags: MessageFlags.Ephemeral });
            return;
        }

        await interaction.deferUpdate();

        const targetVoiceChannels = interaction.guild.channels.cache.filter(c =>
            c.type === ChannelType.GuildVoice
            && c.name.startsWith("🎮"));

        if (targetVoiceChannels?.size !== 2) {
            await interaction.followUp({
                content: "There needs to be exactly two voice channels with names starting with a 🎮.", flags: MessageFlags.Ephemeral });
            this.teams.delete(interaction.guild.id);
            return;
        }

        switch (interaction.customId) {
            case TeamsHandler.startButtonId: return this.handleButtonStartPress(interaction, targetVoiceChannels);
            case TeamsHandler.stopButtonId: return this.handleButtonStopPress(interaction, targetVoiceChannels);
        }
    }

    public async handleButtonStartPress(interaction: ButtonInteraction, targetVoiceChannels: Collection<string, GuildBasedChannel>) {
        try {
            for (const member of this.teams.get(interaction.guild!.id)?.get(1) ?? []) {
                await member.voice.setChannel(targetVoiceChannels.first() as VoiceChannel);
            }
            for (const member of this.teams.get(interaction.guild!.id)?.get(2) ?? []) {
                await member.voice.setChannel(targetVoiceChannels.last() as VoiceChannel);
            }
        } catch (error) {
            console.error("Failed to move users:", error);
            await interaction.followUp({
                content: "I encountered an error. Check my permissions and ensure I can see both channels.", flags: MessageFlags.Ephemeral });
        }
    }

    public async handleButtonStopPress(interaction: ButtonInteraction, targetVoiceChannels: Collection<string, GuildBasedChannel>) {
        try {
            for (const member of this.teams.get(interaction.guild!.id)?.get(1) ?? []) {
                await member.voice.setChannel(targetVoiceChannels.first() as VoiceChannel);
            }
            for (const member of this.teams.get(interaction.guild!.id)?.get(2) ?? []) {
                await member.voice.setChannel(targetVoiceChannels.first() as VoiceChannel);
            }
        } catch (error) {
            console.error("Failed to move users:", error);
            await interaction.followUp({
                content: "I encountered an error. Check my permissions and ensure I can see both channels.", flags: MessageFlags.Ephemeral });
        }
    }
}
