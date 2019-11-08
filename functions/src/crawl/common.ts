import * as admin from 'firebase-admin'

export interface Item {
    url: string
    type: string
    textContent: string
    timestamp: Date
    state: string
    crawlSource: string
}

export async function checkLinkType(domain:string) {
    if(domain.includes('battlepage')){
        return 'battlepage'
    }
    if(domain.includes('dogdrip')){
        return 'dogdrip'
    }
    if(domain.includes('twitch') || domain.includes('tgd.kr')){
        return 'twitch'
    }
    if(domain.includes('imgur')){
        return 'imgur'
    }
    if(domain.includes('youtube') || domain.includes('youtu.be')){
        return 'youtube'
    }
    if(domain.includes('fmkorea')){
        return 'fmkorea'
    }
    return 'etc'
}

export async function get_history_list() {
    let db = admin.firestore()
    var history_list:Array<string> = []
    await db.collection('history').orderBy('timestamp', 'desc').limit(2000).get()
    .then(snapshot => {
        snapshot.forEach(doc => {
            history_list.push(doc.data().url)
        })
    })

    return history_list
}

export async function get_history_by_type(type: String){
    let db = admin.firestore()
    var history: Array<string> = []

    switch(type) {
        case 'bp':
            await db.collection('history')
            .where('source', '==', 'bp')
            .orderBy('timestamp', 'desc')
            .limit(3000)
            .get().then(snapshot => {
                snapshot.forEach(doc=> {
                    history.push(doc.data().url)
                })
            })
            break
        case 'dd':
            await db.collection('history')
            .where('source', '==', 'dd')
            .orderBy('timestamp', 'desc')
            .limit(3000)
            .get().then(snapshot => {
                snapshot.forEach(doc=> {
                    history.push(doc.data().url)
                })
            })
            break
        case 'isg':
            await db.collection('history')
            .where('source', '==', 'isg')
            .orderBy('timestamp', 'desc')
            .limit(3000)
            .get().then(snapshot => {
                snapshot.forEach(doc=> {
                    history.push(doc.data().url)
                })
            })
            break
        default:
            await db.collection('history')
            .orderBy('timestamp', 'desc')
            .limit(5000).get()
            .then(snapshot => {
                snapshot.forEach(doc => {
                    history.push(doc.data().url)
                })
            })
            break
    }
    return history
}

export async function updateItems(itemList: Array<Item>){
    let db = admin.firestore()
    let batch = db.batch()
    let batch_cnt = 0
    var batch_list = []
    for(var item of itemList){
        let itemRef = db.collection('article').doc()
        let historyRef = db.collection('history').doc()
        batch.set(itemRef, Object.assign({}, item))
        batch.set(historyRef, {
            url: item.url,
            source: item.crawlSource,
            timestamp: item.timestamp
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