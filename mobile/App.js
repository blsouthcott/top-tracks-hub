import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/native-stack";
import { ThemeProvider } from "react-native-elements";
import Home from "./components/home";

const Stack = createStackNavigator();

const theme = {
  colors: {
    primary: '#00d1b2',
    // ... other colors
  },
};

export default function App() {
  return (
    // <ThemeProvider theme={theme}>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="Home" component={Home} />
        </Stack.Navigator>
      </NavigationContainer>
    // </ThemeProvider>
  )
}
