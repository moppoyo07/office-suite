// src/constants/clientStatus.js

// ステータスの定義（システム全体で使う辞書）
export const CLIENT_STATUS = {
  INQUIRY: 'inquiry',           // 新規問合せ
  INTERVIEW: 'interview',       // 面談・見学
  TRIAL: 'trial',               // 体験利用
  PRE_CONTRACT: 'pre_contract', // 契約準備中
  ACTIVE_ONSITE: 'active_onsite', // 施設内利用
  ACTIVE_REMOTE: 'active_remote', // 施設外利用
  GRADUATED: 'graduated',       // 就職卒業
  EXPIRED_GRADUATION: 'expired_graduation', // 就職無し卒業（期間満了）
  FOLLOW_UP: 'follow_up',       // 定着支援中
  COMPLETED: 'completed',       // 定着完了
  CLOSED: 'closed',             // 利用終了（ロスト）
  RETIRED: 'retired',           // 離職
};

// 表示用ラベルと色の設定
export const STATUS_CONFIG = {
  [CLIENT_STATUS.INQUIRY]:       { label: '新規問合せ', color: 'info',     bg: '#e3f2fd', text: '#0d47a1' },
  [CLIENT_STATUS.INTERVIEW]:     { label: '面談・見学', color: 'secondary', bg: '#f3e5f5', text: '#7b1fa2' },
  [CLIENT_STATUS.TRIAL]:         { label: '体験利用',   color: 'secondary', bg: '#e1bee7', text: '#4a148c' },
  [CLIENT_STATUS.PRE_CONTRACT]:  { label: '契約準備中', color: 'warning',  bg: '#fff8e1', text: '#ff6f00' },
  [CLIENT_STATUS.ACTIVE_ONSITE]: { label: '施設内利用', color: 'success',  bg: '#e8f5e9', text: '#2e7d32' },
  [CLIENT_STATUS.ACTIVE_REMOTE]: { label: '施設外利用', color: 'primary',  bg: '#e0f2f1', text: '#00695c' },
  [CLIENT_STATUS.GRADUATED]:     { label: '就職卒業',   color: 'warning',  bg: '#fff3e0', text: '#e65100' },
  [CLIENT_STATUS.EXPIRED_GRADUATION]: { label: '就職無し卒業', color: 'default', bg: '#eceff1', text: '#455a64' },
  [CLIENT_STATUS.FOLLOW_UP]:     { label: '定着支援中', color: 'warning',  bg: '#fbe9e7', text: '#d84315' },
  [CLIENT_STATUS.COMPLETED]:     { label: '定着完了',   color: 'success',  bg: '#e8eaf6', text: '#283593' },
  [CLIENT_STATUS.CLOSED]:        { label: '利用終了',   color: 'error',    bg: '#ffebee', text: '#c62828' },
  [CLIENT_STATUS.RETIRED]:       { label: '離職',       color: 'default',  bg: '#efebe9', text: '#5d4037' },
};

// 終了理由（ロスト理由）の詳細定義
export const CLOSED_REASONS = {
  LOST_PRE_VISIT:    { id: 'lost_pre_visit',    label: '見学前離脱' },
  LOST_POST_VISIT:   { id: 'lost_post_visit',   label: '見学後辞退' },
  LOST_IN_TRIAL:     { id: 'lost_in_trial',     label: '体験中辞退' },     // ★追加
  LOST_PRE_CONTRACT: { id: 'lost_pre_contract', label: '契約直前辞退' },   // ★追加
  DROP_OUT:          { id: 'drop_out',          label: '途中退所' },
  EXPIRED:           { id: 'expired',           label: '期間満了' }, 
  TRANSFERRED:       { id: 'transferred',       label: '他機関へ移行' },
  OTHER:             { id: 'other',             label: 'その他' },
};

// ステータスIDから表示情報を取得するヘルパー関数
export const getStatusInfo = (statusId) => {
  return STATUS_CONFIG[statusId] || { label: statusId || '不明', color: 'default', bg: '#f5f5f5', text: '#616161' };
};