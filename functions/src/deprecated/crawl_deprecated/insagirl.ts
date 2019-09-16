import axios from 'axios'
import * as common from './common';
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

async function getInsagirlUrls (json: string) {
    let historyList: Array<string> = await common.get_history_list()
    let itemList: Array<common.crawlObject> = []
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
            let insaItemType = (directLinkRegex.test(insaItemUrl))? 'direct' : await common.checkLinkType(insaItemHost)
            console.log(insaItemType)
        }
    }
    return itemList
}

export async function crawlInsagirlCods (){

    for(var target of target_list){
        var response = await axios(target)
        var hrm_data = await response.data
        var hrm_articles = await getInsagirlUrls(hrm_data.v)
        console.log(hrm_articles)
        // codList = codList.concat(hrm_articles)
    }
}