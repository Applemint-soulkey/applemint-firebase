import * as cheerio from 'cheerio'
import * as common from './common';
import Axios from 'axios'

const target_page_size=5
const target_list = [
    'http://www.dogdrip.net/index.php?mid=dogdrip&page=',
]

class ddItem implements common.Item {
    url: string;
    type: string;
    textContent: string;
    timestamp: Date;

    constructor(url: string, content: string){
        this.url = url
        this.type = 'dogdrip'
        this.textContent = content
        this.timestamp = new Date()
    }
}

async function getDogdripItems(target: string) {
    let history: Array<string> = await common.get_history_list()
    let itemList: Array<ddItem> = []
    let response = await Axios.get(target)
    let $ = cheerio.load(response.data)
    let $table = $('tbody' ,'table[class="ed table table-divider"]')
    $table.find('.ed.link-reset').each(async (_, element) => {
        let element_url = element.attribs.href
        let element_content = $(element).find('.ed.title-link').text()
        var item = new ddItem(element_url, element_content)
        if(!history.includes(item.url) && item.url != '#popup_menu_area'){
            itemList.push(item)
        }
    })

    return itemList
}

export async function crawlDogdrip() {
    let itemList: Array<ddItem> = []

    for(var target of target_list) {
        for(var i = 1; i < target_page_size; i++){
            let pageItems: Array<ddItem> = await getDogdripItems(target + i)
            itemList = itemList.concat(pageItems)
        }
    }

    await common.updateItems(itemList)
    console.log(itemList)

    return itemList.length
}