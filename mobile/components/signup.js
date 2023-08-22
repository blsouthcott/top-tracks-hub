import React, { useState, useEffect } from "react";
import { View, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Input, Button, Text } from 'react-native-elements';
import { useDispatch, useSelector } from "react-redux";
import { styles } from "./styles";
import * as actions from "../store/actions";
import { baseUrl } from "../config";


export default function Signup () {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const isLoading = useSelector(state => state.isLoading);
  const alertMsg = useSelector(state => state.alertMsg);
  const redirectTo = useSelector(state => state.redirectTo);

  const signup = async () => {
    dispatch(actions.signup(email, password, name, baseUrl));
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

  useEffect(() => {
    if (redirectTo) {
      navigation.navigate(redirectTo);
    };
  }, [redirectTo])

  return (

    <View style={styles.container}>
      {isLoading ? <ActivityIndicator size="large" color="#0000ff" />
      :
      <>
        <Text h3={true}>Sign up</Text>
        <Input
          textContentType="emailAddress"
          placeholder="Enter email..."
          value={email}
          onChangeText={setEmail}/>
        <Input
          textContentType="password"
          secureTextEntry={true}
          placeholder="Enter password..."
          value={password}
          onChangeText={setPassword}/>
        <Input
          placeholder="Enter name..."
          value={name}
          onChangeText={setName}/>
        <Button
          containerStyle={styles.button}
          title="Sign up"
          onPress={signup}/>
      </>}
    </View>
  )
}