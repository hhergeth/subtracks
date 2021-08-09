import {
  AlbumListItem,
  AlbumWithSongs,
  Artist,
  ArtistInfo,
  HomeLists,
  mapAlbumID3toAlbumListItem,
  mapAlbumID3WithSongstoAlbunWithSongs,
  mapArtistID3toArtist,
  mapArtistInfo,
  mapChildToSong,
  mapPlaylistListItem,
  mapPlaylistWithSongs,
  PlaylistListItem,
  PlaylistWithSongs,
  SearchResults,
} from '@app/models/music'
import { Store } from '@app/state/store'
import { GetAlbumList2Type, StarParams } from '@app/subsonic/params'
import produce from 'immer'
import { GetState, SetState } from 'zustand'

export type MusicSlice = {
  //
  // family-style state
  //
  artistInfo: { [id: string]: ArtistInfo }
  fetchArtistInfo: (id: string) => Promise<ArtistInfo | undefined>

  albumsWithSongs: { [id: string]: AlbumWithSongs }
  fetchAlbumWithSongs: (id: string) => Promise<AlbumWithSongs | undefined>

  playlistsWithSongs: { [id: string]: PlaylistWithSongs }
  fetchPlaylistWithSongs: (id: string) => Promise<PlaylistWithSongs | undefined>

  //
  // lists-style state
  //
  artists: Artist[]
  artistsUpdating: boolean
  fetchArtists: () => Promise<void>

  playlists: PlaylistListItem[]
  playlistsUpdating: boolean
  fetchPlaylists: () => Promise<void>

  albums: AlbumListItem[]
  albumsUpdating: boolean
  fetchAlbums: (size?: number, offset?: number) => Promise<void>

  searchResults: SearchResults
  searchResultsUpdating: boolean
  fetchSearchResults: (query: string) => Promise<void>
  clearSearchResults: () => void

  homeLists: HomeLists
  homeListsUpdating: boolean
  fetchHomeLists: () => Promise<void>
  clearHomeLists: () => void

  starred: { [type: string]: { [id: string]: boolean } }
  starItem: (id: string, type: string, unstar?: boolean) => Promise<void>
}

export const selectMusic = {
  fetchArtistInfo: (state: Store) => state.fetchArtistInfo,
  fetchAlbumWithSongs: (state: Store) => state.fetchAlbumWithSongs,
  fetchPlaylistWithSongs: (state: Store) => state.fetchPlaylistWithSongs,

  artists: (store: MusicSlice) => store.artists,
  artistsUpdating: (store: MusicSlice) => store.artistsUpdating,
  fetchArtists: (store: MusicSlice) => store.fetchArtists,

  playlists: (store: MusicSlice) => store.playlists,
  playlistsUpdating: (store: MusicSlice) => store.playlistsUpdating,
  fetchPlaylists: (store: MusicSlice) => store.fetchPlaylists,

  albums: (store: MusicSlice) => store.albums,
  albumsUpdating: (store: MusicSlice) => store.albumsUpdating,
  fetchAlbums: (store: MusicSlice) => store.fetchAlbums,

  searchResults: (store: MusicSlice) => store.searchResults,
  searchResultsUpdating: (store: MusicSlice) => store.searchResultsUpdating,
  fetchSearchResults: (store: MusicSlice) => store.fetchSearchResults,
  clearSearchResults: (store: MusicSlice) => store.clearSearchResults,

  homeLists: (store: MusicSlice) => store.homeLists,
  homeListsUpdating: (store: MusicSlice) => store.homeListsUpdating,
  fetchHomeLists: (store: MusicSlice) => store.fetchHomeLists,
  clearHomeLists: (store: MusicSlice) => store.clearHomeLists,

  starItem: (store: MusicSlice) => store.starItem,
}

function reduceStarred(
  starredType: { [id: string]: boolean },
  items: { id: string; starred?: Date }[],
): { [id: string]: boolean } {
  return {
    ...starredType,
    ...items.reduce((acc, val) => {
      acc[val.id] = !!val.starred
      return acc
    }, {} as { [id: string]: boolean }),
  }
}

