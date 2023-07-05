/* Simple Hello World in Node.js */
const axios = require("axios");
const cheerio = require("cheerio");
const fetchMediaLinks = async (url) => {
  try {
    const { data } = await axios.get(url);
    const mediaLinks = [];

    const $ = cheerio.load(data);

    const mediaElements = $("img, video");

    mediaElements.each((_, element) => {
      const mediaUrl = $(element).attr("src");
      if (mediaUrl) {
        mediaLinks.push(mediaUrl);
      }
    });

    return mediaLinks;
  } catch (error) {
    console.error("Error fetching media links:", error);
    throw error;
  }
};

console.log(fetchMediaLinks("https://www.novel.com/products"));
