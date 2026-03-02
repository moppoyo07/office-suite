// attendanceRecords と serviceRecords のstartTime/endTimeを比較
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(
  readFileSync(resolve(__dirname, '../../../officehub-c6c1b-firebase-adminsdk-fbsvc-4f703dd0ca.json'), 'utf-8')
);

const app = initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore(app);

async function main() {
  // 最近のattendanceRecordsを5件取得
  const arSnap = await db.collection('attendanceRecords')
    .where('status', '==', 'present')
    .orderBy('updatedAt', 'desc')
    .limit(5)
    .get();

  console.log('=== 最近のattendanceRecords ===');
  for (const doc of arSnap.docs) {
    const d = doc.data();
    console.log(`ID: ${doc.id} | ${d.clientName} | startTime: "${d.startTime}" | endTime: "${d.endTime}" | updatedAt: ${d.updatedAt?.toDate()}`);

    // 対応するserviceRecordを確認
    const srSnap = await db.collection('serviceRecords')
      .where('attendanceRecordId', '==', doc.id)
      .limit(1)
      .get();

    if (!srSnap.empty) {
      const sr = srSnap.docs[0].data();
      console.log(`  SR: startTime: "${sr.startTime}" | endTime: "${sr.endTime}" | isCompleted: ${sr.isCompleted}`);
    } else {
      console.log(`  SR: なし`);
    }
    console.log('');
  }

  process.exit(0);
}

main().catch(err => { console.error('エラー:', err); process.exit(1); });
