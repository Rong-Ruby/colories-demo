// utils/mockScan.js
// Mock 食物识别 — 模拟 AI 返回结果

const FOOD_DB = [
  { name: '苹果', calorie: 52 },
  { name: '香蕉', calorie: 89 },
  { name: '橙子', calorie: 47 },
  { name: '米饭(一碗)', calorie: 232 },
  { name: '鸡蛋', calorie: 78 },
  { name: '牛奶(250ml)', calorie: 150 },
  { name: '吐司面包', calorie: 80 },
  { name: '鸡胸肉(100g)', calorie: 165 },
  { name: '西兰花(100g)', calorie: 34 },
  { name: '三文鱼(100g)', calorie: 208 },
  { name: '番茄', calorie: 18 },
  { name: '黄瓜', calorie: 16 },
  { name: '面条(一碗)', calorie: 280 },
  { name: '饺子(5个)', calorie: 250 },
  { name: '可乐(330ml)', calorie: 139 },
  { name: '薯片(100g)', calorie: 536 },
  { name: '蛋糕(1块)', calorie: 350 },
  { name: '酸奶(200g)', calorie: 144 }
];

/**
 * 模拟识别过程，随机返回一个食物
 * 实际接入时替换为：wx.chooseMedia → 调后端 AI 接口 → 返回 { name, calorie }
 */
function mockScan() {
  return new Promise((resolve) => {
    // 模拟识别耗时 1.2 秒
    setTimeout(() => {
      const idx = Math.floor(Math.random() * FOOD_DB.length);
      const food = FOOD_DB[idx];
      resolve({
        name: food.name,
        calorie: Number(food.calorie)
      });
    }, 1200);
  });
}

module.exports = {
  mockScan
};
