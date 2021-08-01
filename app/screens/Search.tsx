import GradientScrollView from '@app/components/GradientScrollView'
import Header from '@app/components/Header'
import ListItem from '@app/components/ListItem'
import NothingHere from '@app/components/NothingHere'
import { useUpdateSearchResults } from '@app/hooks/music'
import { ListableItem, SearchResults, Song } from '@app/models/music'
import { searchResultsAtom, searchResultsUpdatingAtom } from '@app/state/music'
import { useSetQueue } from '@app/state/trackplayer'
import colors from '@app/styles/colors'
import font from '@app/styles/font'
import { useAtomValue } from 'jotai/utils'
import debounce from 'lodash.debounce'
import React, { useCallback, useMemo, useState } from 'react'
import { ActivityIndicator, StatusBar, StyleSheet, TextInput, View } from 'react-native'

const SongItem = React.memo<{ item: Song }>(({ item }) => {
  const setQueue = useSetQueue()

  return (
    <ListItem
      item={item}
      showArt={true}
      showStar={false}
      onPress={() => setQueue([item], `Search: ${item.title}`, 0)}
    />
  )
})

const ResultsCategory = React.memo<{
  name: string
  items: ListableItem[]
}>(({ name, items }) => {
  if (items.length === 0) {
    return <></>
  }

  return (
    <>
      <Header>{name}</Header>
      {items.map(a =>
        a.itemType === 'song' ? (
          <SongItem key={a.id} item={a} />
        ) : (
          <ListItem key={a.id} item={a} showArt={true} showStar={false} />
        ),
      )}
    </>
  )
})

const Results = React.memo<{
  results: SearchResults
}>(({ results }) => {
  return (
    <>
      <ResultsCategory name="Artists" items={results.artists} />
      <ResultsCategory name="Albums" items={results.albums} />
      <ResultsCategory name="Songs" items={results.songs} />
    </>
  )
})

const Search = () => {
  const [text, setText] = useState('')
  const updateSearch = useUpdateSearchResults()
  const updating = useAtomValue(searchResultsUpdatingAtom)
  const results = useAtomValue(searchResultsAtom)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedonUpdateSearch = useMemo(() => debounce(updateSearch, 400), [])

  const onChangeText = useCallback(
    (value: string) => {
      setText(value)
      debouncedonUpdateSearch(value)
    },
    [setText, debouncedonUpdateSearch],
  )

  const resultsCount = results.albums.length + results.artists.length + results.songs.length

  return (
    <GradientScrollView style={styles.scroll} contentContainerStyle={styles.scrollContentContainer}>
      <View style={styles.content}>
        <View style={styles.inputBar}>
          <TextInput
            style={styles.textInput}
            placeholder="Search"
            placeholderTextColor="grey"
            selectionColor={colors.text.secondary}
            value={text}
            onChangeText={onChangeText}
          />
          <ActivityIndicator animating={updating} size="small" color={colors.text.secondary} style={styles.activity} />
        </View>
        {resultsCount > 0 ? <Results results={results} /> : <NothingHere style={styles.noResults} />}
      </View>
    </GradientScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingTop: StatusBar.currentHeight,
  },
  content: {
    paddingHorizontal: 20,
    alignItems: 'stretch',
  },
  inputBar: {
    justifyContent: 'center',
  },
  activity: {
    position: 'absolute',
    right: 16,
    bottom: 15,
  },
  textInput: {
    width: '100%',
    backgroundColor: '#515151',
    fontFamily: font.regular,
    fontSize: 18,
    color: colors.text.primary,
    marginTop: 20,
    paddingHorizontal: 12,
    paddingRight: 46,
  },
  noResults: {
    width: '100%',
  },
  itemText: {
    color: colors.text.primary,
    fontFamily: font.regular,
    fontSize: 14,
  },
})

export default Search