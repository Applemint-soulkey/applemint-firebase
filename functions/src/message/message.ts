import * as admin from "firebase-admin";

const getUserTokens = async () => {
  let tokens: Array<string> = [];
  let db = admin.firestore();
  await db
    .collection("user")
    .get()
    .then(snapshot => {
      snapshot.forEach(document => {
        tokens.push(document.data().message_token);
      });
    });
  return tokens;
};

export const sendMessage = async (title: string, body: string) => {
  let tokens = await getUserTokens();
  let msg = {
    notification: { title: title, body: body },
    tokens: tokens
  };
  await admin
    .messaging()
    .sendMulticast(msg)
    .then(response => {
      console.log(response.successCount + " messages were sent successfully");
    });
};
