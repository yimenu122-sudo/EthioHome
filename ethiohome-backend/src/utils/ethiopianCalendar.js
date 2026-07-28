/**
 * @file ethiopianCalendar.js
 * @description Calendar Conversion and Formatting Utilities for Gregorian <-> Ethiopian calendars (Backend).
 */

const ETHIOPIAN_MONTHS = {
  en: [
    'Mäskäräm',
    'Ṭeqemt',
    'Ḥedar',
    'Taḫśaś',
    'Ṭer',
    'Yäkatit',
    'Meggabit',
    'Miyazya',
    'Ginbot',
    'Sene',
    'Ḥamle',
    'Nähase',
    'Ṗagume',
  ],
  am: [
    'መስከረም',
    'ጥቅምት',
    'ህዳር',
    'ታህሳስ',
    'ጥር',
    'የካቲት',
    'መጋቢት',
    'ሚያዝያ',
    'ግንቦት',
    'ሰኔ',
    'ሐምሌ',
    'ነሐሴ',
    'ጳጉሜ',
  ],
};

const startDayOfEthiopian = (year) => {
  const newYearDay = Math.floor(year / 100) - Math.floor(year / 400) - 4;
  return ((year - 1) % 4 === 3) ? newYearDay + 1 : newYearDay;
};

/**
 * Converts a Gregorian date (G.C.) to Ethiopian date (E.C.)
 * @returns [year, month, day] in Ethiopian Calendar
 */
const toEthiopian = (gYear, gMonth, gDay) => {
  const gregorianMonths = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const ethiopianMonths = [0, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 5];

  if ((gYear % 4 === 0 && gYear % 100 !== 0) || gYear % 400 === 0) {
    gregorianMonths[2] = 29;
  }

  let ethiopianYear = gYear - 8;

  if (ethiopianYear % 4 === 3) {
    ethiopianMonths[13] = 6;
  }

  let until = 0;
  for (let i = 1; i < gMonth; i++) {
    until += gregorianMonths[i];
  }
  until += gDay;

  const newYearDay = startDayOfEthiopian(ethiopianYear);
  let tahissas = (ethiopianYear % 4) === 0 ? 26 : 25;

  if (gYear < 1582) {
    ethiopianMonths[1] = 0;
    ethiopianMonths[2] = tahissas;
  } else if (until <= 277 && gYear === 1582) {
    ethiopianMonths[1] = 0;
    ethiopianMonths[2] = tahissas;
  } else {
    tahissas = newYearDay - 3;
    ethiopianMonths[1] = tahissas;
  }

  let m = 1;
  let ethiopianDate = 0;

  for (m = 1; m < ethiopianMonths.length; m++) {
    if (until <= ethiopianMonths[m]) {
      ethiopianDate = (m === 1 || ethiopianMonths[m] === 0) ? until + (30 - tahissas) : until;
      break;
    } else {
      until -= ethiopianMonths[m];
    }
  }

  if (m > 10) {
    ethiopianYear += 1;
  }

  const order = [0, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 1, 2, 3, 4];
  const ethiopianMonth = order[m];

  return [ethiopianYear, ethiopianMonth, ethiopianDate];
};

/**
 * Formats an Ethiopian calendar date into a localized readable string
 */
const formatEthiopianDate = (year, month, day, locale = 'en') => {
  const monthName = ETHIOPIAN_MONTHS[locale][month - 1] || '';
  if (locale === 'am') {
    return `${monthName} ${day} ቀን ${year} ዓ.ም.`;
  }
  return `${monthName} ${day}, ${year} E.C.`;
};

/**
 * Returns a comprehensive Ethiopian Calendar object from a Gregorian Date
 */
const getEthiopianDateObject = (dateValue) => {
  if (!dateValue) return null;
  const date = new Date(dateValue);
  if (isNaN(date.getTime())) return null;

  const [year, month, day] = toEthiopian(date.getFullYear(), date.getMonth() + 1, date.getDate());
  
  return {
    year,
    month,
    day,
    formatted_en: formatEthiopianDate(year, month, day, 'en'),
    formatted_am: formatEthiopianDate(year, month, day, 'am')
  };
};

module.exports = {
  toEthiopian,
  getEthiopianDateObject
};
