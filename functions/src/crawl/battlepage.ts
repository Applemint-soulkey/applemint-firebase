import * as cheerio from "cheerio";
import * as common from "./common";
import Axios from "axios";

const target_page_size = 5;
const target_list = [
  "https://v12.battlepage.com/??=Board.Humor.Table&page=",
  "https://v12.battlepage.com/??=Board.Etc.Table&page="
];

class bpItem implements common.Item {
  url: string;
  type: string;
  textContent: string;
  timestamp: Date;
  state: string;
  crawlSource: string;

  constructor(url: string, title: string) {
    this.url = this.url_formatter(url);
    this.type = "battlepage";
    this.textContent = title;
    this.timestamp = new Date();
    this.state = "new";
    this.crawlSource = "bp";
  }

  url_formatter(url: string) {
    return url.replace(/&page=[0-9]/gi, "");
  }
}

async function getBattlepageItems(target: string) {
  // let history: Array<string> = await common.get_history_list()
  let history: Array<string> = await common.get_history_by_type("bp");
  let itemList: Array<bpItem> = [];
  let response = await Axios.get(target);
  let $ = cheerio.load(response.data);
  let $table = $('div[class="ListTable"]');
  $table.find("td.bp_subject").each(async (_: number, element: any) => {
    console.log(element)
    let element_url = $(element)
      .find("a")
      .attr("href");
    var item = new bpItem(element_url, element.attribs.title);
    if (!history.includes(item.url)) {
      itemList.push(item);
    }
  });

  return itemList;
}

export async function crawlBattlepage() {
  let itemList: Array<bpItem> = [];

  for (var target of target_list) {
    for (var i = 1; i < target_page_size; i++) {
      let pageItems: Array<bpItem> = await getBattlepageItems(target + i);
      itemList = itemList.concat(pageItems);
    }
  }
  await common.updateItems(itemList);
  console.log(itemList);

  return itemList.length;
}
