import axios from "axios";
const functions = require("firebase-functions");

const raindropAPi = "https://api.raindrop.io";
const raindropHeaders = {
  headers: {
    Authorization: "Bearer " + functions.config().raindropapi.key,
  },
};

const getCollections = async () => {
  let url = raindropAPi + "/rest/v1/collections";
  let response = await axios.get(url, raindropHeaders);
  let collectionPairs: Array<any> = [];

  if (response.status === 200) {
    let collections = await response.data.items;
    collections.map((value: any, index: number) => {
      collectionPairs.push({
        label: value.title,
        value: value._id.toString(),
      });
    });
  }
  return collectionPairs;
};

const createRaindrop = async (
  title: string,
  url: string,
  collectionId: string,
  tags: Array<string>
) => {
  let api = raindropAPi + "/rest/v1/raindrop";
  let body = {
    link: url,
    title: title,
    collection: {
      $id: collectionId,
    },
    tags: tags,
  };
  let response = await axios.post(api, body, raindropHeaders);
  if (response.status === 200) {
    return response.data;
  } else {
    return response.status;
  }
};

export { getCollections, createRaindrop };
