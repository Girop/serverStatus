import { Client, Intents } from 'discord.js'
import 'dotenv/config'
import fetch from 'node-fetch'

const client = new Client({ intents: [Intents.FLAGS.GUILDS] })
const token = process.env.CLIENT_TOKEN
const guildId = process.env.GUILD_ID

async function setPresence(){
    const res = await fetch(
        ``
    )
}

client.once('ready', () => {
    console.log('----------------------')
    console.log('Collecting blackstone!')
    console.log('----------------------')

    
})

// command handler
client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return
}

client.login(token)