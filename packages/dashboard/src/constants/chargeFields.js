// 加算フィールドのキーとラベルのマッピング（支店設定のキー → UIで使うキーとラベル）
export const CHARGE_FIELD_MAP = {
  attendanceMealSupport: { key: 'mealSupport', label: '食事', color: '#f59e0b' },
  attendanceTransportGoing: { key: 'transportGoing', label: '送迎↑', color: '#3b82f6' },
  attendanceTransportReturning: { key: 'transportReturning', label: '送迎↓', color: '#3b82f6' },
  attendanceTrialUse: { key: 'trialUse', label: '体験', color: '#8b5cf6' },
  attendanceHomeVisit: { key: 'homeVisit', label: '訪問', color: '#ec4899' },
  attendanceTransitionPrep: { key: 'transitionPrep', label: '移行', color: '#14b8a6' },
  attendanceSocialLife: { key: 'socialLife', label: '社会', color: '#06b6d4' },
  attendanceCommuteTraining: { key: 'commuteTraining', label: '通勤', color: '#84cc16' },
  attendanceHomeLife: { key: 'homeLife', label: '在宅生活', color: '#a855f7' },
  attendancePsychConsult: { key: 'psychConsult', label: '精神', color: '#ef4444' },
  attendanceMedicalCoop: { key: 'medicalCoop', label: '医連', color: '#dc2626' },
  attendanceMedicalHospital: { key: 'medicalHospital', label: '医入院', color: '#b91c1c' },
  attendanceIntensiveSupport: { key: 'intensiveSupport', label: '集中', color: '#7c3aed' },
  attendanceBridgeSupport: { key: 'bridgeSupport', label: '繋ぎ', color: '#2563eb' },
  attendanceRegionalCoop: { key: 'regionalCoop', label: '地域', color: '#059669' },
};
