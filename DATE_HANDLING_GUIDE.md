# دليل التعامل الصحيح مع التواريخ في Project و Task

## 📋 نظرة عامة

تم تحسين معالجة التواريخ في التطبيق بطرق عدة:
1. **Validation** - التحقق من صحة صيغة التاريخ عند الاستقبال
2. **Conversion** - تحويل تلقائي من string إلى Date في MongoDB
3. **Formatting** - تنسيق التواريخ في الـ responses

---

## 🔧 صيغ التواريخ المقبولة

### ISO 8601 Format (الموصى به)
```typescript
// ✅ الصيغ الصحيحة:
"2024-12-31"                    // تاريخ فقط
"2024-12-31T10:30:00Z"         // تاريخ مع وقت (UTC)
"2024-12-31T10:30:00+02:00"    // مع timezone offset
```

### JavaScript Date Format
```typescript
// ✅ يعمل أيضاً:
new Date("2024-12-31")
new Date(1735689600000)  // timestamp
```

---

## 📝 أمثلة الاستخدام

### 1. إنشاء Project مع تاريخ

```bash
# Request Body
POST /api/projects
{
  "name": "Mobile App",
  "description": "iOS and Android",
  "usernameMember": ["user1", "user2"],
  "color": "#FF5733",
  "duration": "2025-12-31"  // أو "2025-12-31T10:30:00Z"
}

# Response (التاريخ يعود بصيغة ISO)
{
  "data": {
    "_id": "507f...",
    "name": "Mobile App",
    "duration": "2025-12-31T00:00:00.000Z",  // ISO Format
    "createdAt": "2024-02-04T10:30:00.000Z",
    "updatedAt": "2024-02-04T10:30:00.000Z"
  }
}
```

### 2. إنشاء Task مع تاريخ

```bash
# Request Body
POST /api/projects/:projectId/tasks
{
  "description": "Design UI mockups",
  "username": "user1",
  "color": "#3498DB",
  "duration": "2025-06-15T14:30:00Z"
}

# Response
{
  "data": {
    "_id": "507f...",
    "name": "Design UI",
    "duration": "2025-06-15T14:30:00.000Z",
    "status": "Pending",
    "createdAt": "2024-02-04T10:30:00.000Z"
  }
}
```

### 3. تحديث Task

```bash
# Request Body - يمكن تحديث التاريخ
PUT /api/projects/:projectId/tasks/:taskId
{
  "duration": "2025-07-20"
}
```

---

## 🔍 استخدام Utility Functions

### في Service أو Middleware:

```typescript
import {
  parseDate,
  formatDateISO,
  formatDateAR,
  getDaysDifference,
  isDatePassed,
  isFutureDate,
  addDays
} from "../utils/dateHandler";

// التحقق من صحة التاريخ
const date = parseDate("2025-12-31");
if (!date) {
  console.log("Invalid date");
}

// حساب المدة بين تاريخين
const days = getDaysDifference(
  new Date("2025-01-01"),
  new Date("2025-12-31")
);
console.log(`${days} days`); // 364 days

// تنسيق التاريخ بالعربية
const arabiDate = formatDateAR(new Date());
// النتيجة: "٤ فبراير ٢٠٢٥ ١٠:٣٠"

// التحقق من أن التاريخ قد مضى
const isPassed = isDatePassed(new Date("2024-01-01"));
console.log(isPassed); // true

// إضافة أيام إلى تاريخ
const futureDate = addDays(new Date(), 7);
```

---

## ⚙️ معالجة التواريخ تلقائياً

### في Schema:

التاريخ يتم تحويله تلقائياً من string إلى Date:

```typescript
// في task.schema.ts و project.schema.ts
duration: { 
  type: Date,
  set: (val: string | Date) => {
    // تحويل string إلى Date تلقائياً
    if (typeof val === 'string') {
      const date = new Date(val);
      return isNaN(date.getTime()) ? null : date;
    }
    return val;
  }
}
```

---

## ✔️ معايير التحقق من التواريخ

### Task Duration:
- ✅ يجب أن يكون تاريخ صحيح
- ❌ فارغ أو null غير مقبول عند الإنشاء
- ✅ يمكن أن يكون فارغ عند التحديث (optional)

### Project Duration:
- ✅ يجب أن يكون تاريخ صحيح
- ❌ فارغ أو null غير مقبول عند الإنشاء
- ✅ يمكن أن يكون فارغ عند التحديث (optional)

---

## 🚨 معالجة الأخطاء

### خطأ صيغة التاريخ:

```typescript
// Invalid format
POST /api/projects
{
  "duration": "31-12-2025"  // ❌ خطأ!
}

// Response:
{
  "errors": [
    {
      "msg": "Invalid date format. Use ISO format: YYYY-MM-DD or 2024-12-31T10:30:00Z",
      "param": "duration"
    }
  ]
}
```

---

## 📚 الملفات المعدلة

| الملف | الوصف |
|------|-------|
| `src/utils/dateHandler.ts` | دوال مساعدة للتعامل مع التواريخ |
| `src/middlewares/dateFormatter.ts` | middleware لتنسيق التواريخ في responses |
| `src/Task/task.validation.ts` | تحديث التحقق من تاريخ Task |
| `src/Task/task.schema.ts` | إضافة conversion function |
| `src/Project/project.validation.ts` | تحديث التحقق من تاريخ Project |
| `src/Project/project.schema.ts` | إضافة conversion function |
| `main.ts` | تفعيل dateFormatter middleware |

---

## 💡 أفضل الممارسات

1. **استخدم ISO 8601** دائماً عند إرسال التواريخ من Frontend
2. **تفعيل Timezone**:
   ```typescript
   "2025-12-31T10:30:00+02:00"  // بدلاً من
   "2025-12-31T10:30:00Z"
   ```

3. **في Frontend** - استخدم مكتبة مثل `dayjs` أو `date-fns`:
   ```javascript
   import dayjs from 'dayjs';
   const date = dayjs().format('YYYY-MM-DD');
   ```

4. **عند العرض** - استخدم دوال مثل:
   ```typescript
   formatDateAR(new Date())  // للعربية
   formatDateISO(new Date()) // للـ API
   ```

---

## 🔗 المراجع

- [JavaScript Date Documentation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date)
- [ISO 8601 Format](https://en.wikipedia.org/wiki/ISO_8601)
- [MongoDB Date Type](https://docs.mongodb.com/manual/reference/bson-type-comparison-order/#date)
