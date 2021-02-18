import axios from "axios";
import * as cheerio from "cheerio";
const getYoutubeID = require("get-youtube-id");
const functions = require("firebase-functions");

class AnalyzeResult {
  targetUrl: string = "";
  targetFbId: string = "";
  title: string = "";
  description: string = "";
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
const youtubeKey = functions.config().youtubeapi.key;
const youtubeApi = "https://www.googleapis.com/youtube/v3/videos";
const imgurAlbumApi = "https://api.imgur.com/3/album/";
const imgurImageApi = "https://api.imgur.com/3/image/";
const imgurGalleryApi = "https://api.imgur.com/3/gallery/";
const twitchAuthApi = "https://id.twitch.tv/oauth2/token";
const twitchApi = "https://api.twitch.tv/helix/clips?id=";
const imgurAuth = {
  Authorization: "Client-ID " + functions.config().imgurapi.key,
};
const extractTags = (
  contentElement: any,
  tagName: string,
  attrName: string = "src"
) => {
  let tagSrcs: Array<string> = [];
  try {
    let tagElements = contentElement.find(tagName);
    tagElements.map((index: number, element: any) => {
      if (element.attribs[attrName] !== undefined) {
        tagSrcs.push(element.attribs[attrName]);
      }
    });
  } catch (error) {
    console.log(error);
  }
  return tagSrcs;
};

const bpParser = async (document: any, fb_id: string) => {
  let bpItem = new AnalyzeResult();
  bpItem.targetUrl = document.url;
  bpItem.targetFbId = fb_id;
  bpItem.title = document.textContent;

  try {
    let response = await axios.get(document.url);
    let $ = cheerio.load(response.data);
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
  return bpItem;
};

const ddParser = async (document: any, fb_id: string) => {
  let ddItem = new AnalyzeResult();
  ddItem.targetUrl = document.url;
  ddItem.targetFbId = fb_id;
  ddItem.title = document.textContent;
  try {
    let response = await axios.get(document.url);
    let $ = cheerio.load(response.data);
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
    extractTags(pageElement, "source").map((value, index) => {
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
  return ddItem;
};

const fmParser = async (document: any, fb_id: string) => {
  let item = new AnalyzeResult();
  item.targetUrl = document.url;
  item.targetFbId = fb_id;
  try {
    console.log("phase 0");
    console.log(document.url);
    let response = await axios.get(document.url);
    console.log("phase 1");
    let $ = cheerio.load(response.data);
    let pageContent = $("article");

    item.title = $("title").text();
    extractTags(pageContent, "img").map((value, index) => {
      if (value !== "//image.fmkorea.com/classes/lazy/img/transparent.gif") {
        item.midiContents.push(
          value.includes("https:") ? value : "https:" + value
        );
      }
    });

    extractTags(pageContent, "img", "data-original").map((value, index) => {
      if (value !== undefined) {
        item.midiContents.push(
          value.includes("https:") ? value : "https:" + value
        );
      }
    });

    extractTags(pageContent, "source").map((value, index) => {
      item.midiContents.push(
        value.includes("https:") ? value : "https:" + value
      );
    });
  } catch (error) {
    console.error(error);
  }
  return item;
};

const imgurParser = async (document: any, fb_id: string) => {
  let item = new AnalyzeResult();
  item.targetUrl = document.url;
  item.targetFbId = fb_id;
  item.title = document.textContent === "" ? "Imgur" : document.textContent;

  const albumKeyword = "/a/";
  const galleryKeyword = "/gallery/";
  let imgurHash = document.url.split("/").pop();
  if (document.url.includes(albumKeyword)) {
    //album
    let imgurResponse = await axios.get(imgurAlbumApi + imgurHash + "/images", {
      headers: imgurAuth,
    });
    let imgDataList = await imgurResponse.data.data;
    imgDataList.map((data: any, _: any) => {
      item.midiContents.push(data.link);
    });
  } else if (document.url.includes(galleryKeyword)) {
    //gallery
    let imgurResponse = await axios.get(imgurGalleryApi + imgurHash, {
      headers: imgurAuth,
    });
    let isAlbum = await imgurResponse.data.data.is_album;
    if (isAlbum) {
      let imgDataList = await imgurResponse.data.data.images;
      imgDataList.map((data: any, _: any) => {
        item.midiContents.push(data.link);
      });
    } else {
      let imgData = await imgurResponse.data.data.link;
      item.midiContents.push(imgData);
    }
  } else {
    //single
    let imgurResponse = await axios.get(imgurImageApi + imgurHash, {
      headers: imgurAuth,
    });
    let imgData = await imgurResponse.data.data;
    item.midiContents.push(imgData.link);
  }
  return item;
};

const youtubeParser = async (document: any, fb_id: string) => {
  let item = new AnalyzeResult();
  item.targetUrl = document.url;
  item.targetFbId = fb_id;
  item.description = document.textContent;

  let youtubeId = await getYoutubeID(document.url);
  if (youtubeId !== null && youtubeId !== undefined) {
    let query = "?key=" + youtubeKey + "&part=snippet&id=" + youtubeId;
    let videoData = await axios.get(youtubeApi + query);
    let videoItem = await videoData.data.items[0].snippet;
    item.title = videoItem.title;
    item.midiContents.push(videoItem.thumbnails.default.url);
  }
  return item;
};

const twitchParser = async (document: any, fb_id: string) => {
  let item = new AnalyzeResult();
  item.targetUrl = document.url;
  item.targetFbId = fb_id;
  item.description = document.textContent;

  let tgdRegex = /tgd\.kr/g;
  // let clipIdRegex = /([A-Z])\w+/g;
  let clipUrl = document.url;

  //Check tgd link
  if (tgdRegex.test(document.url)) {
    //tgd
    let response = await axios.get(document.url);
    let $ = cheerio.load(response.data);
    clipUrl = await $("#clip-iframe").attr("src");
  }

  //Get Twitch Auth Token
  let authResponse = await axios.post(
    twitchAuthApi +
      "?client_id=" +
      functions.config().twitchapi.key +
      "&client_secret=" +
      functions.config().twitchapi.secret +
      "&grant_type=client_credentials"
  );
  let authToken = authResponse.data.access_token;

  //Get Twitch Video URL
  let slug = clipUrl.split('/').pop()
  let basicResponse = await axios.get(twitchApi + slug, {
    headers: {
      "Client-ID": functions.config().twitchapi.key,
      Authorization: "Bearer " + authToken,
    },
  });
  
  let clipData = basicResponse.data.data[0];
  item.title = clipData.title;
  let thumb: string = clipData.thumbnail_url;
  let download_url = thumb.slice(0, thumb.indexOf("-preview-")) + ".mp4";
  item.midiContents.push(download_url);
  return item;
};

const directParser = async (document: any, fb_id: string) => {
  let item = new AnalyzeResult();
  item.targetUrl = document.url;
  item.targetFbId = fb_id;
  item.description = document.textContent;
  item.title = document.textContent;
  item.midiContents.push(document.url);
  return item;
};

const defaultParser = async (document: any, fb_id: string) => {
  let item = new AnalyzeResult();
  item.targetUrl = document.url;
  item.targetFbId = fb_id;
  item.description = document.textContent;
  try {
    let response = await axios.get(document.url);
    let $ = cheerio.load(response.data);
    item.title = $("title").text();
  } catch (error) {
    console.error(error);
  }
  return item;
};

const parserFactory = async (document: any, fb_id: string) => {
  let result = new AnalyzeResult();
  switch (document.type) {
    case "battlepage":
      result = await bpParser(document, fb_id);
      break;
    case "dogdrip":
      result = await ddParser(document, fb_id);
      break;
    case "fmkorea":
      result = await fmParser(document, fb_id);
      break;
    case "imgur":
      result = await imgurParser(document, fb_id);
      break;
    case "youtube":
      result = await youtubeParser(document, fb_id);
      break;
    case "twitch":
      result = await twitchParser(document, fb_id);
      break;
    case "direct":
      result = await directParser(document, fb_id);
      break;
    default:
      result = await defaultParser(document, fb_id);
      break;
  }
  return result;
};

export default parserFactory;
