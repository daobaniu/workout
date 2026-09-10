export function suggestDailyMeals(options: {
  remainingCalories: number;
  preferenceNote?: string;
}) {
  const remaining = Math.max(options.remainingCalories, 400);
  const breakfast = Math.round(remaining * 0.25);
  const lunch = Math.round(remaining * 0.35);
  const dinner = Math.round(remaining * 0.3);
  const snack = Math.max(remaining - breakfast - lunch - dinner, 0);

  const note = options.preferenceNote?.trim();

  return {
    totalTarget: remaining,
    preferenceNote: note || null,
    meals: [
      {
        name: "早餐",
        calories: breakfast,
        ideas: ["燕麦 + 鸡蛋 + 水果", "全麦面包 + 希腊酸奶 + 香蕉"],
      },
      {
        name: "午餐",
        calories: lunch,
        ideas: ["鸡胸/鱼肉 + 米饭 + 蔬菜", "牛肉生菜卷 + 土豆"],
      },
      {
        name: "晚餐",
        calories: dinner,
        ideas: ["虾仁豆腐 + 杂粮饭 + 青菜", "鸡腿去皮 + 西兰花 + 少量主食"],
      },
      ...(snack > 80
        ? [
            {
              name: "加餐",
              calories: snack,
              ideas: ["原味坚果一小把", "无糖酸奶", "水果"],
            },
          ]
        : []),
    ],
    tips: [
      "优先保证蛋白质；主食可按饥饿感微调",
      "这是可执行的家常建议，热量是粗估",
      note ? `已参考偏好：${note}` : "无特殊偏好时可按上述轮换",
    ],
  };
}
