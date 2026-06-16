// src/hooks/useChargeMaster.js
// 会社ごとの加算マスターをロード/保存するフック
// 保存先: companies/{companyId}/chargeMaster/{key}

import { useState, useEffect, useCallback } from 'react';
import { collection, doc, getDocs, setDoc, deleteDoc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/index';
import { DEFAULT_CHARGE_MASTER } from '../constants/chargeMaster';

const colPath = (companyId) => collection(db, 'companies', companyId, 'chargeMaster');

export function useChargeMaster(companyId) {
    const [charges, setCharges] = useState([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        if (!companyId) { setCharges([]); setLoading(false); return; }
        setLoading(true);
        try {
            const snap = await getDocs(colPath(companyId));
            const list = snap.docs.map(d => ({ key: d.id, ...d.data() }));
            list.sort((a, b) => (a.order ?? 999) - (b.order ?? 999) || (a.name || '').localeCompare(b.name || '', 'ja'));
            setCharges(list);
        } catch (err) {
            console.error('加算マスター読み込みエラー:', err);
            setCharges([]);
        } finally {
            setLoading(false);
        }
    }, [companyId]);

    useEffect(() => { load(); }, [load]);

    // 1件の加算を保存（新規・更新兼用）
    const upsert = useCallback(async (charge) => {
        if (!companyId) throw new Error('companyIdが未設定です');
        if (!charge.key) throw new Error('keyが未設定です');
        const { key, ...rest } = charge;
        await setDoc(doc(db, 'companies', companyId, 'chargeMaster', key), {
            ...rest,
            updatedAt: serverTimestamp(),
        }, { merge: true });
        setCharges(prev => {
            const exists = prev.some(c => c.key === key);
            const next = exists
                ? prev.map(c => c.key === key ? { ...c, ...rest, key } : c)
                : [...prev, { ...rest, key }];
            return next.sort((a, b) => (a.order ?? 999) - (b.order ?? 999) || (a.name || '').localeCompare(b.name || '', 'ja'));
        });
    }, [companyId]);

    const remove = useCallback(async (key) => {
        if (!companyId) throw new Error('companyIdが未設定です');
        await deleteDoc(doc(db, 'companies', companyId, 'chargeMaster', key));
        setCharges(prev => prev.filter(c => c.key !== key));
    }, [companyId]);

    // 初期データ投入（既存の units は merge で保持）
    const seedDefaults = useCallback(async () => {
        if (!companyId) throw new Error('companyIdが未設定です');
        const batch = writeBatch(db);
        DEFAULT_CHARGE_MASTER.forEach(({ key, ...rest }) => {
            batch.set(doc(db, 'companies', companyId, 'chargeMaster', key), {
                ...rest,
                updatedAt: serverTimestamp(),
            }, { merge: true });
        });
        await batch.commit();
        await load();
    }, [companyId, load]);

    return { charges, loading, reload: load, upsert, remove, seedDefaults };
}
