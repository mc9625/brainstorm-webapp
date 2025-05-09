// src/config.js

const API_CONFIG = {
  // The URL will be different after you deploy to Render
  // Replace this with your actual Render URL once deployed
  API_BASE_URL: process.env.NODE_ENV === 'production'
    ? 'https://aibook.nuvolaproject.cloud/brainstorm-api' // This will be your Render URL
    : 'http://localhost:5001'
};

export default API_CONFIG;