import { Client, Intents } from 'discord.js'
import 'dotenv/config'
import fetch from 'node-fetch'

const client = new Client({ intents: [Intents.FLAGS.GUILDS] })
const token = process.env.CLIENT_TOKEN

async function fetchData() {
    const adress = 'amazenBooze.aternos.me'
    try {
        const res = await fetch(`https://api.mcsrvstat.us/2/${adress}`)
        const data = await res.json()
        setPresence(data)
        sendEditEmbeds(data)

    } catch (err) {
        console.error(err)
    }
}

function setPresence(data) {
    const { players } = data
    client.user.setPresence({
        activities: [
            {
                name: `${players['online']} people`,
                type: 'PLAYING',
            },
        ],
        status: players['online'] > 0 ? 'online' : 'idle',
    })
}

function sendEditEmbeds(data) {
    const { players, version } = data
    const channel = client.channels.cache.get('912114447940722701')

    const statusEmbed = {
        title: 'Server info',
        color: '#008369',
        fields: [
            {
                name: 'Server:',
                value: version,
            },
            {
                name: 'People online:',
                value: players['online'],
            },
        ],
        timestamp: new Date(),
    }
    
    channel.send({ embeds: [statusEmbed] })
    /*
    / channel id, fetch data, 
    / get data
    / check if embed exists
    / edit embed || create embed

    / embeds
    / style as minecrat blocks /w minecraft font
    / -pure server status
    / -number of players

    */
}

client.once('ready', () => {
    console.log('----------------------')
    console.log('Collecting blackstone!')
    console.log('----------------------')
    fetchData()
})

// command handler
client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return
})

client.login(token)