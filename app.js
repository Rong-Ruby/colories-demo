// app.js
App({
  globalData: {
    // 每日目标卡路里，默认 1500，用户可在记录页自定义
    dailyGoal: 1500
  },

  onLaunch() {
    // 读取用户自定义的每日目标
    const saved = wx.getStorageSync('dailyGoal');
    if (saved && Number.isFinite(Number(saved))) {
      this.globalData.dailyGoal = Number(saved);
    }
  }
});
