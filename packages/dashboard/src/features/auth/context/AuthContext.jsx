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

        try {
          // 1. メールアドレスでusersコレクションを検索
          const { collection, query, where, getDocs } = await import('firebase/firestore');
          const usersQuery = query(
            collection(db, "users"),
            where("email", "==", user.email)
          );
          const usersSnap = await getDocs(usersQuery);

          // 2. ドキュメントが存在するかチェック
          if (!usersSnap.empty) {
            const userDoc = usersSnap.docs[0];
            const userData = userDoc.data();

            // invitePendingチェック
            if (userData.invitePending === true) {
              console.error("④-B: このユーザーは招待承認待ちです。");
              alert("あなたのアカウントはまだ承認されていません。管理者に連絡してください。");
              signOut(auth);
              setAuthUser(null);
            } else if (userData.isActive === false) {
              console.error("④-B: このユーザーは無効化されています。");
              alert("あなたのアカウントは無効化されています。");
              signOut(auth);
              setAuthUser(null);
            } else {
              // ログイン成功！
              console.log("④-A: DBチェック成功！ このユーザーは登録済みです。");

              // 初回ログイン時にUIDを自動保存
              if (!userData.uid) {
                const { updateDoc } = await import('firebase/firestore');
                await updateDoc(userDoc.ref, { uid: user.uid });
                console.log("⭐ 初回ログイン: UIDを自動保存しました");
              }

              // Auth情報とDB情報を合体させて、アプリで使うユーザー情報を作成
              setAuthUser({
                uid: user.uid,
                email: user.email,
                displayName: userData.displayName || userData.name || user.displayName,
                photoURL: user.photoURL,
                // ↓ Firestoreから取得したアプリ用の追加情報
                userDocId: userDoc.id,
                staffName: userData.displayName || userData.name || `${userData.lastName || ''} ${userData.firstName || ''}`.trim(),
                role: userData.role,
                companyId: userData.companyId,
                branchId: userData.branchId,
              });
            }

          } else {
            // 2-b. 存在しない場合 (アクセス拒否！)
            console.error("④-B: DBチェック失敗！ アクセスが許可されていないユーザーです。");
            alert("あなたのアカウントは、このシステムへのアクセスが許可されていません。");
            signOut(auth); // 強制ログアウト
            setAuthUser(null);
          }
        } catch (error) {
          console.error("DBチェックエラー:", error);
          alert("認証中にエラーが発生しました。");
          signOut(auth);
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