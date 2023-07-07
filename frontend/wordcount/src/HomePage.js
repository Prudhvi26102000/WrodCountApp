import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function HomePage() {
  const [url, setUrl] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Make a POST request to the server
      const response = await axios.post("https://wordcount-8s2n.onrender.com/addinsight", {
        url,
      });
      console.log("15" + response);
      const { data } = response;
      console.log("17" + data);

      navigate({
        pathname: "/results",
        state: { data },
      });
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        marginTop: 50,
      }}
    >
      <h1>Web Scraper</h1>
      <input
        type="text"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Enter website URL"
        style={{ padding: 10, marginRight: 10, width: 500 }}
      />
      <button
        onClick={handleSubmit}
        style={{
          padding: "10px 20px",
          backgroundColor: "#007bff",
          color: "#fff",
          border: "none",
          cursor: "pointer",
          margin: "20px",
        }}
      >
        Submit
      </button>
    </div>
  );
}

export default HomePage;
