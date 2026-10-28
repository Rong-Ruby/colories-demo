// components/confirm-modal/confirm-modal.js
Component({
  properties: {
    show: {
      type: Boolean,
      value: false
    },
    // 食物名
    foodName: {
      type: String,
      value: ''
    },
    // 卡路里（Number）
    calorie: {
      type: Number,
      value: 0
    }
  },

  methods: {
    onRecord() {
      this.triggerEvent('record', {
        name: this.data.foodName,
        calorie: this.data.calorie
      });
    },
    onCancel() {
      this.triggerEvent('cancel');
    }
  }
});
