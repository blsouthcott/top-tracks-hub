import React, { useState } from "react";
import { View, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Input, Button, Text } from 'react-native-elements';


export default function Login ({ setIsAuthenticated }) {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const login = async () => {
    const resp = await fetch("/api/login", {
      method: "POST",
      body: JSON.stringify({
        email: email,
        password: password
      }),
      headers: {
        "Content-Type": "application/json",
      },
    })
    if (resp.status !== 200) {
      Alert.alert(
        "Unable to login",
        null,
        [{text: "OK"},]
      );
    } else {
      const respData = await resp.json();
      const jwt = respData.access_token;
      const expiration = respData.expiration;
      await AsyncStorage.setItem("accessToken", jwt);
      await AsyncStorage.setItem("accessTokenExpiration", expiration);
      setIsAuthenticated(true);
      Alert.alert(
        `Welcome, ${respData.name}!`,
        null,
        [{text: "OK"},]
      );
    };
  }

  const goToSignupPage = () => {
    navigation.navigate("/signup");
  }

  return (
    <View style={styles.container}>
      <Text h3={true}>Login</Text>
      <Text>Email</Text>
      <Input
        placeholder="Enter username..."
        value={email}
        onChangeText={setEmail}/>
              
      <Text>Password</Text>
      <Input
        placeholder="Enter password..."
        value={password}
        onChangeText={setPassword}/>
      <Button
        style={styles.button}
        title="Login"
        onPress={login}/>
      
      <View style={styles.signupContainer}>  
        <Text>Or click here to sign up</Text> 
        <Button
          type="clear"
          title="Sign up"
          onPress={goToSignupPage}/>
        </View>
    </View>
  )
}


const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  button: {
    marginVertical: 10,
  },
  signupContainer: {
    alignItems: "center",
    marginTop: 20,
  },
})
