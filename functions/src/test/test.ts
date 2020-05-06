import * as admin from "firebase-admin";
import analyzeArticle from "../util/analyzer";

const remove = async () => {
  let removeList: Array<string> = [];
  let db = admin.firestore();

  await db
    .collection("article")
    .where("host", "==", "https://https")
    .get()
    .then((snapshot) => {
      snapshot.forEach((document) => {
        db.collection("article")
          .doc(document.id)
          .delete()
          .then(() => {
            db.collection("history")
              .where("url", "==", document.data().url)
              .get()
              .then((historySnapshot) => {
                historySnapshot.forEach((historyDocument) => {
                  db.collection("history").doc(historyDocument.id).delete();
                });
              });
          });
      });
    });

  return removeList;
};

const makeTestArticle = async () => {
  let db = admin.firestore();
  await db
    .collection("test_article")
    .doc()
    .set({
      crawlSource: "etc",
      state: "new",
      textContent: "TestCase",
      timestamp: new Date(),
      type: "etc",
      url: "https://applemint.netlify.com",
    })
    .catch((err) => {
      console.log(err);
    });
};

const testAnalyze = async (fbId: string) => {
  return await analyzeArticle(fbId);
};

export { makeTestArticle, testAnalyze, remove };
