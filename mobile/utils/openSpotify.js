import { Linking, Alert } from "react-native";

export const openSpotify = async (type, id) => {
  const url = `https://open.spotify.com/${type}/${id}`
  const isSupported = await Linking.canOpenURL(url);
  if (isSupported) {
    await Linking.openURL(url);
  } else {
    Alert.alert(
      "Unable to open Spotify",
      null,
      [{text: "OK"},]
    )
  };
}
