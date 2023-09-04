import { lang } from '../../translations/base'

export function getContactText (ctxLang: string | undefined): string {
  const textArray: string[] = []
  // textArray.push('Para entrar em contato com o desenvolvedor do bot, envie uma mensagem para o @jpsaud!')
  textArray.push(lang(ctxLang, 'tfContactInform'))
  const text = textArray.join('\n')
  return text
}
