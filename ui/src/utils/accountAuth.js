
export const accountIsAuthorized = async (accessToken) => {
  const resp = await fetch("/api/account-is-authorized", {
    headers: {
      "Authorization": `Bearer ${accessToken}`,
    }
  })
  const respData = await resp.json();
  if (!respData.authorized) {
    return false;
  } else {
    return true;
  };
}
