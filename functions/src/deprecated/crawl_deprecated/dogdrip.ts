import * as cheerio from 'cheerio'
import axios from 'axios'
import * as common from './common';

const target_page_size=5
const target_domain = 'https://www.dogdrip.net'
const target_list = [
    'http://www.dogdrip.net/index.php?mid=dogdrip&page=',
]

class ddObject implements common.crawlObject {
    id: string;
    url: string;
    type: string;
    host: string;
    content: string;
    timestamp: Date;
    constructor(url: string, content: string) {
        this.id = ''
        this.url = url,
        this.type = 'dogdrip'
        this.host = target_domain
        this.content = content
        this.timestamp = new Date()
    }
}

async function getDogdripCods (target: string) {
    let historyList: Array<string> = await common.get_history_list()
    let itemList: Array<ddObject> = []
    let response = await axios.get(target)
    let $ = await cheerio.load(response.data)
    let $table_data = $('#main > div > div.eq.section.secontent.background-color-content > div > div.ed.board-list > table > tbody')
    await $table_data.find('.ed.link-reset').each(async (index, element) => {
        let element_url = element.attribs.href
        console.log(element_url)
        let element_content = $(element).find('.ed.title-link').text()
        var ddItem = await new ddObject(element_url, element_content)
        if(!historyList.includes(ddItem.url) && ddItem.url != '#popup_menu_area'){
            itemList.push(ddItem)
        }
    })

    return itemList
}

export async function crawlDogdripCods (){
    let resMsg : common.msgObject = {
        timestamp: new Date(),
        articleCnt: 0
    }
    let codList: Array<ddObject> = []

    for(var target of target_list){
        for(var i=1; i<target_page_size; i++){
            let page_cods: Array<ddObject> = await getDogdripCods(target+i)
            codList = codList.concat(page_cods)
        }
    }
    common.updateCrawlObject(codList)
    resMsg.timestamp = new Date()
    resMsg.articleCnt = codList.length

    return resMsg
}