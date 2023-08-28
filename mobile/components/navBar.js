import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Header, Icon, Overlay } from "react-native-elements";
import { useNavigation } from "@react-navigation/native";

export default function NavBar () {
  const navigation = useNavigation();
  const [dropdownIsVisible, setDropdownIsVisible] = useState(false);

  const toggleDropdownVisible = () => {
    setDropdownIsVisible(!dropdownIsVisible);
  };

  const handleNavigateToUserTopContent = () => {
    navigation.navigate("UserTopContent");
    setDropdownIsVisible(false);
  }

  return (
    <>
      <Header
        leftComponent={
          <Icon
            name="menu"
            onPress={toggleDropdownVisible}
            color="white"/>
        }
        centerComponent={{ text: "Top Tracks", style: {color: "white", fontSize: 22.5} }}
      />
      <Overlay 
        isVisible={dropdownIsVisible} 
        onBackdropPress={toggleDropdownVisible}
        overlayStyle={{
          position: "absolute",
          top: 60,
          left: 0,
          width: 200,
        }}>
        <View>
          <TouchableOpacity onPress={handleNavigateToUserTopContent}>
            <Text>Your Top Spotify Content</Text>
            </TouchableOpacity>
        </View>
      </Overlay>
    </>
  )
}