// src/hooks/useRetentionRate.js

import { useState, useEffect, useMemo } from 'react';
import { addMonths, getYear, getMonth } from 'date-fns';
import useWorkplaceInfo from './useWorkplaceInfo'; // 先ほど作成したフック

// 日付オブジェクトを受け取り、それが属する日本の会計年度を返すヘルパー関数
// (例: 2024年4月1日〜2025年3月31日 → 2024を返す)
const getFiscalYear = (date) => {
  if (!date) return null;
  const year = getYear(date);
  const month = getMonth(date); // 0 (1月) - 11 (12月)
  // 1月〜3月は前年度の扱い
  return month < 3 ? year - 1 : year;
};

const useRetentionRate = (clients = [], targetYear) => {
  const { capacity, startDate, loading: workplaceInfoLoading } = useWorkplaceInfo();
  const [calculationResult, setCalculationResult] = useState({
    rate: 0,
    numerator: 0,   // 分子
    denominator: 0, // 分母
    details: {},      // 計算内訳
    loading: true,
    rule: '',         // 適用されたルール
  });

  // clientsデータが変更された時だけ、年度ごとの定着者数を再計算する
  const settledUsersByYear = useMemo(() => {
    const counts = {};
    clients.forEach(client => {
      // statusが'completed'の利用者のみを定着者としてカウント
      if (client.status === 'completed' && client.employmentDate) {
        const employmentDate = client.employmentDate.toDate();
        const settledDate = addMonths(employmentDate, 6); // 就職日から6ヶ月後の日付
        const fiscalYear = getFiscalYear(settledDate); // 定着した年度を計算
        if (fiscalYear) {
          counts[fiscalYear] = (counts[fiscalYear] || 0) + 1;
        }
      }
    });
    return counts;
  }, [clients]);

  useEffect(() => {
    // 必要なデータが揃っていなければ計算しない
    if (workplaceInfoLoading || !targetYear || !startDate || !capacity) {
      return;
    }

    const startFiscalYear = getFiscalYear(startDate); // 事業所の開業年度
    const currentFiscalYear = targetYear;
    
    let numerator = 0;
    let denominator = 0;
    let rule = '';
    let details = {};

    // --- 計算ロジックの分岐 ---
    
    // 3年度目以降: 通常計算 (前年度 + 前々年度)
    if (currentFiscalYear >= startFiscalYear + 2) {
      rule = '通常計算 (3年目以降)';
      const prevYear = currentFiscalYear - 1;
      const prevPrevYear = currentFiscalYear - 2;
      
      const settledUsersPrev = settledUsersByYear[prevYear] || 0;
      const settledUsersPrevPrev = settledUsersByYear[prevPrevYear] || 0;

      numerator = settledUsersPrev + settledUsersPrevPrev;
      denominator = capacity * 2; // 2か年度分の定員
      details = {
        [`${prevYear}年度の定着者`]: settledUsersPrev,
        [`${prevPrevYear}年度の定着者`]: settledUsersPrevPrev,
        '定員': `${capacity}人 × 2年度`,
      };
    } 
    // 2年度目: 特例計算
    else if (currentFiscalYear === startFiscalYear + 1) {
      rule = '特例計算 (2年目)';
      const firstYearActualRate = ((settledUsersByYear[startFiscalYear] || 0) / capacity) * 100;
      
      if (firstYearActualRate >= 40) {
        rule += ' - 初年度実績40%以上';
        // 2年度目の実績をそのまま使う
        numerator = settledUsersByYear[currentFiscalYear] || 0;
        denominator = capacity;
        details = { [`${currentFiscalYear}年度の定着者`]: numerator, '定員': capacity };
      } else {
        rule += ' - 原則計算';
        // 原則として「30%以上40%未満」の区分が適用されるが、実績値も計算する
        numerator = settledUsersByYear[currentFiscalYear] || 0;
        denominator = capacity;
        details = { [`${currentFiscalYear}年度の定着者`]: numerator, '定員': capacity, '備考': '行政報告上は「30%以上40%未満」区分' };
      }
    } 
    // 初年度: 特例計算
    else if (currentFiscalYear === startFiscalYear) {
      rule = '特例計算 (初年度)';
      numerator = settledUsersByYear[currentFiscalYear] || 0;
      denominator = capacity;
      details = { [`${currentFiscalYear}年度の定着者`]: numerator, '定員': capacity, '備考': '行政報告上は「30%以上40%未満」区分' };
    }

    const rate = denominator > 0 ? (numerator / denominator) * 100 : 0;

    setCalculationResult({
      rate: rate,
      numerator,
      denominator,
      details,
      loading: false,
      rule,
    });

  }, [targetYear, settledUsersByYear, capacity, startDate, workplaceInfoLoading]);

  return calculationResult;
};

export default useRetentionRate;