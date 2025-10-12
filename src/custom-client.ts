import {ButtonInteraction, ChatInputCommandInteraction, Client, type ClientOptions, Events, type Interaction, MessageFlags} from "discord.js";
import {TeamsHandler} from "./handlers/teams-handler.js";
import type {IHandler} from "./ihandler.js";

export class CustomClient extends Client {
    private handlers: Map<string, IHandler> = new Map([
        [TeamsHandler.name, new TeamsHandler()]
    ]);

    private buttons: Map<string, string> = new Map([
        [TeamsHandler.startButtonId, TeamsHandler.name],
        [TeamsHandler.stopButtonId, TeamsHandler.name]
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
        const handler = this.handlers.get(interaction.commandName);
        if (handler === undefined) {
            const message = `No command matching ${interaction.commandName} was found.`;
            console.error(message);
            await interaction.reply({ content: message, flags: MessageFlags.Ephemeral });
            return;
        }
        try {
            await handler.handleSlashCommand(interaction);
        } catch (error) {
            console.error(error);
            const message = "There was an error while executing this command!";
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: message, flags: MessageFlags.Ephemeral });
            } else {
                await interaction.reply({ content: message, flags: MessageFlags.Ephemeral });
            }
        }
    }

    private async handleButtonPress(interaction: ButtonInteraction): Promise<void> {
        const buttonHandlerName = this.buttons.get(interaction.customId);
        const handler = this.handlers.get(buttonHandlerName ?? "");
        if (handler === undefined) {
            const message = `No button matching ${interaction.customId} was found.`;
            console.error(message);
            await interaction.reply({ content: message, flags: MessageFlags.Ephemeral });
            return;
        }

        await handler.handleButtonPress(interaction);
    }
}