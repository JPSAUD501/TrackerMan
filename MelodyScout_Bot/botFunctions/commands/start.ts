import { CommandContext, Context } from 'grammy'
import { ctxReply } from '../../../function/grammyFunctions'
import { lang } from '../../../translations/base'

export async function runStartCommand (ctx: CommandContext<Context>): Promise<void> {
  const ctxLang = ctx.from?.language_code
  await ctxReply(ctx, 'Oi, eu sou o MelodyScout, e estou aqui rastrear perfis no Last.fm!')
  if (ctx.chat?.type === 'channel') {
    void ctxReply(ctx, lang(ctxLang, 'dontWorkOnChannelsInformMessage'))
    return
  }
  await ctxReply(ctx, 'Que legal fazer parte desse grupo com vocês! Espero que gostem de mim! Bom, vamos lá!\n\nUtilize o comando <code>/myuser</code> para definir seu nome de usuário do Last.fm!\n\nPor exemplo: <code>/myuser MelodyScout</code>')
  await ctxReply(ctx, 'Aproveitando a oportunidade, você pode me enviar o comando /help para saber mais sobre os comandos que eu possuo!')
}
