import { useState, useEffect, useCallback } from 'react';
import { doc, setDoc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebase/index.js';

/**
 * アセスメントデータから clients/{clientId} に同期すべきフィールドを抽出する
 */
const buildClientSync = (data) => {
  const sync = {};

  // faceSheet → 基本情報 + 関係機関
  if (data.faceSheet) {
    const fs = data.faceSheet;
    // 直接マッピング
    ['nameKana', 'birthDate', 'gender', 'bloodType', 'postalCode',
      'address', 'phone', 'mobilePhone', 'email', 'commuteRoutes'].forEach(f => {
      if (fs[f] !== undefined) sync[f] = fs[f];
    });
    // 緊急連絡先: emergency 配列 → flat フィールド
    if (Array.isArray(fs.emergency)) {
      [0, 1, 2].forEach(i => {
        const n = i + 1;
        const e = fs.emergency[i] || {};
        sync[`emergencyContact${n}_name`] = e.name || '';
        sync[`emergencyContact${n}_relationship`] = e.relation || '';
        sync[`emergencyContact${n}_phone`] = e.phone || '';
      });
    }
    // 医療機関: hospitals 配列 → flat フィールド
    if (Array.isArray(fs.hospitals)) {
      [0, 1].forEach(i => {
        const n = i + 1;
        const h = fs.hospitals[i] || {};
        sync[`medicalInstitution${n}_name`] = h.name || '';
        sync[`medicalInstitution${n}_phone`] = h.phone || '';
        sync[`medicalInstitution${n}_doctor`] = h.doctor || '';
        sync[`medicalInstitution${n}_department`] = h.dept || '';
      });
    }
    // 相談支援事業所
    if (fs.supportOffice) {
      sync.supportCenter_name = fs.supportOffice.name || '';
      sync.supportCenter_contactPerson = fs.supportOffice.person || '';
      sync.supportCenter_phone = fs.supportOffice.phone || '';
    }
  }

  // faceSheetBack → 障害・疾病情報
  if (data.faceSheetBack) {
    const fb = data.faceSheetBack;
    if (fb.disability) {
      const d = fb.disability;
      if (d.diagnosisName !== undefined) sync.diagnosisName = d.diagnosisName;
      if (d.types !== undefined)         sync.disabilityTypes = d.types;
      if (d.comorbidity !== undefined)   sync.comorbidity = d.comorbidity;
    }
  }

  // behaviors → behavior_* flat フィールド
  if (data.behaviors) {
    const behaviors = data.behaviors;
    ['panic', 'obsession', 'compulsion', 'hallucination', 'seizure', 'other'].forEach(key => {
      const b = behaviors[key] || {};
      sync[`behavior_${key}_check`] = b.status || '';
      sync[`behavior_${key}_comment_self`] = b.selfComment || '';
      sync[`behavior_${key}_staff_note`] = b.staffNote || '';
    });
  }

  return sync;
};

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

  // セクション単位で保存（+ clients/{clientId} に同期）
  const saveSection = async (sectionKey, sectionData) => {
    const ref = doc(db, 'assessments', clientId);
    await updateDoc(ref, {
      [`data.${sectionKey}`]: sectionData,
      updatedAt: serverTimestamp(),
    });
    // 現在の assessment データを取得して clients に同期
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const currentData = snap.data().data || {};
      const syncFields = buildClientSync(currentData);
      if (Object.keys(syncFields).length > 0) {
        await updateDoc(doc(db, 'clients', clientId), {
          ...syncFields,
          updatedAt: serverTimestamp(),
        });
      }
    }
  };

  // 全セクションまとめて保存（+ clients/{clientId} に同期）
  const saveAll = async (allData) => {
    const ref = doc(db, 'assessments', clientId);
    await updateDoc(ref, {
      data: allData,
      updatedAt: serverTimestamp(),
    });
    // clients/{clientId} に同期
    const syncFields = buildClientSync(allData);
    if (Object.keys(syncFields).length > 0) {
      await updateDoc(doc(db, 'clients', clientId), {
        ...syncFields,
        updatedAt: serverTimestamp(),
      });
    }
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
