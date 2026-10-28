// pages/record/record.js
const storage = require('../../utils/storage.js');
const app = getApp();

Page({
  data: {
    todayTotal: 0,
    dailyGoal: 1500,
    remaining: 0,
    todayList: [],
    weekSummary: [],
    weekAvg: 0
  },

  onShow() {
    this.refresh();
  },

  /**
   * 刷新全部数据
   */
  refresh() {
    const goal = app.globalData.dailyGoal;
    const todayTotal = storage.getTodayTotal();
    const todayList = storage.getRecordsByDate();
    const weekSummary = storage.getWeekSummary();

    // 日均 —— 只统计有摄入的天，或者全部 7 天？用户要"只显示数字"，用 7 天总数/7
    const weekSum = weekSummary.reduce((s, d) => s + d.total, 0);
    const weekAvg = Math.round(weekSum / 7);

    // 剩余目标
    const remaining = goal - todayTotal;

    this.setData({
      dailyGoal: goal,
      todayTotal,
      todayList,
      weekSummary,
      weekAvg,
      remaining: remaining > 0 ? `还剩 ${remaining} kcal` : `已超 ${-remaining} kcal`
    });
  },

  /**
   * 编辑每日目标
   */
  onEditGoal() {
    wx.showModal({
      title: '设置每日目标 (kcal)',
      editable: true,
      placeholderText: String(this.data.dailyGoal),
      success: (res) => {
        if (!res.confirm) return;
        const val = Number(res.content);
        if (!Number.isFinite(val) || val <= 0) {
          wx.showToast({ title: '请输入有效数字', icon: 'none' });
          return;
        }
        app.globalData.dailyGoal = Math.round(val);
        wx.setStorageSync('dailyGoal', Math.round(val));
        this.refresh();
        wx.showToast({ title: '已更新 ✓', icon: 'success' });
      }
    });
  }
});
