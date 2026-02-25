import { collection, writeBatch, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { MUNICIPALITIES } from './municipalityConfig';

/**
 * 自治体マスターの初期データをFirestoreに移行
 */
export const seedMunicipalities = async () => {
    try {
        const batch = writeBatch(db);
        const colRef = collection(db, 'municipalities');

        for (const m of MUNICIPALITIES) {
            const docRef = doc(colRef, m.id);
            batch.set(docRef, {
                ...m,
                isActive: m.enabled,
                updatedAt: new Date(),
            });
        }

        await batch.commit();
        console.log('自治体マスターの初期化に成功しました');
        return { success: true };
    } catch (error) {
        console.error('自治体マスターの初期化エラー:', error);
        return { success: false, error };
    }
};
