// src/utils/japaneseHolidays.js
// 日本の祝日データ

// 固定祝日と移動祝日を計算
const FIXED_HOLIDAYS = {
    '01-01': '元日',
    '02-11': '建国記念の日',
    '02-23': '天皇誕生日',
    '04-29': '昭和の日',
    '05-03': '憲法記念日',
    '05-04': 'みどりの日',
    '05-05': 'こどもの日',
    '08-11': '山の日',
    '11-03': '文化の日',
    '11-23': '勤労感謝の日',
};

// 第N月曜日を取得
function getNthMonday(year, month, n) {
    const firstDay = new Date(year, month - 1, 1);
    const dayOfWeek = firstDay.getDay(); // 0=日, 1=月, ... 6=土

    // 最初の月曜日までの日数を計算
    let daysToMonday;
    if (dayOfWeek === 0) {
        daysToMonday = 1; // 日曜なら翌日
    } else if (dayOfWeek === 1) {
        daysToMonday = 0; // 月曜なら当日
    } else {
        daysToMonday = 8 - dayOfWeek; // それ以外は次の月曜まで
    }

    const firstMondayDate = 1 + daysToMonday;
    return new Date(year, month - 1, firstMondayDate + (n - 1) * 7);
}

// 春分・秋分の日（簡易計算）
function getVernalEquinox(year) {
    // 近似計算式
    const day = Math.floor(20.8431 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4));
    return new Date(year, 2, day); // 3月
}

function getAutumnalEquinox(year) {
    const day = Math.floor(23.2488 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4));
    return new Date(year, 8, day); // 9月
}

// 振替休日の計算（日曜が祝日なら月曜が振替休日）
function getSubstituteHolidays(holidays) {
    const substitutes = [];
    for (const [dateStr, name] of Object.entries(holidays)) {
        const date = new Date(dateStr);
        if (date.getDay() === 0) { // 日曜日
            const nextDay = new Date(date);
            nextDay.setDate(nextDay.getDate() + 1);
            const nextDayStr = formatDateKey(nextDay);
            if (!holidays[nextDayStr]) {
                substitutes.push({ date: nextDay, name: '振替休日' });
            }
        }
    }
    return substitutes;
}

function formatDateKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// 指定年の全祝日を取得
export function getHolidaysForYear(year) {
    const holidays = {};

    // 固定祝日
    for (const [mmdd, name] of Object.entries(FIXED_HOLIDAYS)) {
        holidays[`${year}-${mmdd}`] = name;
    }

    // 成人の日（1月第2月曜日）
    const seijin = getNthMonday(year, 1, 2);
    holidays[formatDateKey(seijin)] = '成人の日';

    // 海の日（7月第3月曜日）
    const umi = getNthMonday(year, 7, 3);
    holidays[formatDateKey(umi)] = '海の日';

    // 敬老の日（9月第3月曜日）
    const keirou = getNthMonday(year, 9, 3);
    holidays[formatDateKey(keirou)] = '敬老の日';

    // スポーツの日（10月第2月曜日）
    const sports = getNthMonday(year, 10, 2);
    holidays[formatDateKey(sports)] = 'スポーツの日';

    // 春分の日
    const shunbun = getVernalEquinox(year);
    holidays[formatDateKey(shunbun)] = '春分の日';

    // 秋分の日
    const shubun = getAutumnalEquinox(year);
    holidays[formatDateKey(shubun)] = '秋分の日';

    // 振替休日
    const substitutes = getSubstituteHolidays(holidays);
    for (const { date, name } of substitutes) {
        holidays[formatDateKey(date)] = name;
    }

    return holidays;
}

// 指定月の祝日を取得
export function getHolidaysForMonth(year, month) {
    const allHolidays = getHolidaysForYear(year);
    const monthStr = String(month).padStart(2, '0');
    const prefix = `${year}-${monthStr}`;

    const result = [];
    for (const [dateStr, name] of Object.entries(allHolidays)) {
        if (dateStr.startsWith(prefix)) {
            const day = parseInt(dateStr.split('-')[2], 10);
            result.push({ date: new Date(year, month - 1, day), day, name });
        }
    }

    return result.sort((a, b) => a.day - b.day);
}

// 今月から指定月数分の祝日を取得
export function getUpcomingHolidays(monthsAhead = 3) {
    const result = [];
    const now = new Date();

    for (let i = 0; i <= monthsAhead; i++) {
        const targetDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
        const year = targetDate.getFullYear();
        const month = targetDate.getMonth() + 1;
        const holidays = getHolidaysForMonth(year, month);

        if (holidays.length > 0) {
            result.push({
                year,
                month,
                label: `${year}年${month}月`,
                holidays,
            });
        }
    }

    return result;
}

// 日付が祝日かどうか
export function isHoliday(date) {
    const holidays = getHolidaysForYear(date.getFullYear());
    return holidays[formatDateKey(date)] || null;
}
