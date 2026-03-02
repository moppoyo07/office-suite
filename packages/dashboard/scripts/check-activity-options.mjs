// systemSettings/supportConfig の中身を確認するスクリプト
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
  // systemSettings/supportConfig を確認
  const docSnap = await db.collection('systemSettings').doc('supportConfig').get();

  if (!docSnap.exists) {
    console.log('❌ systemSettings/supportConfig が存在しません！');
  } else {
    const data = docSnap.data();
    console.log('✅ systemSettings/supportConfig が存在します');
    console.log('\n=== activityOptions ===');
    console.log(JSON.stringify(data.activityOptions, null, 2));
    console.log('\n=== 全フィールド一覧 ===');
    console.log(Object.keys(data).join(', '));
  }

  process.exit(0);
}

main().catch(err => { console.error('エラー:', err); process.exit(1); });
