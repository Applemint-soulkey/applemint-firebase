import * as common from './common';
import Axios from 'axios'
import {URL} from 'url'

let target_list = [
    "http://insagirl-hrm.appspot.com/json2/1/1/2/",
    "http://insagirl-hrm.appspot.com/json2/2/1/2/"
]

var urlRegex = /(https?:[^\s]+)/g
var ignoreRegex = /(lolcast\.kr)|(poooo\.ml)|(dostream\.com)/g
var directLinkRegex = /(\.mp4)|(\.jpg)|(\.png)|(\.gif)/g

class isgItem implements common.Item {
    url: string;
    type: string;
    host: string;
    textContent: string;
    timestamp: Date;

    constructor(url: string, content: string) {
        this.url = url
        this.textContent = content
        this.timestamp = new Date()
        try{
            let tempUrl = new URL(url)
            this.host = tempUrl.origin
            this.type = 'default'
            common.checkLinkType(this.host).then(type => {
                this.type = (directLinkRegex.test(url)) ? 'direct' : type
            })
        }
        catch(err){
            console.log(err)
            this.type = 'invalid'
            this.host = 'undefinded'
        }

    }
}

async function getInsagirlItems(json: string){
    let history: Array<string> = await common.get_history_list()
    let itemList: Array<isgItem> = []
    for (var line of json){
        let detail: string = line.split('|')[2]
        let detail_url_list = detail.match(urlRegex)
        if (detail_url_list !== null) {
            let insaItemUrl = detail_url_list[0]
            if(history.includes(insaItemUrl) || insaItemUrl.search(ignoreRegex)!==-1){
                continue
            }
            let insaItemContent = detail.replace(insaItemUrl, '').trim()
            if(insaItemContent.length === 0){
                insaItemContent = ''
            }
            let item = await new isgItem(insaItemUrl, insaItemContent)
            itemList.push(item)
        }
    }
    return itemList
}

export async function crawlInsagirl() {
    let itemList: Array<isgItem> = []

    for(var target of target_list) {
        let response = await Axios.get(target)
        let hrmData = await response.data
        let hrmItems = await getInsagirlItems(hrmData.v)
        itemList = itemList.concat(hrmItems)
    }

    common.updateItems(itemList)
    console.log(itemList)

    return itemList.length
}