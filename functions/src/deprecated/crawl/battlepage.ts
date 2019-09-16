import axios from 'axios'
import * as cheerio from 'cheerio'
import * as admin from 'firebase-admin'
import * as common from './common';

var Crawler = require('crawler')

const target_page_size = 5
const target_domain = 'http://v12.battlepage.com'
const target_list = [
    'http://v12.battlepage.com/??=Board.Humor.Table&page=',
    'http://v12.battlepage.com/??=Board.Etc.Table&page='
]

async function url_formatter(url:string){
    return url.replace(/&page=[0-9]/gi, "")
}

async function getBattlepageUrls (target: string) {
    var historyList: Array<string> = await common.get_history_list()
    var itemList: Array<string> = []
    var response = await axios.get(target)
    var $ = cheerio.load(response.data)
    var $table_data = $('#div_content_containter > div:nth-child(2) > div.detail_container > div.ListTable')
    var elementList = $table_data.find('td.bp_subject')
    for(var idx=0; idx < elementList.length; idx++){
        var element_url = $(elementList.get(idx)).find('a').attr('href')
        element_url = await url_formatter(element_url)
        if(!historyList.includes(element_url)){
            itemList.push(element_url)
        }
    }
    return itemList
}

export async function crawlBattlepageUrls (){
    let urlList: Array<string> = []
    for(var target of target_list){
        for(var i=1; i<target_page_size; i++){
            let page_cods: Array<string> = await getBattlepageUrls(target+i)
            urlList = urlList.concat(page_cods)
        }
    }
    return urlList
}

async function parse(res: any){
    let $ = res.$
    let pageContent = await $('.search_content')
    let imgContents = pageContent.find('img')

    let articleUrl = res.request.uri.href
    let articleTitle = await $('span[class=search_title]', '.MiddleSubjectContainer').text().trim()
    let ariticleDescription = pageContent.text().trim()
    let articleThumbnail = ''
    if(imgContents.length > 0){
        let thumbnailData = await imgContents.get(0)
        articleThumbnail = await thumbnailData.attribs.src
    }

    let bpArticle = new common.Article(
        articleUrl, 
        'battlepage', 
        target_domain,
        articleTitle,
        ariticleDescription,
        articleThumbnail
    )

    return bpArticle
}

export async function Articlize(urlList: Array<string>){
    var db = admin.firestore()
    var articleCollectionRef = db.collection('article')
    var historyCollectionRef = db.collection('history')

    var articleCrawler = new Crawler({
        maxConnections: common.connectionPool,
        callback: async function(err: any, res: any, done: any){
            if(err){
                console.log(err)
            }
            else{
                let article = await parse(res)
                let bpArticleRef = articleCollectionRef.doc()
                let historyRef = historyCollectionRef.doc()
                await bpArticleRef.set(Object.assign({}, article))
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