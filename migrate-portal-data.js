// ポータルデータ移行スクリプト
// attendanceRecords と dailyCheckins の companyId なしレコードに
// clientId から正しい companyId を自動付与する

const admin = require('firebase-admin');
const serviceAccount = require('./officehub-c6c1b-firebase-adminsdk-fbsvc-4f703dd0ca.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function migrate() {
    console.log('=== ポータルデータ移行開始 ===\n');

    // clientsのcompanyIdキャッシュ
    const clientCache = {};
    const getClientCompanyId = async (clientId) => {
        if (!clientId) return null;
        if (clientCache[clientId] !== undefined) return clientCache[clientId];
        const snap = await db.collection('clients').doc(clientId).get();
        const cid = snap.exists ? snap.data().companyId || null : null;
        clientCache[clientId] = cid;
        return cid;
    };

    for (const colName of ['attendanceRecords', 'dailyCheckins']) {
        console.log(`[${colName}] 処理中...`);
        try {
            const allSnap = await db.collection(colName).get();
            const orphans = allSnap.docs.filter(d => !d.data().companyId);

            console.log(`  companyIdなし: ${orphans.length}件`);

            if (orphans.length === 0) {
                console.log(`  → スキップ\n`);
                continue;
            }

            let updated = 0;
            let skipped = 0;
            let batch = db.batch();
            let batchCount = 0;

            for (const docSnap of orphans) {
                const clientId = docSnap.data().clientId;
                const clientCompanyId = await getClientCompanyId(clientId);

                if (!clientCompanyId) {
                    skipped++;
                    continue;
                }

                batch.update(db.collection(colName).doc(docSnap.id), { companyId: clientCompanyId });
                batchCount++;
                updated++;

                if (batchCount === 499) {
                    await batch.commit();
                    batch = db.batch();
                    batchCount = 0;
                    console.log(`  バッチコミット済み (${updated}件)`);
                }
            }

            if (batchCount > 0) await batch.commit();

            console.log(`  ✓ ${updated}件更新, ${skipped}件スキップ（クライアント不明）\n`);
        } catch (err) {
            console.error(`  ✗ エラー:`, err.message, '\n');
        }
    }

    console.log('=== 移行完了 ===');
    process.exit(0);
}

migrate().catch(err => {
    console.error('致命的エラー:', err);
    process.exit(1);
});
