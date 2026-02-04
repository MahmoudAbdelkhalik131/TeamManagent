/**
 * Middleware لتنسيق التواريخ في الـ JSON responses
 * يقوم بتحويل جميع التواريخ إلى ISO format
 */

import { Request, Response, NextFunction } from "express";

export const dateFormatterMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const originalJson = res.json;

  res.json = function (data: any) {
    // تحويل التواريخ في البيانات
    const formattedData = formatDatesInObject(data);
    return originalJson.call(this, formattedData);
  };

  next();
};

/**
 * الدالة المساعدة لتحويل التواريخ بشكل عميق في الـ object
 */
const formatDatesInObject = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return obj;
  }

  // إذا كانت Date object
  if (obj instanceof Date) {
    return obj.toISOString();
  }

  // إذا كان array
  if (Array.isArray(obj)) {
    return obj.map((item) => formatDatesInObject(item));
  }

  // إذا كان plain object
  if (obj && typeof obj === "object") {
    const formatted: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        formatted[key] = formatDatesInObject(obj[key]);
      }
    }
    return formatted;
  }

  return obj;
};

export default dateFormatterMiddleware;
