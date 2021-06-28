import { useAtomValue } from 'jotai/utils';
import React, { useEffect } from 'react';
import { FlatList, Text, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import LinearGradient from 'react-native-linear-gradient';
import { Album } from '../../models/music';
import { albumsAtom, albumsUpdatingAtom, useUpdateAlbums } from '../../state/music';
import colors from '../../styles/colors';
import textStyles from '../../styles/text';
import TopTabContainer from '../common/TopTabContainer';

const AlbumArt: React.FC<{
  height: number,
  width: number,
  coverArtUri?: string
}> = ({ height, width, coverArtUri }) => {
  const Placeholder = (
    <LinearGradient
      colors={[colors.accent, colors.accentLow]}
      style={{ height, width }}
    >
      <FastImage
        source={require('../../../res/record-m.png')}
        style={{ height, width }}
        resizeMode={FastImage.resizeMode.contain}
      />
    </LinearGradient>
  );

  const CoverArt = (
    <View style={{ height, width }}>
      <FastImage
        source={{ uri: coverArtUri }}
        style={{ height, width }}
        resizeMode={FastImage.resizeMode.contain}
      />
    </View>
  );

  return coverArtUri ? CoverArt : Placeholder;
}
const MemoAlbumArt = React.memo(AlbumArt);

const AlbumItem: React.FC<{
  name: string,
  artist?: string,
  coverArtUri?: string
} > = ({ name, artist, coverArtUri }) => {
  const size = 125;

  return (
    <View style={{
      alignItems: 'center',
      marginVertical: 8,
      flex: 1/3,
    }}>
      <MemoAlbumArt
        width={size}
        height={size}
        coverArtUri={coverArtUri}
      />
      <View style={{
        flex: 1,
        width: size,
      }}>
        <Text
          style={{
            ...textStyles.itemTitle,
            marginTop: 4,
          }}
          numberOfLines={2}
        >
          {name}
        </Text>
        <Text
          style={{ ...textStyles.itemSubtitle }}
          numberOfLines={1}
        >
          {artist}
        </Text>
      </View>
    </View>
  );
}
const MemoAlbumItem = React.memo(AlbumItem);

const AlbumListRenderItem: React.FC<{ item: Album }> = ({ item }) => (
  <MemoAlbumItem name={item.name} artist={item.artist} coverArtUri={item.coverArtThumbUri} />
);

const AlbumsList = () => {
  const albums = useAtomValue(albumsAtom);
  const updating = useAtomValue(albumsUpdatingAtom);
  const updateAlbums = useUpdateAlbums();

  useEffect(() => {
    if (albums.length === 0) {
      updateAlbums();
    }
  });

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={albums}
        renderItem={AlbumListRenderItem}
        keyExtractor={item => item.id}
        numColumns={3}
        removeClippedSubviews={true}
        refreshing={updating}
        onRefresh={updateAlbums}
      />
    </View>
  );
}

const AlbumsTab = () => (
  <TopTabContainer>
    <React.Suspense fallback={<Text>Loading...</Text>}>
      <AlbumsList />
    </React.Suspense>
  </TopTabContainer>
);

export default React.memo(AlbumsTab);
