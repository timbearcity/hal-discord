import "dotenv/config";
import {GatewayIntentBits} from "discord.js";
import {CustomClient} from "./custom-client.js";

const client = new CustomClient({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates
    ]
});

void client.login(process.env["DISCORD_TOKEN"]);
