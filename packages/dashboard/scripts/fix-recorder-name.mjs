// 記録者名を一括変更するスクリプト
// 使い方:
//   DRY RUN: node scripts/fix-recorder-name.mjs
//   本番実行: node scripts/fix-recorder-name.mjs --execute

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// サービスアカウントキーの読み込み
const serviceAccount = JSON.parse(
  readFileSync(resolve(__dirname, '../../../officehub-c6c1b-firebase-adminsdk-fbsvc-4f703dd0ca.json'), 'utf-8')
);

const app = initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore(app);

// --- 設定 ---
const CLIENT_NAME = '髻谷　真穂';
const NEW_NAME = '圷　洋'; // 全角スペース付き（既存レコードと統一）
const DRY_RUN = !process.argv.includes('--execute');

// serviceRecords.recorderName は「福本 里沙」(半角スペース)
// attendanceRecords.staffName は「福本里沙」(スペースなし)
const SR_OLD_NAME = '福本 里沙';
const AR_OLD_NAME = '福本里沙';

async function main() {
  if (DRY_RUN) {
    console.log('=== DRY RUN モード（変更は行いません） ===\n');
  } else {
    console.log('=== 本番実行モード ===\n');
  }

  console.log(`対象者: ${CLIENT_NAME}`);
  console.log(`変更先: "${NEW_NAME}"\n`);

  // 1. serviceRecords の recorderName を変更
  const serviceSnap = await db.collection('serviceRecords')
    .where('clientName', '==', CLIENT_NAME)
    .where('recorderName', '==', SR_OLD_NAME)
    .get();

  console.log(`serviceRecords (recorderName "${SR_OLD_NAME}" → "${NEW_NAME}"): ${serviceSnap.size} 件`);

  // 2. attendanceRecords の staffName を変更
  const attendanceSnap = await db.collection('attendanceRecords')
    .where('clientName', '==', CLIENT_NAME)
    .where('staffName', '==', AR_OLD_NAME)
    .get();

  console.log(`attendanceRecords (staffName "${AR_OLD_NAME}" → "${NEW_NAME}"): ${attendanceSnap.size} 件`);

  const total = serviceSnap.size + attendanceSnap.size;
  console.log(`\n合計: ${total} 件\n`);

  if (total === 0) {
    console.log('対象レコードがありません。終了します。');
    process.exit(0);
  }

  if (DRY_RUN) {
    console.log('実行するには: node scripts/fix-recorder-name.mjs --execute');
    process.exit(0);
  }

  // バッチ書き込み（500件制限があるため分割）
  const BATCH_LIMIT = 500;
  const allDocs = [
    ...serviceSnap.docs.map(doc => ({ ref: doc.ref, field: 'recorderName' })),
    ...attendanceSnap.docs.map(doc => ({ ref: doc.ref, field: 'staffName' })),
  ];

  let updated = 0;
  for (let i = 0; i < allDocs.length; i += BATCH_LIMIT) {
    const batch = db.batch();
    const chunk = allDocs.slice(i, i + BATCH_LIMIT);
    for (const { ref, field } of chunk) {
      batch.update(ref, { [field]: NEW_NAME });
    }
    await batch.commit();
    updated += chunk.length;
    console.log(`更新済み: ${updated} / ${total}`);
  }

  console.log(`\n完了: ${updated} 件を更新しました。`);
  process.exit(0);
}

main().catch(err => {
  console.error('エラー:', err);
  process.exit(1);
});
