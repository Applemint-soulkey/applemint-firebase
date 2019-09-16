import axios from 'axios'
import * as admin from 'firebase-admin'
import * as common from './common';
import * as parser from './parser'
import {URL} from 'url'

let target_list = [
    "http://insagirl-hrm.appspot.com/json2/1/1/2/",
    "http://insagirl-hrm.appspot.com/json2/2/1/2/"
]

var urlRegex = /(https?:[^\s]+)/g
var ignoreRegex = /(lolcast\.kr)|(poooo\.ml)|(dostream\.com)/g
var directLinkRegex = /(\.mp4)|(\.jpg)|(\.png)|(\.gif)/g
var target_domain = 'http://insagirl-toto.appspot.com/'

async function getLinkDomain(url:string) {
    try {
        console.log(url)
        var temp_url = await new URL(url)
        return temp_url.origin
    }
    catch (e) {
        console.log(e)
        return target_domain
    }
}

async function articlize(article: common.Article){
    switch(article.type){
        case 'imgur':
            console.log('imgur')
            article = await parser.imgurParser(article)
            break;
        case 'youtube':
            console.log('youtube')
            article = await parser.youtubeParser(article)
            break;
        case 'twitch':
            console.log('twitch')
            article = await parser.twitchParser(article)
            break;
        case 'fmkorea':
            console.log('fmkorea')
            article = await parser.fmParser(article)
            break;
        default:
            console.log('default')
            article = await parser.defaultParser(article)
            break;
    }
    return article
}

async function getInsagirlItems (json: string) {
    let historyList: Array<string> = await common.get_history_list()
    
    var db = admin.firestore()
    var articleCollectionRef = db.collection('article')
    var historyCollectionRef = db.collection('history') 

    for (var line of json){
        let detail: string = line.split('|')[2]
        let detail_url_list = detail.match(urlRegex)
        if (detail_url_list !== null) {
            let insaItemUrl = detail_url_list[0]
            if(historyList.includes(insaItemUrl) || insaItemUrl.search(ignoreRegex)!==-1){
                continue
            }
            let insaItemContent = detail.replace(insaItemUrl, '').trim()
            if(insaItemContent.length === 0){
                insaItemContent = ''
            }
            let insaItemHost = await getLinkDomain(insaItemUrl)
            let insaItemType = await (directLinkRegex.test(insaItemUrl))? 'direct' : await common.checkLinkType(insaItemHost)
            let article = new common.Article(insaItemUrl, insaItemType, insaItemHost, insaItemContent, '', '')
            article = await articlize(article)
            let ArticleRef = articleCollectionRef.doc()
            let historyRef = historyCollectionRef.doc()
            await ArticleRef.set(Object.assign({}, article))
            await historyRef.set({
                url: article.url,
                timestamp: new Date()
            })
            console.log(article)
        }
    }
}

export async function crawlInsagirlArticles (){

    for(var target of target_list){
        var response = await axios(target)
        var hrm_data = await response.data
        await getInsagirlItems(hrm_data.v)
        // codList = codList.concat(hrm_articles)
    }
}