import { type PrismaClient } from '@prisma/client'
import { advError } from '../../../function/advancedConsole'

type CreateDefaultResponse = {
  success: true
  info: string
} | {
  success: false
  error: string
}

export class Create {
  private readonly prisma: PrismaClient

  constructor (MsPrismaDbApi: PrismaClient) {
    this.prisma = MsPrismaDbApi
  }

  async telegramUser (telegramUserId: string): Promise<CreateDefaultResponse> {
    const createdTelegramUser = await this.prisma.telegramUsers.create({
      data: {
        telegramUserId,
        lastUpdate: new Date().getTime().toString()
      }
    }).catch((err) => {
      advError('Error while creating new telegram user! Telegram User Id: ' + telegramUserId)
      advError(err)
      return new Error(err)
    })
    if (createdTelegramUser instanceof Error) return { success: false, error: createdTelegramUser.message }
    return { success: true, info: 'Telegram user created!' }
  }

  async errorLog (error: string, userId: string, chatId: string, messageId?: string): Promise<CreateDefaultResponse> {
    const createdErrorLog = await this.prisma.errorLog.create({
      data: {
        date: new Date().getTime().toString(),
        error,
        userId,
        chatId,
        messageId
      }
    }).catch((err) => {
      advError('Error while creating new error log! Error: ' + error)
      advError(err)
      return new Error(err)
    })
    if (createdErrorLog instanceof Error) return { success: false, error: createdErrorLog.message }
    return { success: true, info: 'Error log created!' }
  }
}
