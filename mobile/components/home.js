import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import Login from "./login";


export default function Home ({ isAuthenticated, setIsAuthenticated }) {
  const navigation = useNavigation();
  const [spotifyAccountIsAuthorized, setSpotifyAccountIsAuthorized] = useState(false);

  return (
    <View>
      {!isAuthenticated && <Login isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated}/>}
    </View>
  )
}
