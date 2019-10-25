import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin'
import * as bp from './crawl/battlepage'
import * as dd from './crawl/dogdrip'
import * as isg from './crawl/insagirl'
import { doArticlize, ArticleOptions } from './article/articlizer';

admin.initializeApp(functions.config().firebase)

// Start writing Firebase Functions
// https://firebase.google.com/docs/functions/typescript

export const helloWorld = functions.https.onRequest((request, response) => {
    response.send("Hello from Firebase!");
})

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

export const articlizeTest = functions.https.onRequest(async (request, response) => {
    let options = new ArticleOptions(Number(request.query.cnt), request.query.type)
    await doArticlize(options)
    response.send("Articlize Test Request Called");
})

exports.scheduledCrawlBp = functions.pubsub.schedule('every 3 hours').onRun(async (context)=>{
    return bp.crawlBattlepage()
})

exports.scheduledCrawldd = functions.pubsub.schedule('every 3 hours').onRun(async (context)=>{
    return dd.crawlDogdrip()
})

exports.scheduledCrawlIsg = functions.pubsub.schedule('every 3 hours').onRun(async (context)=>{
    return isg.crawlInsagirl()
})

exports.scheduleArticlize = functions.runWith({memory: '1GB'}).pubsub.schedule('every 5 minutes').onRun(async (context)=>{
    return await doArticlize(new ArticleOptions(20, 'all'))
})

// 메모리 늘리기
// 에러 처리
// 케이스 확대
// 처리량 설정

// exports.scheduledCrawlBp = functions.pubsub.schedule('every 2 hours').onRun(async (context)=>{
//     let urlList = await bp.crawlBattlepageUrls()
//     bp.Articlize(urlList)
// })
