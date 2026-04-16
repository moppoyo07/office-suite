// src/hooks/useActivityTemplates.js
// 会社ごとの活動テンプレ（問合せ・見学・体験）をロード/保存するフック
// 保存先: companies/{companyId}/activityTemplates/{type}

import { useState, useEffect, useCallback } from 'react';
import { collection, doc, getDoc, getDocs, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/index';
import {
  ACTIVITY_TEMPLATE_TYPES,
  DEFAULT_ACTIVITY_TEMPLATES,
} from '../constants/activityTemplates';

/**
 * テンプレ一覧を一括ロード
 * - Firestoreに保存済みのものは取得、なければデフォルトで埋める
 * @returns { templates: {type: {checklist, aiPrompt}}, loading, reload, save }
 */
export function useActivityTemplates(companyId) {
  const [templates, setTemplates] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!companyId) { setLoading(false); return; }
    setLoading(true);
    try {
      const colRef = collection(db, 'companies', companyId, 'activityTemplates');
      const snap = await getDocs(colRef);
      const data = {};
      snap.docs.forEach(d => {
        data[d.id] = d.data();
      });

      // デフォルトで埋める
      const merged = {};
      ACTIVITY_TEMPLATE_TYPES.forEach(type => {
        merged[type] = data[type] || { ...DEFAULT_ACTIVITY_TEMPLATES[type] };
      });
      setTemplates(merged);
    } catch (err) {
      console.error('テンプレ読み込みエラー:', err);
      // 失敗時もデフォルトを返す
      const fallback = {};
      ACTIVITY_TEMPLATE_TYPES.forEach(type => {
        fallback[type] = { ...DEFAULT_ACTIVITY_TEMPLATES[type] };
      });
      setTemplates(fallback);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => { load(); }, [load]);

  /**
   * 1種別分のテンプレを保存
   */
  const save = useCallback(async (type, { checklist, aiPrompt }) => {
    if (!companyId) throw new Error('companyIdが未設定です');
    const docRef = doc(db, 'companies', companyId, 'activityTemplates', type);
    await setDoc(docRef, {
      type,
      checklist: checklist || [],
      aiPrompt: aiPrompt || '',
      updatedAt: serverTimestamp(),
    }, { merge: true });
    // ローカルstateも更新
    setTemplates(prev => ({
      ...prev,
      [type]: { checklist, aiPrompt },
    }));
  }, [companyId]);

  return { templates, loading, reload: load, save };
}

/**
 * 単一の種別のテンプレだけ取得（ActivityLogFormから使用）
 * デフォルトにフォールバックする
 */
export async function fetchActivityTemplate(companyId, type) {
  if (!companyId || !ACTIVITY_TEMPLATE_TYPES.includes(type)) {
    return DEFAULT_ACTIVITY_TEMPLATES[type] || null;
  }
  try {
    const docRef = doc(db, 'companies', companyId, 'activityTemplates', type);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      return {
        checklist: data.checklist || [],
        aiPrompt: data.aiPrompt || '',
      };
    }
  } catch (err) {
    console.error('テンプレ取得エラー:', err);
  }
  return { ...DEFAULT_ACTIVITY_TEMPLATES[type] };
}
