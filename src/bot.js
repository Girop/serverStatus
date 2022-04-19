import { Client, Intents } from 'discord.js'
import 'dotenv/config'
import fetch from 'node-fetch'

class Session {
    constructor(currentState) {
        this.currentState = currentState
        this.ended = false

        this.end = null
        this.start = null
    }

    update(newState, peopleOnline) {
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
        return `${this.start ?? ''} - ${this.end ?? ''} : ${
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
        this.recentSession.update(status, players['online'])
        this.lastSession.update(status, players['online'])

        if (status === 'Online') {
            if (this.status === 'Offline') {
                // moving session up in a queue
                this.recentSession = this.lastSession.copied()
                this.lastSession = new Session(data)
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
class App {
    constructor() {
        this.client = new Client({ intents: [Intents.FLAGS.GUILDS] })
        this.token = process.env.CLIENT_TOKEN
        this.refreshRate = 10000
        this.live()
    }

    live() {
        this.client.once('ready', () => {
            console.log('----------------------')
            console.log('Collecting blackstone!')
            console.log('----------------------')
        })

        // command handler
        this.client.on('interactionCreate', async interaction => {
            if (!interaction.isCommand()) return

            const { commandName, channel } = interaction

            switch (commandName) {
                case 'check':
                    interaction.reply('Checking...')
                    this.initStatus(channel)
                    break
                default:
                    await interaction.reply('Think about it again')
                    break
            }
        })
        this.client.login(this.token)
        console.log('live:', this.client)
    }

    static async fetchData() {
        console.log('fetchData: starting')
        const adress = 'amazenBooze.aternos.me'
        try {
            const res = await fetch(`https://api.minetools.eu/ping/${adress}`)
            const data = await res.json()
            data['OK'] = true
            console.log('fetchData: finishing')
            return data
        } catch (err) {
            console.error(err)
            return null
        }
    }
    async initStatus(channel) {
        console.log('initStatus: starting')
        console.log('client on initStatus:', this.client)
        const data = await App.fetchData()
        if (!data['OK']) {
            console.log('initStatus: failed')
            return
        }

        App.setPresence(this.client, data)
        this.embed = new Embed(data)
        this.embed.update(data)
        const statusEmbed = this.embed.getEmbedObj()
        const msg = await this.sendEmbed(statusEmbed, channel)
        this.startTicker(msg)
    }

    async updateStatus(msg) {
        console.log('Updating...')
        const data = await App.fetchData()
        if (!data['OK']) {
            console.log('updateStatus: failed')
            return
        }
        App.setPresence(this.client, data)
        this.embed.update(data)
        const statusEmbed = this.embed.getEmbedObj()
        this.editEmbed(msg, statusEmbed)
    }

    static setPresence(client, data) {
        console.log('setPresence', thisclient)
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

    async sendEmbed(statusEmbed, channel) {
        console.log('Sending')
        let msg = await channel.send({ embeds: [statusEmbed] })
        return msg
    }

    editEmbed(msg, statusEmbed) {
        msg.edit({ embeds: [statusEmbed] })
    }

    startTicker(msg) {
        console.log('Ticking')
        var intervalID = setInterval(this.updateStatus, this.refreshRate, msg)
    }
}

const app = new App()
