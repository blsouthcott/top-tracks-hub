import React, { useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Provider } from "react-redux";
import store from "./store/store";
import { ThemeProvider } from "react-native-elements";
import Home from "./components/home";
import Signup from "./components/signup";
import NavBar from "./components/navBar";

const Stack = createNativeStackNavigator();

const theme = {
  colors: {
    primary: '#00d1b2',
    // ... other colors
  },
};

export default function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <NavigationContainer>
          <Stack.Navigator
            screenOptions={{
              header: () => <NavBar />
            }}>
            <Stack.Screen name="Home" component={Home} />
            <Stack.Screen name="Signup" component={Signup} />
            {/* <Stack.Screen name="Tracks" component={Tracks} />
            <Stack.Screen name="AddSpotifyTrackId" component={AddSpotifyTrackId} />
            <Stack.Screen name="UserTopContent" component={UserTopContent} />
            <Stack.Screen name="About" component={About} />
            <Stack.Screen name="Contact" component={Contact} />
            <Stack.Screen name="ReportAnIssue" component={ReportAnIssue} /> */}
          </Stack.Navigator>
        </NavigationContainer>
      </ThemeProvider>
    </Provider>
  )
}
