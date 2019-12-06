import * as admin from "firebase-admin";

const remove = async () => {
  let removeList: Array<string> = [];
  let db = admin.firestore();

  await db
    .collection("article")
    .where("host", "==", "https://https")
    .get()
    .then(snapshot => {
      snapshot.forEach(document => {
        db.collection("article")
          .doc(document.id)
          .delete()
          .then(() => {
            db.collection("history")
              .where("url", "==", document.data().url)
              .get()
              .then(historySnapshot => {
                historySnapshot.forEach(historyDocument => {
                  db.collection("history")
                    .doc(historyDocument.id)
                    .delete();
                });
              });
          });
      });
    });

  return removeList;
};

export default remove;
