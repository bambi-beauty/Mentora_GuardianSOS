import React, { useState, useEffect } from "react";

const Countries = () => {
  const [saveData, setSaveData] = useState([]); // ✅ Moved outside useEffect
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("https://restcountries.com/v3.1/all"); // ✅ Use /all
        if (!response.ok) throw new Error("Failed to fetch countries");
        const data = await response.json();
        setSaveData(data);
      } catch (e) {
        setError(e.message);
      }
    };

    fetchData();
  }, []);

  return (
    <div>
      <h2>Countries</h2>
      {error && <p>Error: {error}</p>}
      <ul>
        {saveData.map((country, index) => (
          <li key={index}>
            {country.name?.common}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Countries;
