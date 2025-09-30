import {ButtonInteraction, ChatInputCommandInteraction} from "discord.js";

export interface IHandler {
    handleSlashCommand(interaction: ChatInputCommandInteraction): Promise<void>;

    handleButtonPress(interaction: ButtonInteraction): Promise<void>;
}