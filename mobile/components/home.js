import React, { useState, useEffect } from "react";
import { View, Modal, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { Button, Text } from "react-native-elements";
import { useSelector, useDispatch } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import WebView from "react-native-webview";
import Login from "./login";
import { styles } from "./styles";
import * as actions from "../store/actions";


export default function Home () {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const [authModalIsVisible, setAuthModalIsVisible] = useState(false);
  const isAuthenticated = useSelector(state => state.isAuthenticated);
  const spotifyAccountIsAuthorized = useSelector(state => state.spotifyAccountIsAuthorized);
  const alertMsg = useSelector(state => state.alertMsg);
  const redirectTo = useSelector(state => state.redirectTo);
  const redirectUrl = useSelector(state => state.authRedirectUrl);
  const isLoading = useSelector(state => state.isLoading);

  const handleAuthModalClose = () => {
    setAuthModalIsVisible(false);
    dispatch(actions.checkSpotifyAccountAuthorization());
  }

  const authorizeSpotifyAccount = () => {
    dispatch(actions.authorizeSpotifyAccount());
  }

  const unauthorizeSpotifyAccount = () => {
    dispatch(actions.unauthorizeSpotifyAccount());
  }

  const navigateToTracks = async () => {
    navigation.navigate("Tracks");
  }

  useEffect(() => {
    if (redirectUrl) {
      setAuthModalIsVisible(true);
    };
  }, [redirectUrl])

  useEffect(() => {
    if (alertMsg) {
      Alert.alert(
        alertMsg,
        null,
        [{text: "OK"},]
      )
    };
  }, [alertMsg])

  useEffect(() => {
    dispatch(actions.checkUserIsAuthenticated());
  }, [])

  useEffect(() => {
    if (redirectTo) {
      navigation.navigate(redirectTo);
    };
  }, [redirectTo])

  return (
    <View style={styles.container}>
      {isLoading ? <ActivityIndicator size="large" />
      :
      <>
        {!isAuthenticated ? <Login />
        :
        <>
        {!spotifyAccountIsAuthorized &&
        <>
          <Text>Click here to authorize your Spotify account.</Text>
          <Button
            containerStyle={styles.button}
            title="Authorize"
            onPress={authorizeSpotifyAccount}/>
        </>}

        <Text>Click here to view all tracks recommended by Pitchfork and add them to your Spotify playlist.&nbsp;</Text>
        <Button
          containerStyle={styles.button}
          title="View Tracks"
          onPress={navigateToTracks}/>

        {spotifyAccountIsAuthorized &&
        <>
          <Text>Click here to remove your Spotify account authorization.</Text>
          <Button
            containerStyle={styles.button}
            title="Unauthorize"
            onPress={unauthorizeSpotifyAccount}/>
        </>}

        <Modal
          animationType="slide"
          transparent={false}
          visible={authModalIsVisible}
          onRequestClose={handleAuthModalClose}>
            <WebView 
              source={{ uri: redirectUrl }}
              style={{ flex: 1 }}/>
            <TouchableOpacity onPress={handleAuthModalClose}>
              <Text>Close</Text>
            </TouchableOpacity>
          </Modal>
        </>}
      </>}
    </View>
  )
}
