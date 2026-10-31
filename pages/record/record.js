// pages/record/record.js
const storage = require('../../utils/storage.js');
const app = getApp();

Page({
  data: {
    todayTotal: 0,
    dailyGoal: 1500,
    remaining: '',
    todayList: [],
    weekSummary: [],
    weekDays: 0,
    weekAvg: 0,
    overGoal: false,
    cloudMode: true
  },

  onShow() {
    this.refresh();
  },

  /**
   * 刷新全部数据（云数据库优先）
   */
  async refresh() {
    const goal = app.globalData.dailyGoal;
    const [todayTotal, todayList, weekSummary] = await Promise.all([
      storage.getTodayTotal(),
      storage.getRecordsByDate(),
      storage.getWeekSummary()
    ]);

    // 日均按「有记录的天数」计算，避免空白天数把平均值拉低
    const weekSum = weekSummary.reduce((sum, d) => sum + d.total, 0);
    const weekDays = weekSummary.filter((d) => d.total > 0).length;
    const weekAvg = weekDays ? Math.round(weekSum / weekDays) : 0;

    const diff = goal - todayTotal;
    let remaining = '';
    if (diff > 0) {
      remaining = `距目标还差 ${diff} kcal`;
    } else if (diff < 0) {
      remaining = `已超出目标 ${-diff} kcal`;
    } else {
      remaining = '已达到今日目标';
    }

    this.setData({
      dailyGoal: goal,
      todayTotal,
      todayList,
      weekSummary,
      weekDays,
      weekAvg,
      remaining,
      overGoal: diff < 0,
      cloudMode: storage.isCloudMode()
    });
  },

  /**
   * 长按删除一条今日记录
   */
  onDeleteRecord(e) {
    const { id, name } = e.currentTarget.dataset;
    wx.showModal({
      title: '删除这条记录？',
      content: `「${name}」将不会计入今日摄入`,
      confirmText: '删除',
      confirmColor: '#E64340',
      success: async (res) => {
        if (!res.confirm) return;
        wx.showLoading({ title: '删除中', mask: true });
        try {
          await storage.deleteRecord(id);
          wx.hideLoading();
          this.refresh();
          wx.showToast({ title: '已删除', icon: 'none' });
        } catch (err) {
          wx.hideLoading();
          wx.showToast({ title: '删除失败，请重试', icon: 'none' });
        }
      }
    });
  },

  /**
   * 编辑每日目标
   */
  onEditGoal() {
    wx.showModal({
      title: '设置每日目标',
      editable: true,
      placeholderText: `当前 ${this.data.dailyGoal} kcal`,
      success: (res) => {
        if (!res.confirm) return;
        const val = Math.round(Number(res.content));
        if (!Number.isFinite(val) || val <= 0 || val > 9999) {
          wx.showToast({ title: '请输入 1-9999 的数字', icon: 'none' });
          return;
        }
        app.globalData.dailyGoal = val;
        wx.setStorageSync('dailyGoal', val);
        this.refresh();
        wx.showToast({ title: '目标已更新', icon: 'success' });
      }
    });
  }
});
