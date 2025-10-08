// 改造後の AuthContext.jsx

import { createContext, useContext, useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
// ★ db と Firestoreの関数を追加でインポート
import { auth, db, signInWithGoogle } from "@/firebase/index.js";
import { doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  console.log("① AuthProvider: レンダリングが開始されました。");

  // ★ currentUser の名前を、より実態に合わせた authUser に変更 (任意)
  const [authUser, setAuthUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("② useEffect: Firebaseの監視を開始します。");

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("③ onAuthStateChanged: 状態変化を検知！ User:", user);
      
      if (user) {
        // --- ★ ここからがDBチェックの追加ロジック ★ ---
        setLoading(true); // DBチェック中はローディング状態にする

        // 1. ログインしたユーザーのUIDで、staffコレクションのドキュメントを直接指定
        const staffDocRef = doc(db, "staff", user.uid);
        const staffDocSnap = await getDoc(staffDocRef);

        // 2. ドキュメントが存在するかチェック
        if (staffDocSnap.exists()) {
          // 2-a. 存在する場合 (ログイン成功！)
          console.log("④-A: DBチェック成功！ このユーザーは登録済みです。");
          const staffData = staffDocSnap.data();
          
          // Auth情報とDB情報を合体させて、アプリで使うユーザー情報を作成
          setAuthUser({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            // ↓ Firestoreから取得したアプリ用の追加情報
            staffName: `${staffData.lastName} ${staffData.firstName}`,
            employmentType: staffData.employmentType,
          });

        } else {
          // 2-b. 存在しない場合 (アクセス拒否！)
          console.error("④-B: DBチェック失敗！ アクセスが許可されていないユーザーです。");
          alert("あなたのアカウントは、このシステムへのアクセスが許可されていません。");
          signOut(auth); // 強制ログアウト
          setAuthUser(null);
        }
        // --- ★ DBチェックのロジックここまで ★ ---

      } else {
        // ログアウトした場合
        setAuthUser(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    // ★ currentUser -> authUser に変更
    currentUser: authUser, 
    loading,
    loginWithGoogle: signInWithGoogle,
    logout: () => signOut(auth),
  };

  console.log("⑤ AuthProvider: 現在のloading状態:", loading, "authUser:", authUser);

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}