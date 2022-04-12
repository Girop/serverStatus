console.log('----refresh----')
import { Client, Intents } from 'discord.js'
import 'dotenv/config'
import fetch from 'node-fetch'

const client = new Client({ intents: [Intents.FLAGS.GUILDS] })
const token = process.env.CLIENT_TOKEN

client.once('ready', () => {
    console.log('Collecting blackstone!')
})

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return

    const { commandName, } = interaction

    switch (commandName) {
        case 'check_status':
            const adress = 'amazenBooze.aternos.me:16423'
            const res = await fetch(
                ` https://api.mcsrvstat.us/2/${adress}`
            )
            const {online} = await res.json()
            await interaction.reply(
                `${adress} is ${online ? 'online' : 'offline'}`
                )
            break
        default:
            await interaction.reply('Really ? Think again about it')
            break
    }
})

client.login(token)