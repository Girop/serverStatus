import { Client, Intents } from 'discord.js'
import { time } from '@discordjs/builders'
import 'dotenv/config'
import fetch from 'node-fetch'

class Session {
    constructor(newState = 'Offline') {
        this.previousState = newState
        this.ended = false

        this.end = null
        this.start = null
    }

    update(previousState, newState, peopleOnline) {
        this.maxPeopleOnline = Math.max(peopleOnline, this.maxPeopleOnline)
        if (newState === 'Offline') {
            if (previousState === 'Online') {
                this.end = new Date()
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
        let formatedEnd = this.start && time(this.end, 'R')
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
        const { players, version } = data
        let status = version['name'] === '1.18.2' ? 'Online' : 'Offline'
        
        if (status === 'Online') {
            if (this.status === 'Offline') {
                // moving session up in a queue
                if (this.lastSession.ended){
                    this.recentSession = this.lastSession.copied()
                }
                this.lastSession = new Session(this.status)
            }
        }
        this.lastSession.update(
            this.status, 
            status, 
            players['online']
        )

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
    const statusEmbed = embed.getEmbedObj()
    editEmbed(msg, statusEmbed)
}

function setPresence(data) {
    console.log('setPresence: starting')
    const { players, version } = data
    let status = version['name'] === '1.18.2' ? 'Online' : 'Offline'
    // console.log("setPresence", players, data)
    client.user.setPresence({
        activities: [
            {
                name: `${players['online']} ${players['online'] === 1 ? "person" : "people"}`,
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
