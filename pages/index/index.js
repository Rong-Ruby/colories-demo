// pages/index/index.js
const storage = require('../../utils/storage.js');
const { mockScan } = require('../../utils/mockScan.js');

Page({
  data: {
    scanning: false,
    todayTotal: 0,
    modalShow: false,
    modalFoodName: '',
    modalCalorie: 0
  },

  onShow() {
    this.setData({
      todayTotal: storage.getTodayTotal()
    });
  },

  /**
   * 开始识别
   */
  async onStartScan() {
    if (this.data.scanning) return;

    // 先尝试申请摄像头（Mock 模式下其实用不上，但保留真实流程）
    try {
      await new Promise((resolve, reject) => {
        wx.authorize({
          scope: 'scope.camera',
          success: resolve,
          fail: reject
        });
      });
    } catch (e) {
      // 用户未授权或拒绝 —— Mock 模式下仍可继续
      wx.showToast({
        title: '已使用模拟识别',
        icon: 'none',
        duration: 1500
      });
    }

    this.setData({ scanning: true });

    try {
      // Mock 识别
      const result = await mockScan();
      this.setData({
        scanning: false,
        modalShow: true,
        modalFoodName: result.name,
        modalCalorie: Number(result.calorie)
      });
    } catch (err) {
      this.setData({ scanning: false });
      wx.showToast({ title: '识别失败，请重试', icon: 'none' });
    }
  },

  /**
   * 用户确认记录
   */
  onConfirmRecord(e) {
    const { name, calorie } = e.detail;
    storage.addRecord(name, calorie);
    this.setData({
      modalShow: false,
      todayTotal: storage.getTodayTotal()
    });
    wx.showToast({ title: '已记录 ✓', icon: 'success' });
  },

  /**
   * 用户取消
   */
  onConfirmCancel() {
    this.setData({ modalShow: false });
  }
});
