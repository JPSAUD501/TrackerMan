import { msApiFetch } from '../functions/msApiFetch'
import { ApiErrors } from '../types/errors/ApiErrors'
import { ArtistInfo, zodArtistInfo } from '../types/zodArtistInfo'

type GetInfoResponse = {
  success: true
  data: ArtistInfo
} | ApiErrors

export class Artist {
  private readonly apiKey: string

  constructor (apiKey: string) {
    this.apiKey = apiKey
  }

  async getInfo (artist: string, mbid: string, username: string): Promise<GetInfoResponse> {
    const url = `http://ws.audioscrobbler.com/2.0/?method=artist.getinfo&mbid=${mbid}&artist=${artist}&username=${username}&api_key=${this.apiKey}&format=json`
    const zodObject = zodArtistInfo
    console.log(`Artist getInfo: artist: ${artist}, mbid: ${mbid}, username: ${username}`)
    console.log(`Artist getInfo: url: ${url}`)
    const msApiFetchResponse = await msApiFetch(url, zodObject)
    if (!msApiFetchResponse.success) {
      return msApiFetchResponse
    }
    const artistInfo = zodObject.parse(msApiFetchResponse.data)
    return {
      success: true,
      data: artistInfo
    }
  }
}
