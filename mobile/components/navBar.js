import React, { useState } from "react";
import { View, Text } from "react-native";
import { Header, Icon, Overlay } from "react-native-elements";

export default function NavBar () {
  const [dropdownIsVisible, setDropdownIsVisible] = useState(false);

  const toggleDropdownVisible = () => {
    setDropdownIsVisible(!dropdownIsVisible);
  };

  return (
    <>
      <Header
        leftComponent={
          <Icon
            name="menu"
            onPress={toggleDropdownVisible}/>
        }
        centerComponent={{ text: "Top Tracks", style: {color: "#fff"}}}
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
          <Text>Go to page 1</Text>
          <Text>Go to page 2</Text>
          <Text>Go to page 3</Text>
        </View>
      </Overlay>
    </>
  )
}