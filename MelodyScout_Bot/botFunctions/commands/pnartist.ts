import { type CallbackQueryContext, type CommandContext, type Context, InlineKeyboard } from 'grammy'
import { PromisePool } from '@supercharge/promise-pool'
import { getPnartistText } from '../../textFabric/pnartist'
import { ctxReply } from '../../../functions/grammyFunctions'
import { lastfmConfig } from '../../../config'
import { MsLastfmApi } from '../../../api/msLastfmApi/base'
import { type MsPrismaDbApi } from '../../../api/msPrismaDbApi/base'
import { type MsMusicApi } from '../../../api/msMusicApi/base'
import { lang } from '../../../translations/base'
import { type UserTopTracks } from '../../../api/msLastfmApi/types/zodUserTopTracks'

export async function runPnartistCommand (msMusicApi: MsMusicApi, msPrismaDbApi: MsPrismaDbApi, ctx: CommandContext<Context> | CallbackQueryContext<Context>): Promise<void> {
  const ctxLang = ctx.from?.language_code
  if (ctx.chat?.type === 'channel') {
    void ctxReply(ctx, undefined, lang(ctxLang, 'dontWorkOnChannelsInformMessage'))
    return
  }
  const telegramUserId = ctx.from?.id
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
    void ctxReply(ctx, undefined, lang(ctxLang, 'lastfmUserNotRegistered'))
    return
  }
  const telegramUserDBResponse = await msPrismaDbApi.get.telegramUser(`${telegramUserId}`)
  if (!telegramUserDBResponse.success) {
    void ctxReply(ctx, undefined, lang(ctxLang, 'unableToGetUserInfoInDb'))
    return
  }
  const lastfmUser = telegramUserDBResponse.lastfmUser
  if (lastfmUser === null) {
    void ctxReply(ctx, undefined, lang(ctxLang, 'lastfmUserNoMoreRegisteredError'))
    return
  }
  const msLastfmApi = new MsLastfmApi(lastfmConfig.apiKey)
  const userInfoRequest = msLastfmApi.user.getInfo(lastfmUser)
  const userRecentTracksRequest = msLastfmApi.user.getRecentTracks(lastfmUser, 1, 1)
  const userTopTracksRequest = msLastfmApi.user.getTopTracks(lastfmUser, 1, 1)
  const [userInfo, userRecentTracks, userTopTracks] = await Promise.all([userInfoRequest, userRecentTracksRequest, userTopTracksRequest])
  if (!userInfo.success) {
    void ctxReply(ctx, undefined, lang(ctxLang, 'lastfmUserDataNotFoundedError', { lastfmUser }))
    return
  }
  if (!userRecentTracks.success) {
    void ctxReply(ctx, undefined, lang(ctxLang, 'unableToGetUserRecentTracksHistory'))
    return
  }
  if (userRecentTracks.data.recenttracks.track.length <= 0) {
    void ctxReply(ctx, undefined, lang(ctxLang, 'noRecentTracksError'))
    return
  }
  if (!userTopTracks.success) {
    void ctxReply(ctx, undefined, lang(ctxLang, 'getTopTracksErrorMessage'))
    return
  }
  const mainTrack = {
    artistName: userRecentTracks.data.recenttracks.track[0].artist.name,
    artistMbid: userRecentTracks.data.recenttracks.track[0].artist.mbid,
    nowPlaying: userRecentTracks.data.recenttracks.track[0]['@attr']?.nowplaying === 'true'
  }
  const artistInfoRequest = msLastfmApi.artist.getInfo(mainTrack.artistName, mainTrack.artistMbid, lastfmUser)
  const spotifyArtistInfoRequest = msMusicApi.getSpotifyArtistInfo(mainTrack.artistName)
  const [artistInfo, spotifyArtistInfo] = await Promise.all([artistInfoRequest, spotifyArtistInfoRequest])
  if (!artistInfo.success) {
    void ctxReply(ctx, undefined, lang(ctxLang, 'lastfmArtistDataNotFoundedError'))
    return
  }
  if (!spotifyArtistInfo.success) {
    void ctxReply(ctx, undefined, lang(ctxLang, 'spotifyArtistDataNotFoundedError'))
    return
  }
  const userArtistTopTracks: Array<UserTopTracks['toptracks']['track']['0']> = []
  const userTopTracksPageLength = Math.ceil(Number(userTopTracks.data.toptracks['@attr'].total) / 1000)
  const allUserArtistTopTracksResponses = await PromisePool.for(
    Array.from({ length: userTopTracksPageLength }, (_, index) => index + 1)
  ).withConcurrency(5).process(async (page, _index, pool) => {
    const userPartialTopTracksRequest = msLastfmApi.user.getTopTracks(lastfmUser, 1000, page)
    const userTopTracks = await userPartialTopTracksRequest
    if (!userTopTracks.success) {
      pool.stop()
      return userTopTracks
    }
    for (const userArtistTopTrack of userTopTracks.data.toptracks.track) {
      if (userArtistTopTrack.artist.name === mainTrack.artistName) {
        userArtistTopTracks.push(userArtistTopTrack)
      }
    }
  })
  for (const userArtistTopTracksResponse of allUserArtistTopTracksResponses.results) {
    if (userArtistTopTracksResponse === undefined) continue
    if (!userArtistTopTracksResponse.success) {
      void ctxReply(ctx, undefined, lang(ctxLang, 'getTopTracksErrorMessage'))
      return
    }
  }
  userArtistTopTracks.sort((a, b) => Number(b.playcount) - Number(a.playcount))
  const inlineKeyboard = new InlineKeyboard()
  inlineKeyboard.url(lang(ctxLang, 'spotifyButton'), spotifyArtistInfo.data[0].external_urls.spotify)
  await ctxReply(ctx, undefined, getPnartistText(ctxLang, userInfo.data, artistInfo.data, userArtistTopTracks, spotifyArtistInfo.data[0], mainTrack.nowPlaying), { reply_markup: inlineKeyboard })
}
