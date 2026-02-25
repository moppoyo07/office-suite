// src/hooks/useWorkplaceInfo.js

import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase'; // ⇐ パスを確認・修正してください

const useWorkplaceInfo = (workplaceId = 'main_office') => {
  const [workplaceInfo, setWorkplaceInfo] = useState({
    capacity: null,
    startDate: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const fetchInfo = async () => {
      if (!workplaceId) return;

      try {
        const docRef = doc(db, 'workplaces', workplaceId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setWorkplaceInfo({
            capacity: data.capacity,
            startDate: data.startDate?.toDate(), // TimestampをDateオブジェクトに変換
            loading: false,
            error: null,
          });
        } else {
          throw new Error('指定された事業所情報が見つかりません。');
        }
      } catch (err) {
        console.error("事業所情報の取得に失敗しました:", err);
        setWorkplaceInfo({
          capacity: null,
          startDate: null,
          loading: false,
          error: err.message,
        });
      }
    };

    fetchInfo();
  }, [workplaceId]);

  return workplaceInfo;
};

export default useWorkplaceInfo;