// serviceRecords から startTime/endTime を削除するクリーンアップスクリプト
// これらのフィールドはattendanceRecords専用
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(
  readFileSync(resolve(__dirname, '../../../officehub-c6c1b-firebase-adminsdk-fbsvc-4f703dd0ca.json'), 'utf-8')
);

const app = initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore(app);

const DRY_RUN = !process.argv.includes('--execute');

async function main() {
  console.log(DRY_RUN ? '=== DRY RUN ===' : '=== 実行モード ===');

  const snap = await db.collection('serviceRecords').get();
  let count = 0;

  for (const doc of snap.docs) {
    const data = doc.data();
    if (data.startTime !== undefined || data.endTime !== undefined) {
      count++;
      console.log(`${doc.id}: startTime="${data.startTime}" endTime="${data.endTime}" client=${data.clientName}`);

      if (!DRY_RUN) {
        await db.collection('serviceRecords').doc(doc.id).update({
          startTime: FieldValue.delete(),
          endTime: FieldValue.delete(),
        });
      }
    }
  }

  console.log(`\n対象: ${count}件`);
  if (DRY_RUN && count > 0) {
    console.log('実行するには: node scripts/cleanup-sr-times.mjs --execute');
  }

  process.exit(0);
}

main().catch(err => { console.error('エラー:', err); process.exit(1); });
