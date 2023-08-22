import AsyncStorage from '@react-native-async-storage/async-storage';

export const getAccessToken = async () => {
  // returns the access token from local storage only if it has not yet expired
  const accessToken = await AsyncStorage.getItem("accessToken");
  let expiration = await AsyncStorage.getItem("accessTokenExpiration");
  if (!accessToken || !expiration) {
    return undefined;
  };
  expiration = new Date(parseFloat(JSON.parse(expiration)));
  const currentTime = new Date();
  if (currentTime > expiration) {
    await AsyncStorage.clear();
    return undefined;
  };
  return accessToken;
}

// Alert.alert(
//   "Your current login session has expired.",
//   null,
//   [{text: "OK"},]
// );
