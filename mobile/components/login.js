import React, { useState, useEffect } from "react";
import { View, TextInput, TouchableOpacity, Alert } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import { Input, Button, Text } from 'react-native-elements';
import { styles } from "./styles";
import * as actions from "../store/actions";


export default function Login () {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const alertMsg = useSelector(state => state.alertMsg);

  const login = () => {
    if (!email || !password) {
      Alert.alert(
        alertMsg,
        null,
        [{text: "Please enter your email and password and try again"},]
      );
      return;
    }
    dispatch(actions.login(email, password));
  }

  useEffect(() => {
    if (alertMsg) {
      Alert.alert(
        alertMsg,
        null,
        [{text: "OK"},]
      )
    };
  }, [alertMsg])

  const navigateToSignupScreen = () => {
    navigation.navigate("Signup");
  }

  return (
    <View style={styles.container}>
      <Text h3={true} style={styles.title}>Login</Text>
      <Input
        textContentType="emailAddress"
        containerStyle={{ width: 250}}
        placeholder="Enter username..."
        value={email}
        onChangeText={setEmail}/>
      <Input
        textContentType="password"
        secureTextEntry={true}
        containerStyle={{ width: 250}}
        placeholder="Enter password..."
        value={password}
        onChangeText={setPassword}/>
      <Button
        containerStyle={styles.button}
        title="Login"
        onPress={login}/>
      
      <View style={styles.signupContainer}>  
        <Text>Or click here to sign up</Text> 
        <Button
          containerStyle={{...styles.button, width: 200}}
          title="Sign up"
          onPress={navigateToSignupScreen}/>
        </View>
    </View>
  )
}
