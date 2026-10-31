// utils/storage.js
// 数据层：优先读写微信云开发数据库，云端不可用时自动退回本地 Storage

const COLLECTION = 'records';
const LOCAL_KEY = 'calorie_records';
const DAY_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

// null：尚未判断；true：云端可用；false：已退回本地
let cloudState = null;
let database = null;

function db() {
  if (!database) {
    database = wx.cloud.database();
  }
  return database;
}

/**
 * 把日期转成 YYYY-MM-DD
 * @param {Date} date
 */
function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * 获取今日日期字符串 YYYY-MM-DD
 */
function getTodayKey() {
  return formatDate(new Date());
}

/**
 * 当前时间的 HH:mm
 */
function currentTime() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

/**
 * 最近 7 天（含今天）的日期与星期
 */
function buildDays() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({ date: formatDate(d), dayName: DAY_NAMES[d.getDay()] });
  }
  return days;
}

/* ---------------- 云端实现 ---------------- */

function mapDoc(doc) {
  return {
    id: doc._id,
    name: doc.name,
    calorie: doc.calorie,
    time: doc.time
  };
}

async function cloudList(dateKey) {
  const { data } = await db()
    .collection(COLLECTION)
    .where({ dateKey })
    .orderBy('createdAt', 'desc')
    .limit(20)
    .get();
  return data.map(mapDoc);
}

async function cloudAdd(name, calorie) {
  await db().collection(COLLECTION).add({
    data: {
      name,
      calorie,
      dateKey: getTodayKey(),
      time: currentTime(),
      createdAt: db().serverDate()
    }
  });
}

async function cloudRemove(id) {
  const res = await db().collection(COLLECTION).doc(String(id)).remove();
  return res.stats.removed > 0;
}

async function cloudTotal(dateKey) {
  const $ = db().command.aggregate;
  const { list } = await db()
    .collection(COLLECTION)
    .aggregate()
    .match({ dateKey })
    .group({ _id: null, total: $.sum('$calorie') })
    .end();
  return list.length ? list[0].total : 0;
}

async function cloudWeek() {
  const days = buildDays();
  const $ = db().command.aggregate;
  const { list } = await db()
    .collection(COLLECTION)
    .aggregate()
    .match({ dateKey: db().command.in(days.map((d) => d.date)) })
    .group({ _id: '$dateKey', total: $.sum('$calorie') })
    .end();

  const totals = {};
  list.forEach((item) => {
    totals[item._id] = item.total;
  });

  return days.map((d) => ({ date: d.date, dayName: d.dayName, total: totals[d.date] || 0 }));
}

/* ---------------- 本地兜底实现 ---------------- */

function localAll() {
  const data = wx.getStorageSync(LOCAL_KEY);
  return data && typeof data === 'object' ? data : {};
}

function localSave(all) {
  wx.setStorageSync(LOCAL_KEY, all);
}

function localList(dateKey) {
  return (localAll()[dateKey] || []).map((item) => ({ ...item }));
}

function localAdd(name, calorie) {
  const all = localAll();
  const today = getTodayKey();
  const list = all[today] || [];

  list.push({
    // 毫秒时间戳 + 随机后缀，避免同一毫秒内重复
    id: `${Date.now()}${Math.random().toString(36).slice(2, 5)}`,
    name,
    calorie,
    time: currentTime()
  });

  all[today] = list;
  localSave(all);
  return list;
}

function localRemove(id, dateKey) {
  const all = localAll();
  const list = all[dateKey] || [];
  const next = list.filter((item) => String(item.id) !== String(id));

  if (next.length === list.length) {
    return false;
  }

  all[dateKey] = next;
  localSave(all);
  return true;
}

function localTotal(dateKey) {
  return (localAll()[dateKey] || []).reduce((sum, item) => sum + (item.calorie || 0), 0);
}

function localWeek() {
  const all = localAll();
  return buildDays().map((d) => ({
    date: d.date,
    dayName: d.dayName,
    total: (all[d.date] || []).reduce((sum, item) => sum + (item.calorie || 0), 0)
  }));
}

/* ---------------- 对外接口 ---------------- */

async function run(cloudFn, localFn) {
  if (cloudState !== false) {
    try {
      const result = await cloudFn();
      cloudState = true;
      return result;
    } catch (err) {
      cloudState = false;
      console.warn('[storage] 云数据库不可用，已退回本地存储：', (err && err.errMsg) || err);
    }
  }
  return localFn();
}

/**
 * 添加一条记录
 * @param {string} name   食物名
 * @param {number} calorie 卡路里
 */
function addRecord(name, calorie) {
  const safeName = String(name || '未知食物');
  const safeCal = Number.isFinite(Number(calorie)) ? Number(calorie) : 0;
  return run(
    () => cloudAdd(safeName, safeCal),
    () => localAdd(safeName, safeCal)
  );
}

/**
 * 删除一条记录
 * @param {string|number} id 记录 id
 * @param {string} dateKey YYYY-MM-DD，不传则取今日
 */
function deleteRecord(id, dateKey) {
  const key = dateKey || getTodayKey();
  return run(
    () => cloudRemove(id),
    () => localRemove(id, key)
  );
}

/**
 * 获取指定日期的记录
 * @param {string} dateKey YYYY-MM-DD，不传则取今日
 */
function getRecordsByDate(dateKey) {
  const key = dateKey || getTodayKey();
  return run(
    () => cloudList(key),
    () => localList(key)
  );
}

/**
 * 获取今日总卡路里
 */
function getTodayTotal() {
  const key = getTodayKey();
  return run(
    () => cloudTotal(key),
    () => localTotal(key)
  );
}

/**
 * 获取最近 7 天（含今天）的卡路里汇总
 * @returns {Promise<Array>} [{ date, dayName, total }]
 */
function getWeekSummary() {
  return run(cloudWeek, localWeek);
}

/**
 * 是否已连接云数据库（未判断完成时按云端处理，避免误报）
 */
function isCloudMode() {
  return cloudState !== false;
}

module.exports = {
  getTodayKey,
  addRecord,
  deleteRecord,
  getRecordsByDate,
  getTodayTotal,
  getWeekSummary,
  isCloudMode
};
