// app.js
App({
  globalData: {
    // 每日目标卡路里，默认 1500，用户可在记录页自定义
    dailyGoal: 1500
  },

  onLaunch() {
    // 初始化云开发：不传 env 时使用默认环境，多环境请改为 wx.cloud.init({ env: '环境ID' })
    if (wx.cloud) {
      wx.cloud.init({ traceUser: true });
    } else {
      console.warn('当前基础库不支持云开发，数据会退回本地存储');
    }

    // 读取用户自定义的每日目标
    const saved = Number(wx.getStorageSync('dailyGoal'));
    if (Number.isFinite(saved) && saved > 0) {
      this.globalData.dailyGoal = Math.round(saved);
    }
  }
});
