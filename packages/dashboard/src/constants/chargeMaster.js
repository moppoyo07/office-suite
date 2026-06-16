// src/constants/chargeMaster.js
// 加算マスター（算定単位を年度ごとに登録しておく箱）
// 保存先: companies/{companyId}/chargeMaster/{key}
//
// 設計の意図:
//  - 加算の単位（点数）は報酬改定で年度ごとに変わる。units を「年度→単位」のマップで持つ。
//  - 将来「サービス記録の加算ON × この単位」で請求を計算できるよう、key は CHARGE_FIELD_MAP と一致させる。
//  - 記録側（serviceDetails.{key}）は boolean のまま。ここは単位の台帳に徹する。

import { CHARGE_FIELD_MAP } from './chargeFields';
import { BRANCH_FIELDS } from './branchFields';

// 「在宅」= 在宅生活加算 を表す加算キー。
// 出席の形態(attendanceType='remote')と表裏一体のため、フォームの在宅選択でこのキーを自動同期する。
// この加算は手動チップとしては出さず、在宅の選択ひとつで制御する。
export const REMOTE_CHARGE_KEY = 'homeLife';

// 算定単位の種別
export const UNIT_TYPES = [
    { value: 'day', label: '日（1日につき）' },
    { value: 'time', label: '回（1回につき）' },
    { value: 'month', label: '月（1月につき）' },
];

export const UNIT_TYPE_LABELS = {
    day: '日',
    time: '回',
    month: '月',
};

// 対象サービス種別
export const CHARGE_TARGET_SERVICES = [
    { value: 'transition', label: '就労移行支援' },
    { value: 'typeA', label: '就労継続支援A型' },
    { value: 'typeB', label: '就労継続支援B型' },
];

// デフォルトで在宅でも算定対象とみなす加算（管理者が後から変更可）
const HOME_ELIGIBLE_KEYS = new Set(['homeLife', 'psychConsult', 'medicalCoop']);

/**
 * シード定義（初期投入用）。
 * CHARGE_FIELD_MAP のキーをそのまま使い、名称は支店フィールドのラベルから補完する。
 * units は空（＝管理者がコンパネで年度ごとに入力する）。
 */
export const DEFAULT_CHARGE_MASTER = Object.entries(CHARGE_FIELD_MAP).map(([fieldKey, m], index) => ({
    key: m.key,
    name: BRANCH_FIELDS[fieldKey]?.label || m.label,
    shortLabel: m.label,
    color: m.color,
    unitType: 'day',
    targetServices: ['transition', 'typeA', 'typeB'],
    homeEligible: HOME_ELIGIBLE_KEYS.has(m.key),
    units: {}, // 年度→単位（例: { "2024": 30, "2027": 32 }）
    active: true,
    order: index,
}));

/**
 * 会計年度（4月始まり）を返す。
 */
export function getFiscalYear(date = new Date()) {
    const y = date.getFullYear();
    const m = date.getMonth() + 1;
    return m >= 4 ? y : y - 1;
}

/**
 * 指定年度に適用される単位を返す。
 * その年度以前で最も新しく登録された単位を採用する（無ければ null）。
 */
export function getUnitForYear(charge, fiscalYear) {
    const units = charge?.units || {};
    const years = Object.keys(units)
        .map(Number)
        .filter(n => Number.isFinite(n) && n <= fiscalYear)
        .sort((a, b) => b - a);
    return years.length ? units[String(years[0])] : null;
}
