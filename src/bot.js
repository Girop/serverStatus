import { Client, Intents, Formatters } from 'discord.js'
import 'dotenv/config'
import fetch from 'node-fetch'

class Session {
    constructor(newState = 'Offline') {
        this.currentState = newState
        this.ended = false

        this.end = null
        this.start = null
    }

    update(newState, peopleOnline) {
        console.log('Session > Update:', this.currentState, newState)
        this.maxPeopleOnline = Math.max(peopleOnline, this.maxPeopleOnline)
        this.continues = this.currentState === 'Online'
        if (newState === 'Offline') {
            if (this.currentState === 'Online') {
                this.end = new Date()
                this.ended = true
            }
        } else if (newState === 'Online') {
            if (this.currentState === 'Offline') {
                this.start = new Date()
                console.log('Session > update: new session start', this.start)
            }
        }
    }

    copied() {
        const newSession = new Session()
        newSession.start = this.start
        newSession.end = this.end
        newSession.ended = this.ended
        newSession.currentState = this.currentState
        newSession.continues = this.continues
        newSession.maxPeopleOnline = this.maxPeopleOnline
        return newSession
    }

    toFormatedString() {
        const formatter = new Formatters()
        let formatedStart = this.start && formatter.time(this.start, "R")
        let formatedEnd = this.start && formatter.time(this.end, "R")
        return `${formatedStart ?? ''} - ${formatedEnd ?? ''} : ${
            isNaN(this.maxPeopleOnline) ? '' : this.maxPeopleOnline
        }`
    }
}
class Embed {
    constructor(data) {
        this.color = '#008369'
        this.recentSession = new Session()
        this.lastSession = new Session()
        this.update(data)
    }

    update(data) {
        console.log('Update data:', data)
        const { players, version } = data
        let status = version['name'] === '1.18.2' ? 'Online' : 'Offline'
        this.lastSession.update(status, players['online'])

        if (status === 'Online') {
            if (this.status === 'Offline') {
                // moving session up in a queue
                this.recentSession = this.lastSession.copied()
                this.lastSession = new Session(this.status)
            }
        }

        this.status = status
        this.color = this.status === 'Online' ? '#008369' : '#ff0000'
        this.playersOnline = players['online']
    }

    getEmbedObj() {
        const statusEmbed = {
            title: 'Server info',
            color: this.color,
            fields: [
                {
                    name: 'Server:',
                    value: this.status,
                },
                {
                    name: 'People online:',
                    value: this.playersOnline.toString(),
                },
                {
                    name: 'Recently',
                    value: this.recentSession.toFormatedString(),
                },
                {
                    name: 'Last session',
                    value: this.lastSession.toFormatedString(),
                },
            ],
            timestamp: new Date(),
        }
        return statusEmbed
    }
}

async function fetchData() {
    const adress = 'amazenBooze.aternos.me'
    try {
        const res = await fetch(`https://api.minetools.eu/ping/${adress}`)
        const data = await res.json()
        data['OK'] = !data.hasOwnProperty('error')
        console.log('fetchData: finishing')
        return data
    } catch (err) {
        console.error(err)
        return { OK: false }
    }
}

async function initStatus(channel) {
    console.log('initStatus: starting')
    const data = await fetchData()
    if (!data['OK']) {
        console.log('initStatus: failed')
        return
    }

    setPresence(data)
    const embed = new Embed(data)
    embed.update(data)
    console.log('initStatus embed:', embed.getEmbedObj())
    const statusEmbed = embed.getEmbedObj()
    const msg = await sendEmbed(statusEmbed, channel)
    startTicker(msg, embed)
}

const client = new Client({ intents: [Intents.FLAGS.GUILDS] })
const token = process.env.CLIENT_TOKEN
client.login(token)

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
            interaction.reply('Checking...')
            initStatus(channel)
            break
        default:
            await interaction.reply('Think about it again')
            break
    }
})

async function updateStatus(msg, embed) {
    console.log('Updating...')
    const data = await fetchData()
    if (!data['OK']) {
        console.log('updateStatus: failed')
        return
    }
    setPresence(data)
    embed.update(data)
    console.log('updateStatus', embed.getEmbedObj())
    const statusEmbed = embed.getEmbedObj()
    editEmbed(msg, statusEmbed)
}

function setPresence(data) {
    console.log('setPresence: starting')
    const { players } = data
    // console.log("setPresence", players, data)
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

async function sendEmbed(statusEmbed, channel) {
    console.log('Sending')
    let msg = await channel.send({ embeds: [statusEmbed] })
    return msg
}

function editEmbed(msg, statusEmbed) {
    msg.edit({ embeds: [statusEmbed] })
}

function startTicker(msg, embed) {
    console.log('Ticking')
    const refreshRate = 30000
    var intervalID = setInterval(updateStatus, refreshRate, msg, embed)
}
