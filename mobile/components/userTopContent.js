import React, { useState, useEffect } from "react";
import { View, ScrollView, StyleSheet, ActivityIndicator, Alert, Linking } from "react-native";
import { useTheme, Card, Text, Button } from "react-native-elements";
import { useSelector, useDispatch } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import Icon  from "react-native-vector-icons/FontAwesome";
import { setIsLoading } from "../store/actions";
import { loadUserTopContent } from "../utils/api";
import { baseUrl } from "../config";
import { styles } from "./styles";
import { openSpotify } from "../utils/openSpotify";

const ArtistCard = ({ artist, num }) => {
  return (
    <Card>
      <Card.Title h2={true}>{num+1}. {artist.name}</Card.Title>
      <Card.Divider />
        <Card.Image resizeMode="contain" source={{ uri: artist.images[0].url }} />
        <View style={styles.cardContainer}>
          <Text style={styles.child}>Popularity: <Text style={styles.boldText}>{artist.popularity}</Text></Text>
          <Text style={styles.child}>Genres: {artist.genres.join(", ")}</Text>
          <Button
            onPress={() => openSpotify("artist", artist.id)}
            style={styles.child}
            icon={<Icon name="spotify" size={30} color="white" />}
            iconRight
            title="Listen on Spotify  "/>
        </View>
    </Card>
  )
}

const TrackCard = ({ track, num }) => {
  <Card>
    <Card.Title h2={true}>{num+1}. {track.name}</Card.Title>
    <Card.Divider />
    <Card.Image src={track.album.images[0].url} />
    <Text>{track.artists[0].name}</Text>
    <Text>Album: {track.album.name}</Text>
    <Text>Popularity: {track.popularity}</Text>
    <Button
      onPress={() => openSpotify("track", track.id)}
      style={styles.child}
      icon={<Icon name="spotify" size={30} color="white" />}
      iconRight
      title="Listen on Spotify  "/>
  </Card>
}

export default function UserTopContent () {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const [personalizationType, setPersonalizationType] = useState("artists");
  const [timePeriod, setTimePeriod] = useState("short_term");
  const [artists, setArtists] = useState([]);
  const [tracks, setTracks] = useState([]);
  const isLoading = useSelector(state => state.isLoading);
  const redirectTo = useSelector(state => state.redirectTo);
  const isAuthenticated = useSelector(state => state.isAuthenticated);
  spotifyAccountIsAuthorized = useSelector(state => state.spotifyAccountIsAuthorized);

  const loadContent = async () => {
    dispatch(setIsLoading(true));
    if (!spotifyAccountIsAuthorized) {
      Alert.alert(
        "To view your Top Spotify Content please authorize your account 🙂",
        null,
        [{text: "OK"},],
      );
      navigation.navigate("Home");
      return;
    };
    const resp = await loadUserTopContent(timePeriod, personalizationType, baseUrl);
    if (resp.status === 401) {
      Alert.alert(
        "Your current login session has expired",
        null,
        [{text: "OK"},]
      );
      navigation.navigate("Home");
    } else if (resp.status !== 200) {
      Alert.alert(
        `Unable to load top ${personalizationType}`,
        null,
        [{text: "OK"},]
      );
    } else {
      const data = await resp.json();
      console.log("data: ", data);
      personalizationType === "artists" ? setArtists(data) : setTracks(data);
    };
    dispatch(setIsLoading(false));
  };

  useEffect(() => {
    loadContent();
  }, [personalizationType, timePeriod])

  return (
    <>
      {isLoading ? <ActivityIndicator size="large" />
      :
      <ScrollView
        style={StyleSheet.scrollView}>
        {personalizationType === "artists" ?
          artists.map((artist, cnt) => (
            <ArtistCard key={artist.id} artist={artist} num={cnt} />
          ))
        :
          tracks.map((track, cnt) => (
            <TrackCard key={track.id} track={track} num={cnt} />
          ))
        }
      </ScrollView>}
    </>
  )
}
