import { Client, Intents } from 'discord.js'
import 'dotenv/config'
import fetch from 'node-fetch'

const client = new Client({ intents: [Intents.FLAGS.GUILDS] })
const token = process.env.CLIENT_TOKEN
const guildId = process.env.GUILD_ID

async function setPresence() {
    const adress = 'amazenBooze.aternos.me'
    try {
        const res = await fetch(`https://api.mcsrvstat.us/2/${adress}`)
        const data = await res.json() || res.text()
        console.log(data)
        // console.log(players['online'])
        // const status = false
        // client.user.setPresence({
        //     activities: [
        //         {
        //             name: `${players['online']} people`,
        //             type: 'PLAYING',
        //         },
        //     ],
        //     status: status ? 'online' : 'idle',
        // })
    } catch (err) {
        console.error(err)
    }
}

client.once('ready', () => {
    console.log('----------------------')
    console.log('Collecting blackstone!')
    console.log('----------------------')
    // setInterval(setPresence, 10000)
    setPresence()
})

// command handler
client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return
})

client.login(token)
