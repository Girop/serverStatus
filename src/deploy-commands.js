import { SlashCommandBuilder } from '@discordjs/builders'
import { Routes } from 'discord-api-types/v9'
import { REST } from '@discordjs/rest'
import 'dotenv/config'

const token = process.env.CLIENT_TOKEN
const clientId = process.env.CLIENT_ID
const guildId = process.env.GUILD_ID // Using on test server rn

const commands = [
    new SlashCommandBuilder()
        .setName('check_status')
        .setDescription('Tell bot to watch over server'),
        // .addStringOption(option => 
        //     option.setName('mc_server')
        //     .setDescription('Give server adress which status you want to follow')
        //     .setRequired(true)),
].map(command => command.toJSON())

const rest = new REST({ version: '9' }).setToken(token)
rest.put(Routes.applicationGuildCommands(clientId, guildId), {
    body: commands,
})
    .then(() => console.log('Commands added!'))
    .catch(console.error)