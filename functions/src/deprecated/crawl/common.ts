import * as admin from 'firebase-admin'

export const connectionPool = 1

export class Article {
    url: string;
    type: string;
    host: string;
    title: string;
    description: string;
    thumbnail: string;
    timestamp: Date;

    constructor(url: string, type:string, host:string, title:string, description:string, thumbnail:string){
        this.url = url
        this.type = type
        this.host = host
        this.title = title
        this.description = description
        this.thumbnail = thumbnail
        this.timestamp = new Date()
    }
}

export async function checkLinkType(domain:string) {
    // BATTLEPAGE
    if(domain.includes('battlepage')){
        return 'battlepage'
    }
    // DOGDRIP
    if(domain.includes('dogdrip')){
        return 'dogdrip'
    }
    // TWITCH
    if(domain.includes('twitch') || domain.includes('tgd.kr')){
        return 'twitch'
    }
    // IMGUR
    if(domain.includes('imgur')){
        return 'imgur'
    }
    // YOUTUBE
    if(domain.includes('youtube') || domain.includes('youtu.be')){
        return 'youtube'
    }
    // FMKOREA
    if(domain.includes('fmkorea')){
        return 'fmkorea'
    }
    return 'etc'
}

export async function get_history_list() {
    let db = admin.firestore()
    var history_list:Array<string> = []
    await db.collection('history').get()
    .then(snapshot => {
        snapshot.forEach(doc => {
            history_list.push(doc.data().url)
        })
    })

    return history_list
}

export async function updateCrawlObject(aritcleList: Array<Article>){
    let db = admin.firestore()
    let batch = db.batch()
    let batch_cnt = 0
    var batch_list = []
    for(var article of aritcleList){
        let crawlObjectRef = db.collection('article').doc()
        let historyRef = db.collection('history').doc()
        batch.set(crawlObjectRef, Object.assign({}, article))
        batch.set(historyRef, {
            url: article.url,
            timestamp: article.timestamp
        })
        batch_cnt += 2
        
        if(batch_cnt > 400){
            batch_list.push(batch)
            batch = db.batch()
            batch_cnt = 0
        }
    }
    batch_list.push(batch)

    for(var current_batch of batch_list){
        await current_batch.commit()
    }
}