export const createMusicSlice = (set: SetState<Store>, get: GetState<Store>): MusicSlice => ({
  artistInfo: {},

  fetchArtistInfo: async id => {
    const client = get().client
    if (!client) {
      return undefined
    }

    try {
      const [artistResponse, artistInfoResponse] = await Promise.all([
        client.getArtist({ id }),
        client.getArtistInfo2({ id }),
      ])
      const topSongsResponse = await client.getTopSongs({ artist: artistResponse.data.artist.name, count: 50 })
      const artistInfo = mapArtistInfo(
        artistResponse.data,
        artistInfoResponse.data.artistInfo,
        topSongsResponse.data.songs,
        client,
      )

      set(
        produce<MusicSlice>(state => {
          state.artistInfo[id] = artistInfo
          state.starred.song = reduceStarred(state.starred.song, artistInfo.topSongs)
          state.starred.artist = reduceStarred(state.starred.artist, [artistInfo])
          state.starred.album = reduceStarred(state.starred.album, artistInfo.albums)
        }),
      )
      return artistInfo
    } catch {
      return undefined
    }
  },

  albumsWithSongs: {},

  fetchAlbumWithSongs: async id => {
    const client = get().client
    if (!client) {
      return undefined
    }

    try {
      const response = await client.getAlbum({ id })
      const album = mapAlbumID3WithSongstoAlbunWithSongs(response.data.album, response.data.songs, client)

      set(
        produce<MusicSlice>(state => {
          state.albumsWithSongs[id] = album
          state.starred.song = reduceStarred(state.starred.song, album.songs)
          state.starred.album = reduceStarred(state.starred.album, [album])
        }),
      )
      return album
    } catch {
      return undefined
    }
  },

  playlistsWithSongs: {},

  fetchPlaylistWithSongs: async id => {
    const client = get().client
    if (!client) {
      return undefined
    }

    try {
      const response = await client.getPlaylist({ id })
      const playlist = mapPlaylistWithSongs(response.data.playlist, client)

      set(
        produce<MusicSlice>(state => {
          state.playlistsWithSongs[id] = playlist
          state.starred.song = reduceStarred(state.starred.song, playlist.songs)
        }),
      )
      return playlist
    } catch {
      return undefined
    }
  },

  artists: [],
  artistsUpdating: false,

  fetchArtists: async () => {
    const client = get().client
    if (!client) {
      return
    }

    if (get().artistsUpdating) {
      return
    }
    set({ artistsUpdating: true })

    try {
      const response = await client.getArtists()
      set(
        produce<MusicSlice>(state => {
          state.artists = response.data.artists.map(mapArtistID3toArtist)
          state.starred.artist = reduceStarred(state.starred.artist, state.artists)
        }),
      )
    } finally {
      set({ artistsUpdating: false })
    }
  },

  playlists: [],
  playlistsUpdating: false,

  fetchPlaylists: async () => {
    const client = get().client
    if (!client) {
      return
    }

    if (get().playlistsUpdating) {
      return
    }
    set({ playlistsUpdating: true })

    try {
      const response = await client.getPlaylists()
      set({ playlists: response.data.playlists.map(mapPlaylistListItem) })
    } finally {
      set({ playlistsUpdating: false })
    }
  },

  albums: [],
  albumsUpdating: false,

  fetchAlbums: async (size = 500, offset = 0) => {
    const client = get().client
    if (!client) {
      return
    }

    if (get().albumsUpdating) {
      return
    }
    set({ albumsUpdating: true })

    try {
      const response = await client.getAlbumList2({ type: 'alphabeticalByArtist', size, offset })
      set(
        produce<MusicSlice>(state => {
          state.albums = response.data.albums.map(mapAlbumID3toAlbumListItem)
          state.starred.albums = reduceStarred(state.starred.albums, state.albums)
        }),
      )
    } finally {
      set({ albumsUpdating: false })
    }
  },

  searchResults: {
    artists: [],
    albums: [],
    songs: [],
  },
  searchResultsUpdating: false,

  fetchSearchResults: async query => {
    if (query.length < 2) {
      return
    }

    const client = get().client
    if (!client) {
      return
    }

    if (get().searchResultsUpdating) {
      return
    }

    set({ searchResultsUpdating: true })

    try {
      const response = await client.search3({ query })
      set(
        produce<MusicSlice>(state => {
          state.searchResults = {
            artists: response.data.artists.map(mapArtistID3toArtist),
            albums: response.data.albums.map(mapAlbumID3toAlbumListItem),
            songs: response.data.songs.map(a => mapChildToSong(a, client)),
          }
          state.starred.song = reduceStarred(state.starred.song, state.searchResults.songs)
          state.starred.artist = reduceStarred(state.starred.artist, state.searchResults.artists)
          state.starred.album = reduceStarred(state.starred.album, state.searchResults.albums)
        }),
      )
    } finally {
      set({ searchResultsUpdating: false })
    }
  },
  clearSearchResults: () => {
    set({
      searchResults: {
        artists: [],
        albums: [],
        songs: [],
      },
    })
  },

  homeLists: {},
  homeListsUpdating: false,

  fetchHomeLists: async () => {
    const client = get().client
    if (!client) {
      return
    }

    if (get().homeListsUpdating) {
      return
    }
    set({ homeListsUpdating: true })

    const types = get().settings.home.lists

    try {
      const promises: Promise<any>[] = []
      for (const type of types) {
        promises.push(
          client.getAlbumList2({ type: type as GetAlbumList2Type, size: 20 }).then(response => {
            set(
              produce<MusicSlice>(state => {
                state.homeLists[type] = response.data.albums.map(mapAlbumID3toAlbumListItem)
                state.starred.album = reduceStarred(state.starred.album, state.homeLists[type])
              }),
            )
          }),
        )
      }
      await Promise.all(promises)
    } finally {
      set({ homeListsUpdating: false })
    }
  },

  clearHomeLists: () => {
    set({ homeLists: {} })
  },

  starred: {
    song: {},
    album: {},
    artist: {},
  },

  starItem: async (id, type, unstar = false) => {
    const client = get().client
    if (!client) {
      return
    }

    let params: StarParams
    switch (type) {
      case 'song':
        params = { id }
        break
      case 'album':
        params = { albumId: id }
        break
      case 'artist':
        params = { artistId: id }
        break
      default:
        return
    }

    const setStarred = (starred: boolean) => {
      set(
        produce<MusicSlice>(state => {
          state.starred[type] = {
            ...state.starred[type],
            [id]: starred,
          }
        }),
      )
    }

    try {
      setStarred(!unstar)
      if (unstar) {
        await client.unstar(params)
      } else {
        await client.star(params)
      }
    } catch {
      setStarred(unstar)
    }
  },
})
