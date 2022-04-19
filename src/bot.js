import { Client, Intents } from 'discord.js'
import 'dotenv/config'
import fetch from 'node-fetch'

const client = new Client({ intents: [Intents.FLAGS.GUILDS] })
const token = process.env.CLIENT_TOKEN

async function fetchData() {
    console.log('fetchData: starting')
    const adress = 'amazenBooze.aternos.me'
    try {
        const res = await fetch(`https://api.minetools.eu/ping/${adress}`)
        const data = await res.json()
        data['OK'] = true
        return data
    } catch (err) {
        console.error(err)
        return null
    }
}
async function initStatus(channel) {
    console.log('initStatus: starting')
    const data = await fetchData()
    if (!data['OK']) {
        console.log('initStatus: failed')
        return
    }
    console.log('initStatus: Success')
    setPresence(data)
    const statusEmbed = generateStatusEmbed(data)
    const msg = await sendEmbed(statusEmbed, channel)
    startTicker(msg)
}

async function updateStatus(msg) {
    console.log('Updating...')
    const data = await fetchData()
    if (!data['OK']) {
        console.log('updateStatus: failed')
        return
    }
    setPresence(data)
    const statusEmbed = generateStatusEmbed(data)
    editEmbed(msg, statusEmbed)
}

function setPresence(data) {
    console.log('setPresence: starting')
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
            {
                name: 'Recently',
                value: `{start} - {end} : {maxPlayersRecentSession}`
            },
            {
                name: 'Last session',
                value: `{} - {} : {maxPlayersLastSession}`
            }
        ],
        timestamp: new Date(),
    }
    return statusEmbed
}

async function sendEmbed(statusEmbed, channel) {
    console.log('Sending')
    let msg = await channel.send({ embeds: [statusEmbed] })
    return msg
    // edit embed || create embed
}

function editEmbed(msg, statusEmbed) {
    msg.edit({ embeds: [statusEmbed] })
}

function startTicker(msg) {
    console.log('Ticking')
    let refreshRate = 30000
    var intervalID = setInterval(updateStatus, refreshRate, msg)
}

client.once('ready', () => {
    console.log('----------------------')
    console.log('Collecting blackstone!')
    console.log('----------------------')
})

// command handler
client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return

    const { commandName, channel } = interaction

    switch (commandName) {
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