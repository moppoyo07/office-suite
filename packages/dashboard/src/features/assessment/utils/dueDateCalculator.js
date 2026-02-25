/**
 * 利用開始日から提出期限を計算する
 * 期限：利用開始日 + 2ヶ月 + 2週間
 */
export const calcDueDate = (serviceStartDate) => {
  if (!serviceStartDate) return null;
  const start = serviceStartDate?.toDate
    ? serviceStartDate.toDate()
    : new Date(serviceStartDate);
  const due = new Date(start);
  due.setMonth(due.getMonth() + 2);
  due.setDate(due.getDate() + 14);
  return due;
};

/**
 * 期限まで何日か返す（マイナスは期限超過）
 */
export const daysUntilDue = (serviceStartDate) => {
  const due = calcDueDate(serviceStartDate);
  if (!due) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((due - today) / (1000 * 60 * 60 * 24));
};

/**
 * 期限の状態を返す
 */
export const getDueStatus = (serviceStartDate) => {
  const days = daysUntilDue(serviceStartDate);
  if (days === null) return null;
  if (days < 0) return 'overdue';
  if (days <= 14) return 'urgent';
  if (days <= 30) return 'warning';
  return 'ok';
};
