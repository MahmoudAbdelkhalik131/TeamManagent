/**
 * التعامل الصحيح مع التواريخ في Application
 */

/**
 * تحويل string إلى Date object مع التحقق
 * @param dateString - التاريخ بصيغة string
 * @returns Date object أو null إذا كانت البيانات غير صحيحة
 */
export const parseDate = (dateString: string | Date): Date | null => {
  if (!dateString) return null;

  // إذا كان بالفعل Date object
  if (dateString instanceof Date) {
    return isValidDate(dateString) ? dateString : null;
  }

  // تحويل string إلى Date
  const date = new Date(dateString);
  return isValidDate(date) ? date : null;
};

/**
 * التحقق من صحة التاريخ
 */
export const isValidDate = (date: Date): boolean => {
  return date instanceof Date && !isNaN(date.getTime());
};

/**
 * تنسيق التاريخ للعرض (ISO Format)
 */
export const formatDateISO = (date: Date | null): string | null => {
  if (!date) return null;
  const validDate = date instanceof Date ? date : new Date(date);
  return isValidDate(validDate) ? validDate.toISOString() : null;
};

/**
 * تنسيق التاريخ بالعربية
 */
export const formatDateAR = (date: Date | null): string | null => {
  if (!date) return null;
  const validDate = date instanceof Date ? date : new Date(date);
  if (!isValidDate(validDate)) return null;

  return validDate.toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * حساب المدة بين تاريخين (بالأيام)
 */
export const getDaysDifference = (
  startDate: Date,
  endDate: Date,
): number | null => {
  const start = startDate instanceof Date ? startDate : new Date(startDate);
  const end = endDate instanceof Date ? endDate : new Date(endDate);

  if (!isValidDate(start) || !isValidDate(end)) return null;

  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * التحقق من تجاوز التاريخ (قد مضى)
 */
export const isDatePassed = (date: Date): boolean => {
  const checkDate = date instanceof Date ? date : new Date(date);
  return isValidDate(checkDate) && checkDate < new Date();
};

/**
 * التحقق من أن التاريخ في المستقبل
 */
export const isFutureDate = (date: Date): boolean => {
  const checkDate = date instanceof Date ? date : new Date(date);
  return isValidDate(checkDate) && checkDate > new Date();
};

/**
 * إضافة أيام إلى تاريخ
 */
export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};
