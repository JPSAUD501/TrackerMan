import { CommandContext, Context } from 'grammy'
import { ctxReply } from '../../../function/grammyFunctions'
import { MsPrismaDbApi } from '../../../api/msPrismaDbApi/base'
import { melodyScoutConfig } from '../../../config'
import { lang } from '../../../translations/base'

export async function runAllusersCommand (msPrismaDbApi: MsPrismaDbApi, ctx: CommandContext<Context>): Promise<void> {
  const ctxLang = ctx.from?.language_code
  if (ctx.chat?.type === 'channel') {
    void ctxReply(ctx, lang(ctxLang, 'dontWorkOnChannelsInformMessage'))
    return
  }
  const ctxFromId = ctx.from?.id
  if (ctxFromId === undefined) {
    await ctxReply(ctx, 'Infelizmente não foi possível identificar seu id, por favor tente novamente mais tarde!')
    return
  }
  if (!melodyScoutConfig.admins.includes(ctxFromId.toString())) return
  const allUsers = await msPrismaDbApi.get.allTelegramUsers()
  if (!allUsers.success) {
    await ctxReply(ctx, 'Infelizmente não foi possível recuperar os usuários do banco de dados, por favor tente novamente mais tarde!')
    return
  }
  const personsEmojis = ['🧑', '🧔', '🧓', '🧕', '🧙', '🧚', '🧛', '🧜', '🧝', '🧞', '🧟', '👨', '👩', '👱', '👴', '👵', '👲', '👳', '👮', '👷', '💂', '🕵', '👼', '🎅', '👸', '🤴', '👰', '🤵']
  const allUsersString = allUsers.telegramUsers.map((user) => {
    return `<b>[${personsEmojis[parseInt(user.telegramUserId) % personsEmojis.length]}] <code>${user.lastfmUser === null ? 'Descadastrado' : user.lastfmUser}</code>:</b>\n- TelegramID: <code>${user.telegramUserId}</code>\n- LastUpdate: <code>${user.lastUpdate}</code>\n`
  }).join('\n')
  await ctxReply(ctx, `<b>[🗃] Lista de usuários:</b>\n- Total de usuários: <code>${allUsers.telegramUsers.length}</code>\n\n${allUsersString}`)
}
