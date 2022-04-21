import { Client, Intents } from 'discord.js'
import { time } from '@discordjs/builders'
import 'dotenv/config'
import fetch from 'node-fetch'

class Session {
    constructor(newState = 'Offline') {
        this.previousState = newState
        this.ended = false
        this.maxPeopleOnline = 0

        this.end = null
        this.start = null
    }

    update(previousState, newState, peopleOnline) {
        // console.log('Previous state > new state:', previousState, newState)
        this.maxPeopleOnline = Math.max(peopleOnline, this.maxPeopleOnline)
        if (newState === 'Offline') {
            if (previousState === 'Online') {
                this.end = new Date()
                console.log('Getting end')
                this.ended = true
            }
        } else if (newState === 'Online') {
            if (!this.start || previousState === 'Offline') {
                this.start = new Date()
            }
        }
        this.previousState = previousState
        this.continues = this.previousState === 'Online'
    }

    copied() {
        const newSession = new Session()
        newSession.start = this.start
        newSession.end = this.end
        newSession.ended = this.ended
        newSession.previousState = this.previousState
        newSession.continues = this.continues
        newSession.maxPeopleOnline = this.maxPeopleOnline
        return newSession
    }

    toFormatedString() {
        let formatedStart = this.start && time(this.start, 'R')
        let formatedEnd = this.end && time(this.end, 'R')
        return `${formatedStart ?? ''} - ${formatedEnd ?? ''} : ${
            isNaN(this.maxPeopleOnline) ? '' : this.maxPeopleOnline
        }`
    }
}
class Embed {
    constructor(data) {
        this.color = '#008369'
        this.previousSession = new Session()
        this.lastSession = new Session()
        this.update(data)
    }

    update(data) {
        const { players, version } = data
        let status = version['name'] === '1.18.2' ? 'Online' : 'Offline'

        if (status === 'Online') {
            if (this.status === 'Offline') {
                // moving session up in a queue
                if (this.lastSession.ended) {
                    this.previousSession = this.lastSession.copied()
                }
                this.lastSession = new Session(this.status)
            }
        }
        this.lastSession.update(this.status, status, players['online'])

        this.status = status
        this.color = this.status === 'Online' ? '#008369' : '#ff0000'
        this.playersOnline = players['online']
    }

    getEmbedObj() {
        // console.log('Last session embed:', this.lastSession)
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
                    name: 'Previous',
                    value: this.previousSession.toFormatedString(),
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

const client = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
})
const token = process.env.CLIENT_TOKEN
client.login(token)

client.once('ready', () => {
    console.log('----------------------')
    console.log('Collecting blackstone!')
    console.log('----------------------')
})

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
    // console.log('initStatus embed:', embed.getEmbedObj())
    const statusEmbed = embed.getEmbedObj()
    const msg = await sendEmbed(statusEmbed, channel)
    startTicker(msg, embed)
}

async function updateStatus(msg, embed) {
    console.log('Updating...')
    const data = await fetchData()
    if (!data['OK']) {
        console.log('updateStatus: failed')
        return
    }
    setPresence(data)
    embed.update(data)
    const statusEmbed = embed.getEmbedObj()
    editEmbed(msg, statusEmbed)
    console.log('Updated')
}

function setPresence(data) {
    console.log('setPresence: starting')
    const { players, version } = data
    let status = version['name'] === '1.18.2' ? 'Online' : 'Offline'
    // console.log("setPresence", players, data)
    client.user.setPresence({
        activities: [
            {
                name: `${players['online']} ${
                    players['online'] === 1 ? 'person' : 'people'
                }`,
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

async function clearMessages(channel) {
    let messages
    do {
        messages = await channel.messages.fetch({ limit: 100 })
        channel.bulkDelete(messages)
    } while (messages.length > 0)
}

// command handler
client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return

    const { commandName, channel, member } = interaction
    channel.lastMessage
    switch (commandName) {
        case 'check':
            initStatus(channel)
            await interaction.reply('Checking...')
            break
        case 'clear':
            const hasAccess = member.roles.cache.some(role => role.name === 'Sprzątacz')
            if(hasAccess){
                await interaction.reply('Clearing...')
                clearMessages(channel)
            }else {
                await interaction.reply('Not enought social credit, sorry')
            }
            break
        default:
            await interaction.reply('Think about it again')
            break
    }
})
