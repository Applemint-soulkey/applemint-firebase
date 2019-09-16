import * as admin from 'firebase-admin'
import * as parser from './parser'
import * as common from '../crawl_deprecated/common'
var Crawler = require('crawler')

async function getCods() {
    let db = admin.firestore()
    let codMap:any = {}
    await db.collection('crawlObject').get()
    .then(snapshot => {
        snapshot.forEach(async doc => {
            codMap[doc.id] = await doc.data()
        })
    })
    return codMap
}

async function articlizerMapper(cod: any, res:any){
    if (cod === undefined){
        return undefined
    }
    else{
        switch(cod.type){
            case 'direct':
                let directArticle = new parser.Article(cod)
                directArticle.title = cod.content
                return directArticle
            case 'battlepage':
                return await parser.bpParser(cod, res)
            case 'dogdrip':
                return await parser.ddParser(cod, res)
            case 'fmkorea':
                return await parser.fmParser(cod, res)
            case 'imgur':
                return await parser.imgurParser(cod, res)
            case 'youtube':
                return await parser.youtubeParser(cod, res)
            case 'twitch':
                return await parser.twitchParser(cod, res)
            case 'etc':
                return await parser.defaultParser(cod, res)
            default:
                let undefinedArticle = new parser.Article(cod)
                undefinedArticle.type = 'undefined'
                return undefinedArticle
        }
    }
}

async function extractUrlList(codMap: any){
    let urlList: Array<string> = []
    let valueList:Array<common.crawlObject> = await Object.values(codMap)
    for(var cod of valueList){
        await urlList.push(cod.url)
    }
    return urlList
}

async function findIDByUrl(codMap:any, request:any){
    let keyList:Array<string> = await Object.keys(codMap)
    for(var key of keyList){
        if(codMap[key].url === request.uri.href || codMap[key].url === request.headers.referer){
            return key
        }
    }
    return undefined
}

export async function aritclize() {
    let codMap = await getCods()
    let urlList = await extractUrlList(codMap)
    console.log(urlList)
    let uniqueList = [...new Set(urlList)]

    let db = admin.firestore()
    let codCollectionRef = db.collection('crawlObject')
    let articleCollectionRef = db.collection('article')
    let errorCollectionRef = db.collection('error')

    var articleCrawler = new Crawler({
        maxConnections: 5,
        callback: async function(err: any, res: any, done: any){
            if(err){
                // TODO Need to exception
                console.log(err)
            }
            else{
                let codId = await findIDByUrl(codMap, res.request)
                if(codId !== undefined){
                    let article = await articlizerMapper(codMap[codId], res)
                    if(article !== undefined){
                        console.log(article)
                        let articleRef = await articleCollectionRef.doc()
                        await articleRef.set(Object.assign({}, article))
                        await codCollectionRef.doc(codId).delete()
                    }   
                }else{
                    console.log('=================================================')
                    let errorRef = await errorCollectionRef.doc()
                    let data = {
                        url: res.request.uri.href,
                        referer: res.request.headers.referer,
                        timestamp: new Date()
                    }
                    console.log(data)
                    errorRef.set(data)
                    console.log('=================================================')
                }
            }
            done()
        }
    })
    articleCrawler.queue(uniqueList)
}