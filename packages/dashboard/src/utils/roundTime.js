/**
 * 時刻文字列を30分単位に丸める
 * 15分境界で切り捨て/切り上げ:
 *   :00〜:14 → :00
 *   :15〜:44 → :30
 *   :45〜:59 → 次の時間の :00
 *
 * @param {string} timeStr - "HH:mm" 形式の時刻文字列
 * @returns {string} 丸められた "HH:mm" 形式の時刻文字列
 */
export function roundTo30Min(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return timeStr;

  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;

  let hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);

  if (isNaN(hours) || isNaN(minutes)) return timeStr;

  let roundedMinutes;
  if (minutes < 15) {
    roundedMinutes = 0;
  } else if (minutes < 45) {
    roundedMinutes = 30;
  } else {
    roundedMinutes = 0;
    hours += 1;
  }

  // 24時間を超えた場合の処理
  if (hours >= 24) hours = 0;

  return `${String(hours).padStart(2, '0')}:${String(roundedMinutes).padStart(2, '0')}`;
}
