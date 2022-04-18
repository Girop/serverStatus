import { Client, Intents } from 'discord.js'
import 'dotenv/config'
import fetch from 'node-fetch'

const client = new Client({ intents: [Intents.FLAGS.GUILDS] })
const token = process.env.CLIENT_TOKEN

async function fetchData() {
    const adress = 'amazenBooze.aternos.me'
    try {
        const res = await fetch(`https://api.minetools.eu/ping/${adress}`)
        const data = await res.json()
        return data
        
    } catch (err) {
        console.error(err)
        return null
    }
}
async function initStatus(channel) {
    const data = await fetchData()
    setPresence(data)
    const statusEmbed = generateStatusEmbed(data)
    const msg = await sendEmbed(statusEmbed, channel)
    startTicker(msg)
}

async function updateStatus(msg) {
    const data = await fetchData()
    setPresence(data)
    const statusEmbed = generateStatusEmbed(data)
    editEmbed(msg, statusEmbed)

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

function generateStatusEmbed(data) {

    const { players, version } = data
    const status = version['name'] === '1.18.2' ? 'Online' : 'Offline'

    const statusEmbed = {
        title: 'Server info',
        color: '#008369',
        fields: [
            {
                name: 'Server:',
                value: status,
            },
            {
                name: 'People online:',
                value: players['online'].toString(),
            },
        ],
        timestamp: new Date(),
    }
    return statusEmbed
}

async function sendEmbed(statusEmbed,channel) {
    msg = await channel.send({ embeds: [statusEmbed] })
    return msg
    // edit embed || create embed
}

function editEmbed(msg, statusEmbed){
    msg.edit({ embeds: [statusEmbed] })
}

function startTicker(msg) {
    let refreshRate = 30000
    var intervalID = setInterval(updateStatus, refreshRate, msg); 
}

client.once('ready', () => {
    console.log('----------------------')
    console.log('Collecting blackstone!')
    console.log('----------------------')
})

// command handler
client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return

    const {commandName,channel} = interaction
    
    switch (commandName){
        case 'check':
            initStatus(channel)
            interaction.reply('Checking...')
            break
        // case 'summon':
        //     await interaction.reply(client.)
        //     break
        default:
            await interaction.reply('Think about it again')
            break
    }
})

client.login(token)