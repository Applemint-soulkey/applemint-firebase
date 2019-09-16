import axios from 'axios'
import * as cheerio from 'cheerio'
import * as common from './common'

var getYoutubeID = require('get-youtube-id');
var iconv = require('iconv-lite')

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
// const defaultHeader = {
//     'Content-type': 'text/html;charset=utf-8'
// }

export async function fmParser  (article: common.Article) {
    let exceptionText = /Video 태그를 지원하지 않는 브라우저입니다./gi

    try {
        let response = await axios.get(article.url)
        let $ = await cheerio.load(await response.data)
        let pageContent = $('article')
        let imgContents = pageContent.find('img')
        if(imgContents.length > 0){
            let thumbnail = await imgContents.get(0)
            article.thumbnail = await thumbnail.attribs.src
        }
        article.description = pageContent.text().trim().replace(exceptionText, '')
        article.title = $('title').text().trim()
    } 
    catch (err) {
        article = await defaultParser(article)
        console.log(err)
    }

    return article
}

export async function imgurParser (article: common.Article){
    try{
        const albumRegex = /\/a\//g
        let imgurHash = await article.url.split('/').pop()
        if(albumRegex.test(article.url)){
            let imgurResponse = await axios.get(imgurAlbumApi+imgurHash+'/images', { headers: imgurAuth })
            let imgDataList = await imgurResponse.data.data
            article.thumbnail = imgDataList[0].link
        }
        else{
            let imgurResponse = await axios.get(imgurImageApi+imgurHash, { headers: imgurAuth })
            let imgData = await imgurResponse.data.data
            article.thumbnail = imgData.link
        }
    }
    catch(err){
        article = await defaultParser(article)
        console.log(err)
    }
    return article
}

export async function youtubeParser(article: common.Article){
    try{
        let youtubeId = await getYoutubeID(article.url)
        if(youtubeId !== null){
            let query = '?key='+ youtubeKey + '&part=snippet&id=' + youtubeId
            let videoData = await axios.get(youtubeApi+query)
            let item = await videoData.data.items[0].snippet
            article.title = item.title
            article.description = item.description
            article.thumbnail = item.thumbnails.default.url // medium / high / statndard / maxres    
        }
    }
    catch(err){
        article = await defaultParser(article)
        console.log(err)
    }

    return article
}

export async function twitchParser(article: common.Article){
    try{
        let tgdRegex = /tgd\.kr/g
        let clipIdRegex = /([A-Z])\w+/g
        let clipUrl = article.url
        if(tgdRegex.test(article.url)){
            let $ = cheerio.load(await axios.get(article.url))
            clipUrl = $('#clip-iframe').attr('src')
        }
        let clipId = clipUrl.match(clipIdRegex)
    
        if(clipId !== null){        
            let response = await axios.get(twitchApi+"?id="+clipId, { headers: twitchAuth })
            let clipData = response.data.data[0]
            article.description = article.title
            article.title = clipData.title
            article.thumbnail = clipData.thumbnail_url
        }
        // console.log(article)
    }
    catch(err){
        article = await defaultParser(article)
        console.log(err)
    }

    return article
}

export async function defaultParser(article: common.Article){
    try{
        let response = await axios.get(article.url, {
            responseType: 'arraybuffer'
        })
        let contentType = response.headers['content-type']
        let charset = (contentType.includes('charset=')) ? contentType.split('charset=')[1] : 'UTF-8'
        let responseData = await response.data
        let data = iconv.decode(responseData, charset)
        let $ = await cheerio.load(data)
        let title = await $('title').text().trim()
        article.description = await article.title
        article.title = await title
        article.type = 'default'
    }
    catch(err){ 
        console.log(err)
    }
    return article
}