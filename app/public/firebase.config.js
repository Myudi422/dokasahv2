// public/firebase.config.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyDiCCYSZVMSKMjkpx7QYZvUSxGYr-bQSdc",
    authDomain: "shiera-fb0f2.firebaseapp.com",
    projectId: "shiera-fb0f2",
    storageBucket: "shiera-fb0f2.appspot.com",
    messagingSenderId: "151082575783",
    appId: "1:151082575783:web:53a37edfc1cf3a8f8c7882",
    measurementId: "G-YBDMGT80J7"
  };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { auth, provider, signInWithPopup };