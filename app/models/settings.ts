import { GetAlbumList2Type } from '@app/subsonic/params'

export interface Server {
  id: string
  address: string
  username: string
  token: string
  salt: string
}

export interface AlbumFilterSettings {
  type: GetAlbumList2Type
  fromYear: number
  toYear: number
  genre: string
}

export type ArtistFilterType = 'random' | 'starred' | 'alphabeticalByName'

export interface ArtistFilterSettings {
  type: ArtistFilterType
}

export interface AppSettings {
  servers: Server[]
  screens: {
    home: {
      lists: string[]
    }
    library: {
      albums: AlbumFilterSettings
      artists: ArtistFilterSettings
    }
  }
  activeServer?: string
  scrobble: boolean
  estimateContentLength: boolean
  maxBitrateWifi: number
  maxBitrateMobile: number
  minBuffer: number
  maxBuffer: number
}
