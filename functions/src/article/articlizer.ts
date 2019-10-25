// import Axios from 'axios'
// import * as cheerio from 'cheerio'
import * as admin from 'firebase-admin'
import { DocumentData } from "@google-cloud/firestore";
import * as parser from './parser';

export class Article {
    url: string
    type: string
    title: string
    description: string
    thumbnail: string
    timestamp: Date
    state: string
    constructor(document: DocumentData){
        this.url = document.url
        this.type = document.type
        this.title = ""
        this.description = document.textContent
        this.thumbnail = ""
        this.timestamp = new Date()
        this.state = "unread"
    }
}

export class ArticleOptions {
    targetCount: number
    targetType: string
    constructor(count: number, type: string){
        this.targetCount = count
        this.targetType = type
    }
}

async function articlize(article: Article){
    switch(article.type){
        case 'direct':
            article.title = article.description
            return article
        case 'battlepage':
            return parser.bpParser(article)
        case 'dogdrip':
            return parser.ddParser(article)
        case 'fmkorea':
            return parser.fmParser(article)
        case 'imgur':
            return parser.imgurParser(article)
        case 'youtube':
            return parser.youtubeParser(article)
        case 'twtich':
            return parser.twitchParser(article)
        case 'etc':
            return parser.defaultParser(article)
        default:
            article.title = article.description
            return article
    }
}

export async function doArticlize(options: ArticleOptions) {
    var db = admin.firestore()
    let requestList: any = []
    
    let itemRef = (options.targetType != 'all') ? 
    db.collection('item').where('type', '==', options.targetType).limit(options.targetCount)
     : db.collection('item').limit(options.targetCount)

    await itemRef.get().then(snapshot=> {
        snapshot.forEach(async doc=>{
            var requestPromise = new Promise(async function(resolve, reject){
                let defaultArticle = new Article(doc.data())
                let article = await articlize(defaultArticle)
                if (article != null){
                    await db.collection('article').doc().set(Object.assign({}, article))
                    await db.collection('item').doc(doc.id).delete()
                }
                else {
                    // await db.collection('error').doc().set(Object.assign({}, article))
                    // await db.collection('item').doc(doc.id).delete()
                }
                resolve()
            })
            requestList.push(requestPromise)
        })
    })
    return await Promise.all(requestList)
}
