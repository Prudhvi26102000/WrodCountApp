const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql");
const axios = require("axios");
const cheerio = require("cheerio");
const cors = require("cors");

//For Creating a Connetion
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_UERNAME,
  password:process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

//Connecting to Mysql
connection.connect((error) => {
  if (error) {
    console.error("Error connecting to MySql:", error);
  } else {
    console.log("Connected to MySql");
  }
});

const app = express();
app.use(bodyParser.json());
// app.use(express.urlencoded({ extended: true }));
// app.use(cors);

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "https://wordcountapp1.netlify.app");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

//Create table if not exists
const createInsightsTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS insights(
        id INT AUTO_INCREMENT PRIMARY KEY,
        domainName VARCHAR(255) NOT NULL,
        url VARCHAR(255) NOT NULL,
        wordCount INT NOT NULL,
        favorite BOOLEAN NOT NULL DEFAULT false,
        webLinks TEXT,
        mediaLinks TEXT
    )
    `;
  connection.query(sql, (error) => {
    if (error) {
      console.error("Error creating table: ", error);
    } else {
      console.log("Table Created");
    }
  });
};

createInsightsTable();

//Post Mapping for insight
app.post("/addinsight", (req, res) => {
  const { url } = req.body;
  const domainName = GetDomainName(url);

  const checkWebLinksSql = "SELECT webLinks FROM insights WHERE domainName = ?";

  connection.query(checkWebLinksSql, [domainName], (error, results) => {
    // console.log("60 "  + results.length + " " + domainName);
    if (error) {
      console.error("Error checking web links:", error);
      return res.sendStatus(500);
    } else if (results.length > 0) {
      const webLinks = JSON.parse(results[0].webLinks);
      if (!webLinks.includes(url)) {
        addToWebLinks(domainName, url);
      }
    } else {
      addToNewDomain(domainName, url);
    }

    res.sendStatus(200);
  });
});

//Fetching Web Links
const addToWebLinks = (domainName, newUrl) => {
  const checkDomainSql = "SELECT domainName FROM insights WHERE domainName = ?";
  // const checkWebLinksSql = 'SELECT web_links FROM insights WHERE domain_name = ?';

  connection.query(checkDomainSql, [domainName], (error, results) => {
    if (error) {
      console.error("Error checking domain:", error);
    } else if (results.length > 0) {
      console.log("Domain already exists");
      addToExistingWebLinks(domainName, newUrl);
    } else {
      addToNewDomain(domainName, newUrl);
    }
  });
};

const addToExistingWebLinks = async (domainName, newUrl) => {
  const sql = `UPDATE insights SET webLinks = JSON_ARRAY_APPEND(webLinks, '$', ?) WHERE domainName = ?`;
  const word_count = await calculateWordCount(newUrl);

  const sql2 = "SELECT wordCount from insights WHERE domainName=?";

  connection.query(sql, [newUrl, domainName], (error, results) => {
    if (error) {
      console.error("Error adding URL to web links:", error);
    } else {
      console.log("URL added to web links successfully");
    }
  });

  connection.query(sql2, [domainName], (error, results) => {
    if (error) {
      callback(error);
    } else {
      let existingWordCount = 0;

      if (results.length > 0) {
        existingWordCount = word_count || 0;
      }

      const updatedWordCount = existingWordCount;

      const updateSql =
        "UPDATE insights SET wordCount = ? WHERE domainName = ?";
      const updateValues = [updatedWordCount, domainName];

      connection.query(updateSql, updateValues, (error, results) => {
        if (error) {
          console.log("Error updating the values");
        } else {
          console.log("WordCount updated!!");
        }
      });
    }
  });
};

const addToNewDomain = async (domainName, newUrl) => {
  const sql = `
    INSERT INTO insights (domainName, url, wordCount, favorite, webLinks, mediaLinks)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  const word_count = await calculateWordCount(newUrl);
  const media_link = await fetchMediaLinks(newUrl);

  const values = [
    domainName,
    newUrl,
    word_count,
    false,
    JSON.stringify(newUrl),
    JSON.stringify(media_link),
  ];

  connection.query(sql, values, (error, results) => {
    if (error) {
      console.error("Error inserting new domain:", error);
    } else {
      console.log("New domain inserted successfully");
    }
  });
};

//Fetching Domain Name....
const GetDomainName = (url) => {
  const urlObj = new URL(url);
  const hostName = urlObj.hostname;
  let domainName = urlObj.protocol + "//" + hostName.replace(/h^[^.]+\./g, "");
  console.log(domainName);
  return domainName;
};

//Word COunt...
async function calculateWordCount(url) {
  try {
    const { data } = await axios.get(url);
    const text = data.replace(/<[^>]*>/g, "");
    const words = text.trim().split(/\s+/);
    return words.length;
  } catch (error) {
    console.error("Error calculating word count:", error);
    throw error;
  }
}

//Fetching Media Data
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

//GET ALL Insights..
app.get("/insights", (req, res) => {
  const sql = "SELECT * FROM insights";

  connection.query(sql, (error, results) => {
    if (error) {
      console.error("Error retrieving the data: ", error);
      res.status(500).json({ message: "Error retrieving the data" });
    } else {
      res.status(200).json(results);
    }
  });
});

//DELETE the insight By Id.
app.delete("/insights/:id", (req, res) => {
  const insightId = req.params.id;
  const sql = "DELETE FROM insights WHERE id=?";

  connection.query(sql, [insightId], (error, results) => {
    if (error) {
      console.error("Error removing insight:", error);
      res.status(500).json({ message: "Error removing insigght" });
    } else {
      if (results.affectedRows == 0) {
        res.status(404).json({ message: "Insight not found" });
      } else {
        res.status(200).json({ message: "Insight DEleted SUccessfullt!!" });
      }
    }
  });
});

//Update the favorite
app.put("/insights/:id/favorite", (req, res) => {
  const insightId = req.params.id;
  const { favorite } = req.body;

  const sql = "UPDATE insights SET favorite = ? WHERE id = ?";

  connection.query(sql, [favorite, insightId], (error, results) => {
    if (error) {
      console.error("Error updating insight:", error);
      res.status(500).json({ message: "Error updating insight" });
    } else {
      if (results.affectedRows === 0) {
        res.status(404).json({ message: "Insight not found" });
      } else {
        res.status(200).json({ message: "favorite has been updated" });
      }
    }
  });
});

app.listen(3001, () => {
  console.log(`Server started on port 3001`);
});

// module.exports = server;
