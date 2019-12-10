import * as admin from "firebase-admin";
import parserFactory from "./parser";

const analyzeArticle = async (fbId: string) => {
  let db = admin.firestore();
  let result = null;
  await db
    .collection("article")
    .doc(fbId)
    .get()
    .then(async document => {
      if (!document.exists) {
        console.log("No such document!");
      } else {
        let targetDocument = document.data();
        result = await parserFactory(targetDocument, document.id);
      }
    })
    .catch(error => {
      console.log(error);
    });
  return result;
};

export default analyzeArticle;
