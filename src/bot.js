console.log('----refresh----')
import { Client, Intents } from 'discord.js'
import 'dotenv/config'
const client = new Client({ intents: [Intents.FLAGS.GUILDS] })

const token = process.env.CLIENT_SECRET
client.login(token)
