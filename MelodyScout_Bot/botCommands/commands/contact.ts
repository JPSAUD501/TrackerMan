import { CommandContext, Context } from "grammy";
import { CtxFunctions } from "../../../functions/ctxFunctions";

export class ContactCommand {
  private ctxFunctions: CtxFunctions;

  constructor (ctxFunctions: CtxFunctions) {
    this.ctxFunctions = ctxFunctions;
  }

  async run (ctx: CommandContext<Context>): Promise<void> {
    await this.ctxFunctions.ctxReply(ctx, 'Para entrar em contato com o desenvolvedor do bot, envie uma mensagem para o @jpsaud501!');
  }
}