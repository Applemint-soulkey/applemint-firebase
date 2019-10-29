import axios from 'axios'
import * as cheerio from 'cheerio'
import { Article } from './articlizer'

//set youtube lib
var getYoutubeID = require('get-youtube-id');

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

export async function bpParser(article: Article){
    try {
        let response = await axios.get(article.url)
        let $ = cheerio.load(response.data)
        let pageContent = await $('.search_content')
        let imgContents = pageContent.find('img')
        if(imgContents.length > 0){
            let thumbnail = await imgContents.get(0)
            article.thumbnail = await thumbnail.attribs.src
        }
        article.title = article.description
        article.description = pageContent.text().trim()

        //article validate
        if(article.description == "") article.description = article.url
    } catch (error) {
        console.error('error on '+article.url)
        return null   
    }
    // console.log(article)
    return article
}

export async function ddParser(article: Article){
    try {
        const dvsRegex = /\/dvs\//g
        let response = await axios.get(article.url)
        let $ = cheerio.load(response.data)
        let pageContent = await $('#article_1')
        let imgContents = pageContent.find('img')
        if(imgContents.length > 0){
            let thumbnail = await imgContents.get(0)
            thumbnail = thumbnail.attribs.src
            article.thumbnail = await (dvsRegex.test(thumbnail)) ? 'https://www.dogdrip.net'+thumbnail : thumbnail
        }
        article.title = article.description
        article.description = pageContent.text().trim()

        //article validate
        if(article.description == "") article.description = article.url
    } catch (error) {
        console.error('error on '+article.url)
        console.error(error)
        return null   
    }
    // console.log(article)
    return article
}

export async function fmParser(article:Article){
    try {
        let exceptionText = /Video 태그를 지원하지 않는 브라우저입니다./gi
        let response = await axios.get(article.url)
        let $ = cheerio.load(response.data)
        let pageContent = await $('article')
        let imgContents = pageContent.find('img')
        if(imgContents.length > 0){
            let thumbnail = await imgContents.get(0)
            article.thumbnail = await thumbnail.attribs.src
        }
        article.description = pageContent.text().trim().replace(exceptionText, '')
        article.title = await $('title').text().trim()
        if(article.title == "") article.title = article.description
        if(article.title == "") article.title = article.url
    } catch (error) {
        console.error('error on '+article.url)
        console.error(error)
        return article
    }
    // console.log(article)
    return article
}


export async function imgurParser(article:Article){
    try {
        const albumRegex = /\/a\//g
        let imgurHash = article.url.split('/').pop()
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
        article.title = await article.description
        if(article.title == "") article.title = article.description
        if(article.title == "") article.title = article.url
    } catch (error) {
        console.error('error on '+article.url)
        console.error(error)
        return null
    }

    // console.log(article)
    return article
}

export async function youtubeParser(article: Article){
    try {
        let youtubeId = await getYoutubeID(article.url)
        if(youtubeId !== null){
            let query = '?key='+ youtubeKey + '&part=snippet&id=' + youtubeId
            let videoData = await axios.get(youtubeApi+query)
            let item = await videoData.data.items[0].snippet
            article.title = item.title
            article.description = item.description
            article.thumbnail = item.thumbnails.default.url // medium / high / statndard / maxres    
        }
        else{
            article.title = article.description
        }
        if(article.title == "") article.title = article.description
        if(article.title == "") article.title = article.url
    } catch (error) {
        console.error('error on '+article.url)
        console.error(error)
        return null
    }
    // console.log(article)
    return article
}

export async function twitchParser(article: Article){
    try {
        let tgdRegex = /tgd\.kr/g
        let clipIdRegex = /([A-Z])\w+/g
        let clipUrl = article.url
        if(tgdRegex.test(article.url)){
            let response = await axios.get(article.url)
            let $ = cheerio.load(response.data)
            clipUrl = await $('#clip-iframe').attr('src')
        }
        let clipId = clipUrl.match(clipIdRegex)![0]
        let response = await axios.get(twitchApi+"?id="+clipId, { headers: twitchAuth })
        let clipData = response.data.data[0]
        article.title = clipData.title
        article.thumbnail = clipData.thumbnail_url
        if(article.title == "") article.title = article.description
        if(article.title == "") article.title = article.url
    } catch (error) {
        console.error('error on '+article.url)
        console.error(error)
        return null
    }

    // console.log(article)
    return article
}

export async function defaultParser(article: Article){
    try {
        let response = await axios.get(article.url)
        let $ = cheerio.load(response.data)
        let title = await $('title').text().trim()
        article.title = title
        if(article.title == "") article.title = article.description
        if(article.title == "") article.title = article.url
    } catch (error) {
        console.error('error on '+article.url)
        console.error(error)
        return null
    }
    // console.log(article)
    return article
}