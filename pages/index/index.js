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
    this.loadTodayTotal();
  },

  /**
   * 读取今日总摄入（云数据库优先）
   */
  async loadTodayTotal() {
    const todayTotal = await storage.getTodayTotal();
    this.setData({ todayTotal });
  },

  /**
   * 开始识别：拍摄或从相册选一张食物照片
   */
  async onStartScan() {
    if (this.data.scanning) return;

    let tempFilePath = '';
    try {
      const { tempFiles } = await wx.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sizeType: ['compressed'],
        sourceType: ['camera', 'album']
      });
      tempFilePath = tempFiles[0].tempFilePath;
    } catch (e) {
      // 用户取消拍摄或选择，直接返回
      return;
    }

    this.setData({ scanning: true });

    try {
      const result = await mockScan(tempFilePath);
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
   * 用户确认记录：写入云数据库
   */
  async onConfirmRecord(e) {
    const { name, calorie } = e.detail;
    wx.showLoading({ title: '保存中', mask: true });

    try {
      await storage.addRecord(name, calorie);
      const todayTotal = await storage.getTodayTotal();
      this.setData({
        modalShow: false,
        todayTotal
      });
      wx.hideLoading();
      wx.showToast({ title: '已记录', icon: 'success' });
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: '保存失败，请重试', icon: 'none' });
    }
  },

  /**
   * 用户取消
   */
  onConfirmCancel() {
    this.setData({ modalShow: false });
  }
});
