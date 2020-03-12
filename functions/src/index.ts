import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as common from "./crawl/common";
import * as bp from "./crawl/battlepage";
import * as dd from "./crawl/dogdrip";
import * as isg from "./crawl/insagirl";
import * as test from "./test/test";
import * as raindrop from "./util/raindrop";
import analyzeArticle from "./util/analyzer";
import { sendMessage } from "./message/message";

admin.initializeApp(functions.config().firebase);

// Start writing Firebase Functions
// https://firebase.google.com/docs/functions/typescript

export const analyze = functions
  .runWith({ timeoutSeconds: 300 })
  .https.onCall(async (data, context) => {
    try {
      let analyzeRes = await analyzeArticle(data.id);
      return analyzeRes;
    } catch (error) {
      return error;
    }
  });

exports.getRaindropCollections = functions.https.onCall(
  async (data, context) => {
    try {
      return await raindrop.getCollections();
    } catch (error) {
      return error;
    }
  }
);

exports.createRaindrop = functions.https.onCall(async (data, context) => {
  try {
    return await raindrop.createRaindrop(
      data.title,
      data.url,
      data.collection,
      data.tags
    );
  } catch (error) {
    return error;
  }
});

// Scheduled Functions

exports.scheduledCrawlBp = functions.pubsub
  .schedule("every 3 hours")
  .onRun(async context => {
    let crawledSize = await bp.crawlBattlepage();
    let articleCnt = await common.getArticleCount();

    sendMessage(
      crawledSize + " Articles updated from Battlepage",
      articleCnt + " articles remained. Don't forget Check!"
    );
    return { msg: crawledSize + " articls updated from bp" };
  });

exports.scheduledCrawldd = functions.pubsub
  .schedule("every 3 hours")
  .onRun(async context => {
    let crawledSize = await dd.crawlDogdrip();
    let articleCnt = await common.getArticleCount();

    sendMessage(
      crawledSize + " Articles updated from Dogdrip",
      articleCnt + " articles remained. Don't forget Check!"
    );
    return { msg: crawledSize + " articls updated from dd" };
  });

exports.scheduledCrawlIsg = functions.pubsub
  .schedule("every 3 hours")
  .onRun(async context => {
    let crawledSize = await isg.crawlInsagirl();
    let articleCnt = await common.getArticleCount();

    sendMessage(
      crawledSize + " Articles updated from Insagirl",
      articleCnt + " articles remained. Don't forget Check!"
    );
    return { msg: crawledSize + " articls updated from isg" };
  });

// TEST API

export const crawlBattlepage = functions.https.onRequest(
  async (_, response) => {
    let crawledSize = await bp.crawlBattlepage();
    let articleCnt = await common.getArticleCount();

    sendMessage(
      crawledSize + " Articles updated from Battlepage",
      articleCnt + " articles remained. Don't forget Check!"
    );
    response.send("Crawl Battlepage Request Called: " + crawledSize);
  }
);

export const crawlDogdrip = functions.https.onRequest(async (_, response) => {
  let crawledSize = await dd.crawlDogdrip();
  let articleCnt = await common.getArticleCount();

  sendMessage(
    crawledSize + " Articles updated from Dogdrip",
    articleCnt + " articles remained. Don't forget Check!"
  );
  response.send("Crawl Dogdrip Request Called: " + crawledSize);
});

export const crawlInsagirl = functions.https.onRequest(async (_, response) => {
  let crawledSize = await isg.crawlInsagirl();
  let articleCnt = await common.getArticleCount();

  sendMessage(
    crawledSize + " Articles updated from Insagirl",
    articleCnt + " articles remained. Don't forget Check!"
  );
  response.send("Crawl Insagirl Request Called: " + crawledSize);
});

export const makeTestArticle = functions.https.onRequest(
  async (_, response) => {
    await test.makeTestArticle();
    response.send("testCase Created.");
  }
);

export const remover = functions.https.onRequest(async (request, response) => {
  let list = await test.remove();
  response.send(list);
});

export const testAnalyze = functions.https.onRequest(
  async (request, response) => {
    let data = await test.testAnalyze(request.query.id);
    response.send(data);
  }
);

// exports.scheduleArticlize = functions.runWith({memory: '2GB'}).pubsub.schedule('every 5 minutes').onRun(async (context)=>{
//     return await doArticlize(new ArticleOptions(20, 'all'))
// })

// 에러 처리
