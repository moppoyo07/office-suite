// 一時的なスクリプト: Firestoreのユーザーロールを確認する
// 使い方: node scripts/check-roles.mjs

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyAdmlzzWz8m9Z3nqsAyQ2wx0wsbYZs8wKo",
    authDomain: "officehub-c6c1b.firebaseapp.com",
    projectId: "officehub-c6c1b",
    storageBucket: "officehub-c6c1b.firebasestorage.app",
    messagingSenderId: "281713006483",
    appId: "1:281713006483:web:dc517b215d2b54a37e7a66"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function main() {
    console.log('=== Firestoreユーザー一覧 ===\n');

    const usersSnap = await getDocs(collection(db, 'users'));

    if (usersSnap.empty) {
        console.log('ユーザーが見つかりません');
        process.exit(0);
    }

    const users = [];
    usersSnap.forEach(doc => {
        const data = doc.data();
        users.push({
            uid: doc.id,
            email: data.email || '(未設定)',
            displayName: data.displayName || '(未設定)',
            role: data.role || '⚠️ ロール未設定',
            companyId: data.companyId || '-',
            branchId: data.branchId || '-',
        });
    });

    // ロール別にソート
    users.sort((a, b) => (a.role || '').localeCompare(b.role || ''));

    console.log('UID | 名前 | メール | ロール | 企業ID | 支店ID');
    console.log('-'.repeat(120));
    users.forEach(u => {
        console.log(`${u.uid} | ${u.displayName} | ${u.email} | ${u.role} | ${u.companyId} | ${u.branchId}`);
    });

    console.log(`\n合計: ${users.length} ユーザー`);
    process.exit(0);
}

main().catch(err => {
    console.error('エラー:', err);
    process.exit(1);
});
