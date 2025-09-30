import {ButtonInteraction, ChatInputCommandInteraction, Client, type ClientOptions, Collection, Events, type Interaction, MessageFlags} from "discord.js";
import {TeamsHandler} from "./handlers/teams-handler.js";
import type {IHandler} from "./ihandler.js";

export class CustomClient extends Client {
    private handlers: Collection<string, IHandler> = new Collection([
        [TeamsHandler.name, new TeamsHandler()]
    ]);

    public constructor(options: ClientOptions) {
        super(options);
        this.once(Events.ClientReady, this.handleClientReadyEvent);
        this.on(Events.InteractionCreate, this.handleInteractionCreateEvent);
    }

    private handleClientReadyEvent(client: Client<true>): void {
        console.log(`Ready! Logged in as ${client.user.tag}`);
    }

    private async handleInteractionCreateEvent(interaction: Interaction): Promise<void> {
        if (interaction.isChatInputCommand()) {
            return this.handleSlashCommand(interaction);
        } else if (interaction.isButton()) {
            return this.handleButtonPress(interaction);
        }
    }

    private async handleSlashCommand(interaction: ChatInputCommandInteraction): Promise<void> {
        const command = this.handlers.get(interaction.commandName);
        if (command === undefined) {
            console.error(`No command matching ${interaction.commandName} was found.`);
            await interaction.reply({ content: `No command matching ${interaction.commandName} was found.`, flags: MessageFlags.Ephemeral });
            return;
        }
        try {
            await command.handleSlashCommand(interaction);
        } catch (error) {
            console.error(error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: "There was an error while executing this command!", flags: MessageFlags.Ephemeral });
            } else {
                await interaction.reply({ content: "There was an error while executing this command!", flags: MessageFlags.Ephemeral });
            }
        }
    }

    private async handleButtonPress(interaction: ButtonInteraction): Promise<void> {
        const command = this.handlers.get(interaction.customId);
        if (command === undefined) {
            console.error(`No button matching ${interaction.customId} was found.`);
            await interaction.reply({ content: `No button matching ${interaction.customId} was found.`, flags: MessageFlags.Ephemeral });
            return;
        }

        await command.handleButtonPress(interaction);
    }
}