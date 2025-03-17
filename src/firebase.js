// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAXL-oIPt01WXCmBafpLVzVv72JCVKawuI",
  authDomain: "brainstorm-625a5.firebaseapp.com",
  databaseURL: "https://brainstorm-625a5-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "brainstorm-625a5",
  storageBucket: "brainstorm-625a5.appspot.com",
  messagingSenderId: "213277109738",
  appId: "1:213277109738:web:abd3ce00f31bbefdb49693",
  measurementId: "G-JNXT3YBMJC"
};

const firebaseApp = initializeApp(firebaseConfig);

const db = getDatabase(firebaseApp);

const auth = getAuth(firebaseApp);

signInWithEmailAndPassword(auth, 'massimo.dileo@gmail.com', 'firMc96256coj1!ase')


export { db, auth };
