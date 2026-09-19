# 课堂作业六独立研究记录

三项选做研究全部完成，且均在 `my-dashboard/` 中提供可现场演示的实现。

## 研究一 Promise.all并行请求

主页面使用：

```js
const [books, roomData] = await Promise.all([
  fetchJson("../data/books.json"),
  fetchJson("../data/studyrooms.json")
]);
```

`Promise.all`在两个请求都成功后按传入顺序返回结果；任一请求拒绝时整体立即拒绝，并进入同一个 `catch`。页面的“运行计时实验”按钮对同一组URL分别执行串行与并行请求，并给每个请求加入明确标注的220ms最小教学延迟。本地文件很小，若不增加可控延迟，缓存和线程调度噪声可能大于请求差异。理论上串行总时长接近两个任务之和，并行总时长接近最慢任务。

参考：MDN [`Promise.all()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all)。

## 研究二 ECharts与Chart.js图表联动

自习室柱状图注册 `roomChart.on("click", handler)`。回调参数的 `name` 是柱形所代表的自习室名称；程序据此查找完整记录，更新 `selectedRoomName`，随后重绘Chart.js圆环图、柱形选中样式和表格高亮。点击“查看全部”会清空选中状态。

这一实现把一个库的事件转换为共享应用状态，再让另一个库根据状态更新，避免两个图表直接互相操作造成耦合。

参考：Apache ECharts [Event and Action](https://echarts.apache.org/handbook/en/concepts/event/)。

## 研究三 误导图表修复

真实案例选择2012年Fox Business的“If Bush Tax Cuts Expire”图。图中35%和39.6%的税率被画成高度差异极大的柱形，视觉零点被截断。研究页面没有复制原图，而是说明其设计问题，并使用课程统一的月度借阅总量复现相同的截断纵轴手法，再并排绘制纵轴从0开始的诚实版本。

柱状图用长度编码数值。截断基线会破坏“柱长与数值成比例”的直觉，尤其容易夸大小幅变化。本项目的诚实版本保留完整单位、时间范围和来源，同时把纵轴最小值设为0。若研究局部波动确实需要非零起点，更适合折线图，并必须清楚标注尺度。

真实案例来源：[People’s Graphic Design Archive](https://peoplesgdarchive.org/item/10481/if-bush-tax-cuts-expire-fox-news-infographic)。

## 工具与诚信说明

研究资料、代码组织和测试使用了智能工具辅助；技术结论均对应可运行代码与公开文档。提交者应亲自复现实验、记录本机耗时、完成全屏截图，并确保能够现场解释。

