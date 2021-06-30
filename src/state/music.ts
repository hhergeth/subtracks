import { atom, useAtom } from 'jotai';
import { atomFamily, useAtomValue, useUpdateAtom } from 'jotai/utils';
import { Album as Album, AlbumWithSongs, Artist, ArtistInfo, Song } from '../models/music';
import { SubsonicApiClient } from '../subsonic/api';
import { AlbumID3Element, ArtistID3Element, ArtistInfo2Element, ChildElement } from '../subsonic/elements';
import { GetArtistResponse } from '../subsonic/responses';
import { activeServerAtom } from './settings';

export const artistsAtom = atom<Artist[]>([]);
export const artistsUpdatingAtom = atom(false);

export const useUpdateArtists = () => {
  const server = useAtomValue(activeServerAtom);
  const [updating, setUpdating] = useAtom(artistsUpdatingAtom);
  const setArtists = useUpdateAtom(artistsAtom);

  if (!server) {
    return () => Promise.resolve();
  }

  return async () => {
    if (updating) {
      return;
    }
    setUpdating(true);

    const client = new SubsonicApiClient(server);
    const response = await client.getArtists();

    setArtists(response.data.artists.map(x => ({
      id: x.id,
      name: x.name,
      starred: x.starred,
    })));
    setUpdating(false);
  }
}

export const albumsAtom = atom<Album[]>([]);
export const albumsUpdatingAtom = atom(false);

export const useUpdateAlbums = () => {
  const server = useAtomValue(activeServerAtom);
  const [updating, setUpdating] = useAtom(albumsUpdatingAtom);
  const setAlbums = useUpdateAtom(albumsAtom);

  if (!server) {
    return () => Promise.resolve();
  }

  return async () => {
    if (updating) {
      return;
    }
    setUpdating(true);

    const client = new SubsonicApiClient(server);
    const response = await client.getAlbumList2({ type: 'alphabeticalByArtist', size: 500 });

    setAlbums(response.data.albums.map(a => mapAlbumID3(a, client)));
    setUpdating(false);
  }
}

export const albumAtomFamily = atomFamily((id: string) => atom<AlbumWithSongs | undefined>(async (get) => {
  const server = get(activeServerAtom);
  if (!server) {
    return undefined;
  }

  const client = new SubsonicApiClient(server);
  const response = await client.getAlbum({ id });
  return mapAlbumID3WithSongs(response.data.album, response.data.songs, client);
}));

export const artistInfoAtomFamily = atomFamily((id: string) => atom<ArtistInfo | undefined>(async (get) => {
  const server = get(activeServerAtom);
  if (!server) {
    return undefined;
  }

  const client = new SubsonicApiClient(server);
  const [artistResponse, artistInfoResponse] = await Promise.all([
    client.getArtist({ id }),
    client.getArtistInfo2({ id }),
  ]);
  return mapArtistInfo(artistResponse.data, artistInfoResponse.data.artistInfo, client);
}));

function mapArtistInfo(
  artistResponse: GetArtistResponse,
  artistInfo: ArtistInfo2Element,
  client: SubsonicApiClient
): ArtistInfo {
  const info = { ...artistInfo } as any;
  delete info.similarArtists;

  const { artist, albums } = artistResponse

  const mappedAlbums = albums.map(a => mapAlbumID3(a, client));
  const coverArtUris = mappedAlbums
    .sort((a, b) => {
      if (a.year && b.year) {
        return a.year - b.year;
      } else {
        return a.name.localeCompare(b.name) - 9000;
      }
    })
    .map(a => a.coverArtThumbUri);

  return {
    ...artist,
    ...info,
    albums: mappedAlbums,
    coverArtUris,
  }
}

function mapAlbumID3(album: AlbumID3Element, client: SubsonicApiClient): Album {
  return { 
    ...album,
    coverArtUri: album.coverArt ? client.getCoverArtUri({ id: album.coverArt }) : undefined,
    coverArtThumbUri: album.coverArt ? client.getCoverArtUri({ id: album.coverArt, size: '256' }) : undefined,
  }
}

function mapChildToSong(child: ChildElement, client: SubsonicApiClient): Song {
  return {
    ...child,
    streamUri: client.streamUri({ id: child.id }),
    coverArtUri: child.coverArt ? client.getCoverArtUri({ id: child.coverArt }) : undefined,
  }
}

function mapAlbumID3WithSongs(
  album: AlbumID3Element,
  songs: ChildElement[],
  client: SubsonicApiClient
): AlbumWithSongs {
  return {
    ...mapAlbumID3(album, client),
    songs: songs.map(s => mapChildToSong(s, client)),
  }
}
