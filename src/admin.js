var admin = require("firebase-admin");

var serviceAccount = require("./brainstorm-625a5-firebase-adminsdk-1kx3i-74c7a98ec0.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://brainstorm-625a5-default-rtdb.europe-west1.firebasedatabase.app"
});

const db = admin.database();

module.exports = db;
