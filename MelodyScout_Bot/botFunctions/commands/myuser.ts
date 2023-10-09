import { type CommandContext, type Context } from 'grammy'
import { ctxReply } from '../../../functions/grammyFunctions'
import { type MsPrismaDbApi } from '../../../api/msPrismaDbApi/base'
import { advInfo } from '../../../functions/advancedConsole'
import { lastfmConfig } from '../../../config'
import { MsLastfmApi } from '../../../api/msLastfmApi/base'
import { lang } from '../../../translations/base'
import { getMyuserText } from '../../textFabric/myuser'

export async function runMyuserCommand (msPrismaDbApi: MsPrismaDbApi, ctx: CommandContext<Context>): Promise<void> {
  const ctxLang = ctx.from?.language_code
  if (ctx.chat?.type === 'channel') {
    void ctxReply(ctx, undefined, lang(ctxLang, 'dontWorkOnChannelsInformMessage'))
    return
  }
  const telegramUserId = ctx.from?.id.toString()
  if (telegramUserId === undefined) {
    await ctxReply(ctx, undefined, lang(ctxLang, 'unableToGetUserIdErrorMessage'))
    return
  }
  const checkIfExistsTgUserDBResponse = await msPrismaDbApi.checkIfExists.telegramUser(`${telegramUserId}`)
  if (!checkIfExistsTgUserDBResponse.success) {
    void ctxReply(ctx, undefined, lang(ctxLang, 'unableToGetUserInfoInDb'))
    return
  }
  if (!checkIfExistsTgUserDBResponse.exists) {
    void ctxReply(ctx, undefined, lang(ctxLang, 'firstTimeRegisterWelcomeMessage'))
    const createTelegramUserDBResponse = await msPrismaDbApi.create.telegramUser(telegramUserId)
    if (!createTelegramUserDBResponse.success) {
      void ctxReply(ctx, undefined, lang(ctxLang, 'unableToGetUserInfoInDb'))
      return
    }
    advInfo(`New user "${telegramUserId}" registered!`)
  }
  const telegramUserDBResponse = await msPrismaDbApi.get.telegramUser(telegramUserId)
  if (!telegramUserDBResponse.success) {
    void ctxReply(ctx, undefined, lang(ctxLang, 'unableToGetUserInfoInDb'))
    return
  }
  const message = ((ctx.message?.text?.split(' ')) != null) ? ctx.message?.text?.split(' ') : []
  if (message.length < 2 && telegramUserDBResponse.lastfmUser === null) {
    void ctxReply(ctx, undefined, lang(ctxLang, 'myuserMissingLastfmUserErrorMessage'))
    return
  }
  if (message.length < 2 && telegramUserDBResponse.lastfmUser !== null) {
    void ctxReply(ctx, undefined, lang(ctxLang, 'myuserAlreadyRegisteredLastfmUserInformMessage', { lastfmUser: telegramUserDBResponse.lastfmUser }))
    return
  }
  const username = message[1]
  if (username === telegramUserDBResponse.lastfmUser) {
    void ctxReply(ctx, undefined, lang(ctxLang, 'myuserAlreadyRegisteredLastfmUserErrorMessage', { lastfmUser: username }))
    return
  }
  if (telegramUserDBResponse.lastfmUser !== null) {
    void ctxReply(ctx, undefined, lang(ctxLang, 'myuserAlreadyRegisteredLastfmUserChangingInformMessage'))
  }
  const msLastfmApi = new MsLastfmApi(lastfmConfig.apiKey)
  const userExists = await msLastfmApi.checkIfUserExists(username)
  if (!userExists.success) {
    void ctxReply(ctx, undefined, lang(ctxLang, 'myuserLastfmUserCheckErrorMessage'))
    return
  }
  if (!userExists.exists) {
    void ctxReply(ctx, undefined, lang(ctxLang, 'myuserLastfmUserNotExistsInLastfmErrorMessage'))
    return
  }
  const updateTelegramUserDBResponse = await msPrismaDbApi.update.telegramUser(telegramUserId, username)
  if (!updateTelegramUserDBResponse.success) {
    void ctxReply(ctx, undefined, lang(ctxLang, 'myuserLastfmUserDatabaseUpdateErrorMessage'))
    return
  }
  advInfo(`The user "${telegramUserId}" registered the Last.fm username "${username}" in MelodyScout!`)
  await ctxReply(ctx, undefined, getMyuserText(ctxLang))
}
