const { Telegraf } = require('telegraf')

const session = require('telegraf/session')
const Stage = require('telegraf/stage')
const { logger } = require('../module/logger')
const { addUserTelegram } = require('../db/userTelegram')
const { superWizard } = require('./scenes/cringeScene')
const { logsSceneWizard } = require('./scenes/logsScene')
const i18n  = require("./i18n/index")
const utils = require("../module/utils")
require('dotenv').config()


const bot = new Telegraf(process.env.BOT_TOKEN)
const stage = new Stage([superWizard, logsSceneWizard])

bot.use(session())
bot.use(i18n.middleware())
bot.use(stage.middleware())

bot.use(async (ctx, next) => {
  const start = new Date()
  await next()
  const ms = new Date() - start
  logger.info('Response time: ' + ms + 'ms', {label: 'Telegram'})
})

bot.start(async(ctx) => {
    logger.info("Executed command 'start' at " + ctx.from.id, {label: 'Telegram'})
    await ctx.replyWithMarkdown(ctx.i18n.t('commands.start'))
    addUserTelegram(ctx.from.id, ctx.from.language_code).catch(err => { 
        logger.error(err, {label: 'Telegram'})
    });
})
bot.help(async(ctx) => {
    await ctx.replyWithMarkdown(ctx.i18n.t('commands.start'))
    addUserTelegram(ctx.from.id, ctx.from.language_code).catch(err => { 
        logger.error(err, {label: 'Telegram'})
    });
})
bot.command('git', async (ctx) => {
    await ctx.replyWithMarkdown("*Git:* `"+ utils.getGitCommitHash(false) +"`")
    logger.info("Executed 'git' command at " + ctx.from.id, {label: 'Telegram'})
})
bot.command('uptime', async (ctx) => {
    await ctx.replyWithMarkdown("*Uptime:* `"+ utils.uptime() +"`")
    logger.info("Executed 'uptime' command at " + ctx.from.id, {label: 'Telegram'})
})
bot.command('logs', Stage.enter('logs-wizard'))

bot.hears(/(https?:\/\/[^ ]*)/,  Stage.enter('super-wizard'))

bot.catch((err, ctx) => {
    logger.error(`Ooops, encountered an error for ${ctx.updateType} ${err}`,  {label: 'Telegram'})
})


const profiler = logger.startTimer();
bot.launch().then(() => {
    profiler.done({message: "Bot is up and running", label: 'Telegram'})
})