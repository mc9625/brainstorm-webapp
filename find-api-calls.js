// save as find-api-calls.js
const fs = require('fs');
const path = require('path');

// Directory to search
const srcDir = './src';

// Function to search files recursively
function searchFiles(dir, searchStr) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Recursively search subdirectories
      searchFiles(filePath, searchStr);
    } else if (stat.isFile() && (file.endsWith('.js') || file.endsWith('.jsx'))) {
      // Read the file content
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check if the file contains the search string
      if (content.includes(searchStr)) {
        console.log(`Found in: ${filePath}`);
        
        // Extract the lines containing the search string
        const lines = content.split('\n');
        lines.forEach((line, index) => {
          if (line.includes(searchStr)) {
            console.log(`  Line ${index + 1}: ${line.trim()}`);
          }
        });
        
        console.log('---');
      }
    }
  });
}

// Search for API calls
console.log('Searching for fetch API calls...');
searchFiles(srcDir, 'fetch(');
searchFiles(srcDir, 'axios.');
searchFiles(srcDir, 'API_BASE_URL');

console.log('Search complete.');