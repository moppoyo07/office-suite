/**
 * 暫定期間終了日から提出期限を計算する
 * 期限 = 暫定期間終了日 - daysBefore日
 * @param {Date|Timestamp} provisionalEndDate 暫定期間終了日
 * @param {number} daysBefore 何日前に提出するか（デフォルト14）
 */
export const calcDueDate = (provisionalEndDate, daysBefore = 14) => {
  if (!provisionalEndDate) return null;
  const end = provisionalEndDate?.toDate
    ? provisionalEndDate.toDate()
    : new Date(provisionalEndDate);
  const due = new Date(end);
  due.setDate(due.getDate() - daysBefore);
  return due;
};

/**
 * 提出期限まで何日か返す（マイナスは期限超過）
 */
export const daysUntilDue = (provisionalEndDate, daysBefore = 14) => {
  const due = calcDueDate(provisionalEndDate, daysBefore);
  if (!due) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((due - today) / (1000 * 60 * 60 * 24));
};

/**
 * 期限の状態を返す
 */
export const getDueStatus = (provisionalEndDate, daysBefore = 14) => {
  const days = daysUntilDue(provisionalEndDate, daysBefore);
  if (days === null) return null;
  if (days < 0) return 'overdue';
  if (days <= 2) return 'urgent';
  if (days <= 7) return 'warning';
  return 'ok';
};
