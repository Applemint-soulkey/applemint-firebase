import axios from "axios";
import * as cheerio from "cheerio";
var getYoutubeID = require("get-youtube-id");

class AnalyzeResult {
  targetUrl: string = "";
  targetFbId: string = "";
  title: string = "";
  midiContents: Array<string> = [];
  extContents: Array<string> = [];

  printInfo = () => {
    console.log("targetUrl: " + this.targetUrl);
    console.log("targetFbId: " + this.targetFbId);
    console.log("title: " + this.title);
    console.log("midiContents: " + this.midiContents);
    console.log("extContents: " + this.extContents);
  };
}

// const twitchApi = "https://api.twitch.tv/helix/clips";
const youtubeKey = process.env.ANALYZE_YOUTUBE_KEY;
const youtubeApi = "https://www.googleapis.com/youtube/v3/videos";
const imgurAlbumApi = "https://api.imgur.com/3/album/";
const imgurImageApi = "https://api.imgur.com/3/image/";
const imgurAuth = {
  Authorization: "Client-ID " + process.env.ANALYZE_IMGUR_KEY
};
const twitchAuth = {
  "Client-ID": process.env.ANALYZE_TWITCH_KEY
};

const extractTags = (
  contentElement: any,
  tagName: string,
  attrName: string = "src"
) => {
  let tagSrcs: Array<string> = [];
  let tagElements = contentElement.find(tagName);
  tagElements.map((index: number, element: any) => {
    tagSrcs.push(element.attribs[attrName]);
  });
  return tagSrcs;
};

const bpParser = async (url: string, fb_id: string) => {
  let bpItem = new AnalyzeResult();
  bpItem.targetUrl = url;
  bpItem.targetFbId = fb_id;

  try {
    let response = await axios.get(url);
    let $ = cheerio.load(response.data);

    // Get Title
    bpItem.title = $("title")
      .text()
      .replace(" - BATTLEPAGE.COM v12", "")
      .replace("유머 게시판 - ", "")
      .replace("기타 게시판 - ", "");
    let pageElement = $(".search_content");

    // Get img Tag
    extractTags(pageElement, "img").map((value, _) => {
      bpItem.midiContents.push(value);
    });

    // Get iframe Tag
    extractTags(pageElement, "iframe").map((value, _) => {
      bpItem.extContents.push(
        value.includes("https:") ? value : "https:" + value
      );
    });
  } catch (error) {
    console.error(error);
  }
  bpItem.printInfo();

  return bpItem;
};

const ddParser = async (url: string, fb_id: string) => {
  let ddItem = new AnalyzeResult();
  ddItem.targetUrl = url;
  ddItem.targetFbId = fb_id;
  try {
    let response = await axios.get(url);
    let $ = cheerio.load(response.data);

    ddItem.title = $("title")
      .text()
      .replace(" - DogDrip.Net 개드립", "");

    let pageElement = await $("#article_1");

    extractTags(pageElement, "img").map((value, _) => {
      ddItem.midiContents.push(
        value.includes("/dvs/") ? "https://www.dogdrip.net" + value : value
      );
    });
    extractTags(pageElement, "video").map((value, _) => {
      ddItem.midiContents.push(
        value.includes("/dvs/") ? "https://www.dogdrip.net" + value : value
      );
    });
    extractTags(pageElement, "iframe").map((value: string, _) => {
      ddItem.extContents.push(
        value.includes("https:") ? value : "https:" + value
      );
    });
  } catch (error) {
    console.error(error);
  }
  ddItem.printInfo();
  return ddItem;
};

const fmParser = async (url: string, fb_id: string) => {
  let item = new AnalyzeResult();
  item.targetUrl = url;
  item.targetFbId = fb_id;
  try {
    let response = await axios.get(url);
    let $ = cheerio.load(response.data);
    let pageContent = await $("article");

    extractTags(pageContent, "img").map((value, index) => {
      item.midiContents.push(
        value.includes("https:") ? value : "https:" + value
      );
    });

    extractTags(pageContent, "source").map((value, index) => {
      item.midiContents.push(
        value.includes("https:") ? value : "https:" + value
      );
    });
  } catch (error) {
    console.error(error);
  }
  item.printInfo();
  return item;
};

const imgurParser = async (url: string, fb_id: string) => {
  let item = new AnalyzeResult();
  item.targetUrl = url;
  item.targetFbId = fb_id;

  const albumKeyword = "/a/";
  let imgurHash = url.split("/").pop();
  if (url.includes(albumKeyword)) {
    //album
    let imgurResponse = await axios.get(imgurAlbumApi + imgurHash + "/images", {
      headers: imgurAuth
    });
    let imgDataList = await imgurResponse.data.data;
    imgDataList.map((data: any, _: any) => {
      item.midiContents.push(data.link);
    });
  } else {
    //single
    let imgurResponse = await axios.get(imgurImageApi + imgurHash, {
      headers: imgurAuth
    });
    let imgData = await imgurResponse.data.data;
    item.midiContents.push(imgData.link);
  }

  item.printInfo();
  return item;
};

const youtubeParser = async (url: string, fb_id: string) => {
  let item = new AnalyzeResult();
  item.targetUrl = url;
  item.targetFbId = fb_id;

  let youtubeId = await getYoutubeID(url);
  if (youtubeId !== null) {
    let query = "?key=" + youtubeKey + "&part=snippet&id=" + youtubeId;
    let videoData = await axios.get(youtubeApi + query);
    let videoItem = await videoData.data.items[0].snippet;
    item.title = videoItem.title;
    item.midiContents.push(videoItem.thumbnails.default.url);
  }
  item.printInfo();
  return item;
};

const twitchParser = async (url: string, fb_id: string) => {
  let item = new AnalyzeResult();
  item.targetUrl = url;
  item.targetFbId = fb_id;
  let tgdRegex = /tgd\.kr/g;
  let clipIdRegex = /([A-Z])\w+/g;
  let clipUrl = url;

  if (tgdRegex.test(url)) {
    //tgd
    let response = await axios.get(url);
    let $ = cheerio.load(response.data);
    clipUrl = await $("#clip-iframe").attr("src");
  }
  let slug = clipUrl.match(clipIdRegex)![0];
  let basicResponse = await axios.get(
    "https://clips.twitch.tv/api/v2/clips/" + slug,
    { headers: twitchAuth }
  );
  let statusResponse = await axios.get(
    "https://clips.twitch.tv/api/v2/clips/" + slug + "/status",
    {
      headers: twitchAuth
    }
  );
  item.title = basicResponse.data.title;
  item.midiContents.push(statusResponse.data.quality_options[0].source);
  item.printInfo();
  return item;
};

const parserFactory = async (document: any) => {
  let result = new AnalyzeResult();
  switch (document.type) {
    case "battlepage":
      break;
    case "dogdrip":
      break;
    case "fmkorea":
      break;
    case "imgur":
      break;
    case "youtube":
      break;
    case "twitch":
      break;
      deafult: break;
  }
  return result;
};

export default parserFactory;
