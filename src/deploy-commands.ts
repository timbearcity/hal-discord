import "dotenv/config";
import {REST, Routes, SlashCommandBuilder} from "discord.js";
import {TeamsHandler} from "./handlers/teams-handler.js";

const discordToken = process.env["DISCORD_TOKEN"];
const appId = process.env["APP_ID"];
if (discordToken === undefined || appId === undefined) {
    throw new Error(`DISCORD_TOKEN: ${discordToken}, APP_ID: ${appId}`);
}

const commands: SlashCommandBuilder[] = [
    TeamsHandler.slashCommandBuilder,
];

const rest = new REST().setToken(discordToken);

(async () => {
    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);

        const data = await rest.put(Routes.applicationCommands(appId), { body: commands });

        if (Array.isArray(data)) {
            console.log(`Successfully refreshed ${data.length} application (/) commands.`);
        }
    } catch (error) {
        console.error(error);
    }
})();
