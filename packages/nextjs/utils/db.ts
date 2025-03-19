// "use server";

import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '123456',
  database: 'nft',
  dateStrings: true,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export const connectToDatabase = async () => {
  try {
    return pool.getConnection();
  } catch (error) {
    console.error("Error getting database connection from pool:", error);
    throw error;
  }
};


const fetchFromApi = ({ path, method, body }: { path: string; method: string; body?: object }) =>
    fetch(path, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })
      .then(response => response.json())
      .catch(error => console.error("Error:", error));
  
  export const saveNFTToDB = (data: object) => {
    return fetchFromApi({
      path: `/api/nft/data`, 
      method: 'POST', 
      body: { data }
    });
  };
  
  