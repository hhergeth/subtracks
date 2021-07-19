export interface Artist {
  id: string
  name: string
  starred?: Date
}

export interface ArtistInfo extends Artist {
  albums: Album[]

  mediumImageUrl?: string
  largeImageUrl?: string
  albumCoverUris: string[]

  topSongs: Song[]
}

export interface ArtistArt {
  uri?: string
  albumCoverUris: string[]
}

export interface AlbumListItem {
  id: string
  name: string
  artist?: string
  starred?: Date
  coverArtThumbUri?: string
}

export interface Album extends AlbumListItem {
  coverArtUri?: string
  year?: number
}

export interface AlbumWithSongs extends Album {
  songs: Song[]
}

export interface PlaylistListItem {
  id: string
  name: string
  comment?: string
  coverArtThumbUri?: string
}

export interface PlaylistWithSongs extends PlaylistListItem {
  songs: Song[]
  coverArtUri?: string
}

export interface Song {
  id: string
  album?: string
  artist?: string
  title: string
  track?: number
  duration?: number
  starred?: Date

  streamUri: string
  coverArtUri?: string
  coverArtThumbUri?: string
}

export type DownloadedSong = {
  id: string
  type: 'song'
  name: string
  album: string
  artist: string
}

export type DownloadedAlbum = {
  id: string
  type: 'album'
  songs: string[]
  name: string
  artist: string
}

export type DownloadedArtist = {
  id: string
  type: 'artist'
  songs: string[]
  name: string
}

export type DownloadedPlaylist = {
  id: string
  type: 'playlist'
  songs: string[]
  name: string
}
