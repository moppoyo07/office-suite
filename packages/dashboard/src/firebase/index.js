import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// あなたのFirebase設定情報をここにペーストしてください
const firebaseConfig = {
    apiKey: "AIzaSyAdmlzzWz8m9Z3nqsAyQ2wx0wsbYZs8wKo",
    authDomain: "officehub-c6c1b.firebaseapp.com",
    projectId: "officehub-c6c1b",
    storageBucket: "officehub-c6c1b.firebasestorage.app",
    messagingSenderId: "281713006483",
    appId: "1:281713006483:web:dc517b215d2b54a37e7a66"
};

// アプリの初期化
const app = initializeApp(firebaseConfig);

// 各サービスを定数として取得
export const auth = getAuth(app);
export const db = getFirestore(app);

// Googleログイン用の便利関数をエクスポート
export const signInWithGoogle = () => {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
};