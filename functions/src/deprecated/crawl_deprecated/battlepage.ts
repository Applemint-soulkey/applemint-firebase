import * as cheerio from 'cheerio'
import axios from 'axios'
import * as common from './common';

const target_page_size = 5
const target_domain = 'http://v12.battlepage.com'
const target_list = [
    'http://v12.battlepage.com/??=Board.Humor.Table&page=',
    'http://v12.battlepage.com/??=Board.Etc.Table&page='
]

class bpObject implements common.crawlObject{
    id: string;
    url: string;
    type: string;
    host: string;
    content: string;
    timestamp: Date;
    constructor(url: string, content: string) {
        this.id = ''
        this.url = this.url_formatter(url),
        this.type = 'battlepage'
        this.host = target_domain
        this.content = content
        this.timestamp = new Date()
    }

    url_formatter(url:string){
        return url.replace(/&page=[0-9]/gi, "")
    }
}

async function getBattlepageCods (target: string) {
    let historyList: Array<string> = await common.get_history_list()
    let itemList: Array<bpObject> = []
    let response = await axios.get(target)
    let $ = await cheerio.load(response.data)
    let $table_data = $('#div_content_containter > div:nth-child(2) > div.detail_container > div.ListTable')
    await $table_data.find('td.bp_subject').each(async (index: number, element: any) => {
        let element_url = await $(element).find('a').attr('href')
        var bpItem = await new bpObject(element_url, element.attribs.title)
        if(!historyList.includes(bpItem.url)){
            itemList.push(bpItem)
        }
    })

    return itemList
}

export async function crawlBattlepageCods (){
    let resMsg : common.msgObject = {
        timestamp: new Date(),
        articleCnt: 0
    }
    let codList: Array<bpObject> = []

    for(var target of target_list){
        for(var i=1; i<target_page_size; i++){
            let page_cods: Array<bpObject> = await getBattlepageCods(target+i)
            codList = codList.concat(page_cods)
        }
    }
    common.updateCrawlObject(codList)

    resMsg.timestamp = new Date()
    resMsg.articleCnt = codList.length

    return resMsg
}