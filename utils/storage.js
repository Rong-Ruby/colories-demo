// utils/storage.js
// 卡路里记录本地存储模块

const STORAGE_KEY = 'calorie_records';

/**
 * 获取今日日期字符串 YYYY-MM-DD
 */
function getTodayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * 从 Storage 读取全部记录
 * @returns {Object} { '2026-10-28': [...], '2026-10-27': [...] }
 */
function getAll() {
  const data = wx.getStorageSync(STORAGE_KEY);
  if (!data || typeof data !== 'object') {
    return {};
  }
  return data;
}

/**
 * 写入全部记录到 Storage
 * @param {Object} data
 */
function saveAll(data) {
  wx.setStorageSync(STORAGE_KEY, data);
}

/**
 * 添加一条记录
 * @param {string} name   食物名
 * @param {number} calorie 卡路里
 */
function addRecord(name, calorie) {
  const safeCal = Number.isFinite(Number(calorie)) ? Number(calorie) : 0;
  const all = getAll();
  const today = getTodayKey();
  const list = all[today] || [];

  const now = new Date();
  const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  list.push({
    id: Date.now(),
    name: String(name || '未知食物'),
    calorie: safeCal,
    time
  });

  all[today] = list;
  saveAll(all);
  return list;
}

/**
 * 获取指定日期的记录
 * @param {string} dateKey YYYY-MM-DD，不传则取今日
 */
function getRecordsByDate(dateKey) {
  const key = dateKey || getTodayKey();
  const all = getAll();
  return all[key] || [];
}

/**
 * 获取今日总卡路里
 */
function getTodayTotal() {
  const list = getRecordsByDate();
  return list.reduce((sum, item) => sum + (item.calorie || 0), 0);
}

/**
 * 获取最近 7 天的卡路里汇总
 * @returns {Array} [{ date, total }]
 */
function getWeekSummary() {
  const all = getAll();
  const result = [];
  const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const key = `${y}-${m}-${day}`;
    const list = all[key] || [];
    const total = list.reduce((sum, item) => sum + (item.calorie || 0), 0);
    result.push({
      date: key,
      dayName: dayNames[d.getDay()],
      total
    });
  }
  return result;
}

module.exports = {
  getTodayKey,
  getAll,
  addRecord,
  getRecordsByDate,
  getTodayTotal,
  getWeekSummary
};
