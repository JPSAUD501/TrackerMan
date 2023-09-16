import { CallbackQueryContext, Context, InlineKeyboard } from 'grammy'
import { ctxAnswerCallbackQuery, ctxReply } from '../../../function/grammyFunctions'
import { getCallbackKey } from '../../../function/callbackMaker'
import { melodyScoutConfig } from '../../../config'
import { lang } from '../../../translations/base'
import { getTrackdownloadText } from '../../textFabric/trackdownload'
// import axios from 'axios'

export async function runTrackDownloadCallback (ctx: CallbackQueryContext<Context>): Promise<void> {
  const ctxLang = ctx.from.language_code
  if (ctx.chat?.type === 'channel') {
    void ctxReply(ctx, lang(ctxLang, 'dontWorkOnChannelsInformMessage'))
    void ctxAnswerCallbackQuery(ctx, lang(ctxLang, 'dontWorkOnChannelsInformCallback'))
    return
  }
  void ctxAnswerCallbackQuery(ctx, lang(ctxLang, 'loadingInformCallback'))
  const messageId = ctx.callbackQuery.message?.message_id
  const dataArray = ctx.callbackQuery.data.split(melodyScoutConfig.divider)
  const track = dataArray[1]
  const artist = dataArray[2]
  if (track === undefined || artist === undefined) {
    void ctxReply(ctx, lang(ctxLang, 'lastfmTrackDataNotFoundedError'))
    return
  }
  const inlineKeyboard = new InlineKeyboard()
  inlineKeyboard.text(lang(ctxLang, 'trackDownloadAudioButton'), getCallbackKey(['TAD', track.replace(/  +/g, ' '), artist.replace(/  +/g, ' ')]))
  inlineKeyboard.text(lang(ctxLang, 'trackDownloadVideoButton'), getCallbackKey(['TVD', track.replace(/  +/g, ' '), artist.replace(/  +/g, ' ')]))
  await ctxReply(ctx, getTrackdownloadText(ctxLang, track, artist, ctx.from.id.toString(), ctx.from.first_name), {
    reply_markup: inlineKeyboard,
    reply_to_message_id: messageId,
    allow_sending_without_reply: true,
    disable_notification: true
  })
}
