console.log('----refresh----')
import { Client, Intents } from 'discord.js'
import 'dotenv/config'

const client = new Client({ intents: [Intents.FLAGS.GUILDS] })
const token = process.env.CLIENT_TOKEN
// https://discord.com/api/oauth2/authorize?client_id=962489626763853835&permissions=2147616832&scope=bot
// Event listeners
client.on('ready', () => {
    console.log('Collecting blackstone!')
})

client.on('interactionCreate', async interaction => {
    if(!interaction.isCommand()) return

    const {commandName} = interaction

    if(commandName === 'ping') {
        await interaction.reply('Pong!')
    }
})
client.login(token)