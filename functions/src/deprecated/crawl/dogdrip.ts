import axios from 'axios'
import * as cheerio from 'cheerio'
import * as admin from 'firebase-admin'
import * as common from './common';

var Crawler = require('crawler')

const target_page_size=5
const target_domain = 'https://www.dogdrip.net'
const target_list = [
    'http://www.dogdrip.net/index.php?mid=dogdrip&page=',
]

async function getDogdripUrls (target: string) {
    let historyList: Array<string> = await common.get_history_list()
    let itemList: Array<string> = []
    let response = await axios.get(target)
    let $ = await cheerio.load(response.data)
    let $table_data = $('#main > div > div.eq.section.secontent.background-color-content > div > div.ed.board-list > table > tbody')
    let elementList = await $table_data.find('.ed.link-reset')
    for(var idx=0; idx < elementList.length; idx++){
        let element_url = elementList.get(idx).attribs.href
        if(!historyList.includes(element_url) && element_url != '#popup_menu_area'){
            itemList.push(element_url)
        }
    }

    return itemList
}

export async function crawlDogdripUrls (){
    let urlList: Array<string> = []

    for(var target of target_list){
        for(var i=1; i<target_page_size; i++){
            let page_cods: Array<string> = await getDogdripUrls(target+i)
            urlList = urlList.concat(page_cods)
        }
    }
    return urlList
}

async function parse(res: any){
    const dvsRegex = /\/dvs\//g
    let $ = res.$
    let pageContent = await $('#article_1')
    let imgContents = pageContent.find('img')

    let articleUrl = res.request.uri.href
    let articleTitle = $('.ed.link.text-bold').text().trim()
    let articleDescription = pageContent.text().trim()
    let articleThumbnail = ''

    if(imgContents.length > 0){
        let thumbnailData = await imgContents.get(0)
        articleThumbnail = thumbnailData.attribs.src
        articleThumbnail = (dvsRegex.test(articleThumbnail)) ? 'https://www.dogdrip.net'+articleThumbnail : articleThumbnail
    }
    let ddArticle = new common.Article(
        articleUrl,
        'dogdrip',
        target_domain,
        articleTitle,
        articleDescription,
        articleThumbnail
    )

    // console.log(article)
    return ddArticle
}

export async function Articlize(urlList: Array<string>){
    var db = admin.firestore()
    var articleColletionRef = db.collection('article')
    var historyCollectionRef = db.collection('history')

    var articleCrawler = new Crawler({
        maxConnectios: common.connectionPool,
        callback: async function(err: any, res: any, done: any){
            if(err){
                console.log(err)
            }
            else{
                let article = await parse(res)
                let ddArticleRef = articleColletionRef.doc()
                let historyRef = historyCollectionRef.doc()
                await ddArticleRef.set(Object.assign({}, article))
                await historyRef.set({
                    url: article.url,
                    timestamp: new Date()
                })                  
            }
            done()
        }
    })
    articleCrawler.queue(urlList)
}