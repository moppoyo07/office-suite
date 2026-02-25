import { useState, useEffect, useCallback } from 'react';
import { doc, setDoc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebase/index.js';

/**
 * assessmentsコレクション
 * ドキュメントIDは clientId と同じ（1利用者1レコード）
 */
export const useAssessment = (clientId) => {
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAssessment = useCallback(async () => {
    if (!clientId) { setLoading(false); return; }
    setLoading(true);
    try {
      const ref = doc(db, 'assessments', clientId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setAssessment({ id: snap.id, ...snap.data() });
      } else {
        setAssessment(null);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => { fetchAssessment(); }, [fetchAssessment]);

  // 新規作成（なければ作る・あれば何もしない）
  const createAssessment = async (clientName, serviceStartDate) => {
    const ref = doc(db, 'assessments', clientId);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        clientId,
        clientName,
        serviceStartDate: serviceStartDate || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        data: {
          faceSheet: {},
          faceSheetBack: {},
          assessment1: {},
          assessment2: {},
          mentalAssessment: {},
          behaviors: {},
        },
      });
    }
    await fetchAssessment();
    return clientId;
  };

  // セクション単位で保存
  const saveSection = async (sectionKey, sectionData) => {
    const ref = doc(db, 'assessments', clientId);
    await updateDoc(ref, {
      [`data.${sectionKey}`]: sectionData,
      updatedAt: serverTimestamp(),
    });
  };

  // 全セクションまとめて保存
  const saveAll = async (allData) => {
    const ref = doc(db, 'assessments', clientId);
    await updateDoc(ref, {
      data: allData,
      updatedAt: serverTimestamp(),
    });
    await fetchAssessment();
  };

  return {
    assessment,
    loading,
    error,
    createAssessment,
    saveSection,
    saveAll,
    refetch: fetchAssessment,
  };
};
