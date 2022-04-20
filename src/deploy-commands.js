import { SlashCommandBuilder } from '@discordjs/builders'
import { Routes } from 'discord-api-types/v9'
import { REST } from '@discordjs/rest'
import 'dotenv/config'

const token = process.env.CLIENT_TOKEN
const clientId = process.env.CLIENT_ID

const commands = [
    new SlashCommandBuilder()
        .setName('check')
        .setDescription('Check status of server'),
    new SlashCommandBuilder()
        .setName('clear')
        .setDescription('clear channel from all messages')
].map(command => command.toJSON())

const rest = new REST({ version: '9' }).setToken(token)
rest.put(Routes.applicationCommands(clientId), {
    body: commands,
})
    .then(() => console.log('Commands added!'))
    .catch(console.error)