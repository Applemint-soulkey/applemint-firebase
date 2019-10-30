import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin'
import * as bp from './crawl/battlepage'
import * as dd from './crawl/dogdrip'
import * as isg from './crawl/insagirl'

admin.initializeApp(functions.config().firebase)

// Start writing Firebase Functions
// https://firebase.google.com/docs/functions/typescript

export const crawlBattlepage = functions.https.onRequest(async (request, response) => {
    bp.crawlBattlepage()
    response.send("Crawl Battlepage Request Called");
})

export const crawlDogdrip = functions.https.onRequest(async (request, response) => {
    dd.crawlDogdrip()
    response.send("Crawl Dogdrip Request Called");
})

export const crawlInsagirl = functions.https.onRequest(async (request, response) => {
    isg.crawlInsagirl()
    response.send("Crawl Insagirl Request Called");
})

exports.scheduledCrawlBp = functions.pubsub.schedule('every 3 hours').onRun(async (context)=>{
    return await bp.crawlBattlepage()
})

exports.scheduledCrawldd = functions.pubsub.schedule('every 3 hours').onRun(async (context)=>{
    return await dd.crawlDogdrip()
})

exports.scheduledCrawlIsg = functions.pubsub.schedule('every 3 hours').onRun(async (context)=>{
    return await isg.crawlInsagirl()
})

// exports.scheduleArticlize = functions.runWith({memory: '2GB'}).pubsub.schedule('every 5 minutes').onRun(async (context)=>{
//     return await doArticlize(new ArticleOptions(20, 'all'))
// })

// 에러 처리