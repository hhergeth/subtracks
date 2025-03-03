import Button from '@app/components/Button'
import GradientScrollView from '@app/components/GradientScrollView'
import { Server } from '@app/models/settings'
import { selectSettings } from '@app/state/settings'
import { useStore } from '@app/state/store'
import colors from '@app/styles/colors'
import font from '@app/styles/font'
import toast from '@app/util/toast'
import { useNavigation } from '@react-navigation/native'
import md5 from 'md5'
import React, { useCallback, useState } from 'react'
import { StyleSheet, Text, TextInput, View, ViewStyle } from 'react-native'
import { v4 as uuidv4 } from 'uuid'

const ServerView: React.FC<{
  id?: string
}> = ({ id }) => {
  const navigation = useNavigation()
  const activeServer = useStore(selectSettings.activeServer)
  const servers = useStore(selectSettings.servers)
  const addServer = useStore(selectSettings.addServer)
  const updateServer = useStore(selectSettings.updateServer)
  const removeServer = useStore(selectSettings.removeServer)
  const server = id ? servers.find(s => s.id === id) : undefined
  const pingServer = useStore(selectSettings.pingServer)

  const [address, setAddress] = useState(server?.address || '')
  const [username, setUsername] = useState(server?.username || '')
  const [password, setPassword] = useState(server?.token ? 'password' : '')
  const [testing, setTesting] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [saving, setSaving] = useState(false)

  const validate = useCallback(() => {
    return !!address && !!username && !!password
  }, [address, username, password])

  const canRemove = useCallback(() => {
    return id && servers.length > 1 && activeServer?.id !== id
  }, [id, servers, activeServer])

  const exit = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack()
    } else {
      navigation.navigate('main')
    }
  }, [navigation])

  const createServer = useCallback<() => Server>(() => {
    const salt = server?.salt || uuidv4()
    let token: string
    if (password === 'password' && server?.token) {
      token = server.token
    } else {
      token = md5(password + salt)
    }

    return {
      id: server?.id || uuidv4(),
      address,
      username,
      salt,
      token,
    }
  }, [address, password, server?.id, server?.salt, server?.token, username])

  const save = useCallback(() => {
    if (!validate()) {
      return
    }

    setSaving(true)
    const update = createServer()

    const waitForSave = async () => {
      try {
        if (id) {
          updateServer(update)
        } else {
          await addServer(update)
        }
        exit()
      } catch (err) {
        setSaving(false)
      }
    }
    waitForSave()
  }, [addServer, createServer, exit, id, updateServer, validate])

  const remove = useCallback(() => {
    if (!canRemove()) {
      return
    }

    setRemoving(true)
    const waitForRemove = async () => {
      try {
        await removeServer(id as string)
        exit()
      } catch (err) {
        setRemoving(false)
      }
    }
    waitForRemove()
  }, [canRemove, exit, id, removeServer])

  const test = useCallback(() => {
    setTesting(true)
    const potential = createServer()

    const ping = async () => {
      const res = await pingServer(potential)
      if (res) {
        toast(`Connection to ${potential.address} OK!`)
      } else {
        toast(`Connection to ${potential.address} failed, check settings or server`)
      }
      setTesting(false)
    }
    ping()
  }, [createServer, pingServer])

  const disableControls = useCallback(() => {
    return !validate() || testing || removing || saving
  }, [validate, testing, removing, saving])

  const formatAddress = useCallback(() => {
    let addressFormatted = address.trim()

    if (addressFormatted.endsWith('/')) {
      addressFormatted = addressFormatted.substr(0, addressFormatted.length - 1)
    }

    if (addressFormatted.length > 0 && !addressFormatted.includes(':/')) {
      addressFormatted = `http://${addressFormatted}`
    }

    setAddress(addressFormatted)
  }, [address])

  const deleteStyle: ViewStyle = {
    display: canRemove() ? 'flex' : 'none',
  }

  return (
    <GradientScrollView style={styles.scroll} contentContainerStyle={styles.scrollContentContainer}>
      <View style={styles.content}>
        <Text style={styles.inputTitle}>Address</Text>
        <TextInput
          style={styles.input}
          placeholderTextColor="grey"
          selectionColor={colors.text.secondary}
          textContentType="URL"
          placeholder="http://demo.navidrome.org"
          value={address}
          onChangeText={setAddress}
          onBlur={formatAddress}
        />
        <Text style={styles.inputTitle}>Username</Text>
        <TextInput
          style={styles.input}
          placeholderTextColor="grey"
          selectionColor={colors.text.secondary}
          textContentType="username"
          autoCompleteType="username"
          placeholder="demo"
          value={username}
          onChangeText={setUsername}
        />
        <Text style={styles.inputTitle}>Password</Text>
        <TextInput
          style={styles.input}
          placeholderTextColor="grey"
          selectionColor={colors.text.secondary}
          textContentType="password"
          autoCompleteType="password"
          secureTextEntry={true}
          placeholder="demo"
          value={password}
          onChangeText={setPassword}
        />
        <Button
          disabled={disableControls()}
          style={styles.button}
          title="Test Connection"
          buttonStyle="hollow"
          onPress={test}
        />
        <Button
          disabled={disableControls()}
          style={[styles.button, styles.delete, deleteStyle]}
          title="Delete"
          onPress={remove}
        />
        <Button disabled={disableControls()} style={styles.button} title="Save" onPress={save} />
      </View>
    </GradientScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContentContainer: {
    // paddingTop: StatusBar.currentHeight,
  },
  content: {
    paddingHorizontal: 20,
  },
  inputTitle: {
    fontFamily: font.semiBold,
    fontSize: 16,
    color: colors.text.primary,
    marginTop: 10,
  },
  input: {
    borderBottomWidth: 1.5,
    borderColor: colors.text.primary,
    fontFamily: font.regular,
    fontSize: 16,
    color: colors.text.primary,
    marginBottom: 26,
  },
  button: {
    marginTop: 16,
  },
  delete: {
    backgroundColor: 'red',
  },
})

export default ServerView
