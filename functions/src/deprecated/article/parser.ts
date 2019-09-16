import axios from 'axios'

//set youtube lib
var getYoutubeID = require('get-youtube-id');

export class Article {
    url: string;
    host: string;
    type: string;
    timestamp: Date;
    title: string;
    description: string;
    thumbnail: string;
    readState: string;
    constructor(cod: any){
        this.url = cod.url
        this.host = cod.host
        this.type = cod.type
        this.timestamp = new Date()
        this.title = ''
        this.description = ''
        this.thumbnail = ''
        this.readState = 'unread'
     }
}

const youtubeKey = 'AIzaSyA04eUTmTP3skSMcRXWeXlBNI0luJ2146c'
const youtubeApi = 'https://www.googleapis.com/youtube/v3/videos'
const imgurAlbumApi = 'https://api.imgur.com/3/album/'
const imgurImageApi = 'https://api.imgur.com/3/image/'
const twitchApi = 'https://api.twitch.tv/helix/clips'
const imgurAuth = {
    'Authorization': 'Client-ID d971a173f73ab43'
}
const twitchAuth = {
    'Client-ID': 'c212bkofyazvm7o5auumpc4o3uyt47'
}

export async function bpParser(url:string, res: any){
    
    // let $ = res.$
    // let pageContent = await $('.search_content')
    // let imgContents = pageContent.find('img')
    // if(imgContents.length > 0){
    //     let thumbnail = await imgContents.get(0)
    //     article.thumbnail = await thumbnail.attribs.src
    // }
    
    // article.description = pageContent.text().trim()
    // article.title = await cod.content
    // // console.log(article)
    // return article
}

export async function ddParser(cod:any, res:any){
    const dvsRegex = /\/dvs\//g
    let article = new Article(cod)
    let $ = res.$
    let pageContent = await $('#article_1')
    let imgContents = pageContent.find('img')
    if(imgContents.length > 0){
        let thumbnail = await imgContents.get(0)
        thumbnail = thumbnail.attribs.src
        article.thumbnail = await (dvsRegex.test(thumbnail)) ? 'https://www.dogdrip.net'+thumbnail : thumbnail
    }
    article.description = pageContent.text().trim()
    article.title = await cod.content
    // console.log(article)
    return article
}

export async function fmParser(cod:any, res:any){
    let exceptionText = /Video 태그를 지원하지 않는 브라우저입니다./gi

    let article = new Article(cod)
    let $ = res.$
    let pageContent = await $('article')
    let imgContents = pageContent.find('img')
    if(imgContents.length > 0){
        let thumbnail = await imgContents.get(0)
        article.thumbnail = await thumbnail.attribs.src
    }
    article.description = pageContent.text().trim().replace(exceptionText, '')
    article.title = await $('title').text().trim()
    // console.log(article)
    return article
}

export async function imgurParser(cod:any, res: any){
    let article = new Article(cod)

    const albumRegex = /\/a\//g
    let imgurHash = cod.url.split('/').pop(-1)
    if(albumRegex.test(cod.url)){
        let imgurResponse = await axios.get(imgurAlbumApi+imgurHash+'/images', { headers: imgurAuth })
        let imgDataList = await imgurResponse.data.data
        article.thumbnail = imgDataList[0].link
    }
    else{
        let imgurResponse = await axios.get(imgurImageApi+imgurHash, { headers: imgurAuth })
        let imgData = await imgurResponse.data.data
        article.thumbnail = imgData.link
    }
    article.title = await cod.content
    // console.log(article)
    return article
}

export async function youtubeParser(cod: any, res: any){
    let article = new Article(cod)
    let youtubeId = await getYoutubeID(cod.url)
    if(youtubeId !== null){
        let query = '?key='+ youtubeKey + '&part=snippet&id=' + youtubeId
        let videoData = await axios.get(youtubeApi+query)
        let item = await videoData.data.items[0].snippet
        article.title = item.title
        article.description = item.description
        article.thumbnail = item.thumbnails.default.url // medium / high / statndard / maxres    
    }
    else{
        article.title = cod.content
    }
    // console.log(article)
    return article
}

export async function twitchParser(cod: any, res: any){
    let article = new Article(cod)
    let tgdRegex = /tgd\.kr/g
    let clipIdRegex = /([A-Z])\w+/g
    let clipUrl = cod.url
    if(tgdRegex.test(cod.url)){
        let $ = res.$
        clipUrl = await $('#clip-iframe').attr('src')
    }
    let clipId = clipUrl.match(clipIdRegex)[0]
    let response = await axios.get(twitchApi+"?id="+clipId, { headers: twitchAuth })
    let clipData = response.data.data[0]
    article.title = clipData.title
    article.description = cod.content
    article.thumbnail = clipData.thumbnail_url
    // console.log(article)
    return article
}

export async function defaultParser(cod: any, res: any){
    let article = new Article(cod)
    let $ = res.$
    let title = await $('title').text().trim()
    article.title = title
    article.description = cod.content
    // console.log(article)
    return article
}