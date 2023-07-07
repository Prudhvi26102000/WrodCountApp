import React, { useEffect, useState } from "react";
import axios from "axios";

function ResultPage() {
  const [insights, setInsights] = useState([]);

  const toggleFavorite = (id) => {
    const insight = insights.find((insight) => insight.id === id);
    const updatedInsight = { ...insight, favorite: !insight.favorite };

    axios
      .put(`https://wordcount-8s2n.onrender.com/insights/${id}/favorite`, updatedInsight)
      .then(() => {
        // Success, update the insights state
        const updatedInsights = insights.map((insight) =>
          insight.id === id
            ? { ...insight, favorite: !insight.favorite }
            : insight
        );
        setInsights(updatedInsights);
      })
      .catch((error) => {
        console.error("Error updating favorite status:", error);
      });
  };

  const removeInsight = (id) => {
    axios
      .delete(`https://wordcount-8s2n.onrender.com/insights/${id}`)
      .then((response) => {
        // Remove the insight from the insights state
        const updatedInsights = insights.filter((insight) => insight.id !== id);
        console.log(response);
        setInsights(updatedInsights);
      })
      .catch((error) => {
        console.error("Error removing insight:", error);
      });
  };

  const fetchInsights = () => {
    axios
      .get("https://wordcount-8s2n.onrender.com/insights")
      .then((response) => {
        setInsights(response.data);
      })
      .catch((error) => {
        console.error("Error fetching insights:", error);
      });
  };

  useEffect(() => {
    fetchInsights();
    fetchInsights();
  }, []);

  return (
    <div style={{ marginTop: 50 }}>
      <h1>Results</h1>
      <table
        style={{ width: "100%", borderCollapse: "collapse", marginTop: 20 }}
      >
        <thead style={{ backgroundColor: "#007bff", color: "#fff" }}>
          <tr>
            <th style={{ padding: 10, textAlign: "left" }}>Domain Name</th>
            <th style={{ padding: 10, textAlign: "left" }}>Word Count</th>
            <th style={{ padding: 10, textAlign: "left" }}>Favorite</th>
            <th style={{ padding: 10, textAlign: "left" }}>Web Links</th>
            <th style={{ padding: 10, textAlign: "left" }}>Media Links</th>
            <th style={{ padding: 10, textAlign: "left" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {insights.map((item) => (
            <tr key={item.id}>
              <td style={{ padding: 10 }}>{item.domainName}</td>
              <td style={{ padding: 10 }}>{item.wordCount}</td>
              <td style={{ padding: 10 }}>{item.favorite ? "Yes" : "No"}</td>
              <td style={{ padding: 10 }}>{item.webLinks}</td>
              <td style={{ padding: 10 }}>{item.mediaLinks}</td>
              <td style={{ padding: 10 }}>
                <button onClick={() => toggleFavorite(item.id)}>
                  {item.favorite ? "Remove from Favorites" : "Add to Favorites"}
                </button>
                <button onClick={() => removeInsight(item.id)}>Remove</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ResultPage;
