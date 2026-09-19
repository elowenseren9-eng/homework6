# 软件开发综合实践 课堂作业六

本仓库完成第六次课“jQuery、异步数据与数据可视化”的全部本地实践，包括必做任务、案例选做进阶、三项独立研究以及课后练习。项目使用本地JSON与本地前端库，运行时不依赖外网。

## 作品入口

| 目录 | 作品 | 完成内容 |
|---|---|---|
| `jquery-todo/` | jQuery版课堂任务清单 | 选择器、链式调用、事件委托、筛选、效果、本地存储与容错 |
| `dashboard/` | 图书馆借阅数据看板 | fetch、统计卡片、ECharts柱状图、Chart.js折线图、四状态、jQuery卡片联动 |
| `my-dashboard/` | 校园学习空间数据看板 | 双JSON并行加载、楼宇筛选、搜索、双图表、图表联动、计时实验、误导图修复 |

首页：<http://localhost:8016/>

## 必做要求对照

- [x] 通过fetch加载本地JSON，图书数据72个数值点，自习室数据12条。
- [x] 同时使用ECharts柱状图和Chart.js折线图/圆环图。
- [x] 加载中、成功、失败和空数据四种状态均可直接演示。
- [x] 使用jQuery完成筛选、高亮、表单与事件委托。
- [x] 图表标注标题、单位、时间范围和数据来源。
- [x] 图表类型与目的匹配，柱状图从0开始，避免夸大差异。
- [x] 本地Git仓库包含不少于3次有效提交。
- [x] 已执行页面、交互、异常状态和响应式测试。

## 独立研究

1. `Promise.all`并行加载两个JSON，并提供串行/并行计时按钮。
2. 点击ECharts柱形后，Chart.js圆环图与表格自动联动。
3. 分析2012年Fox Business截断纵轴案例，并用课程借阅数据并排重做错误版与诚实版。

详细记录见 [`research/README.md`](research/README.md)。

## 四状态演示

三个看板均支持URL参数演示：

```text
成功      http://localhost:8016/my-dashboard/
加载中    http://localhost:8016/my-dashboard/?state=loading
失败      http://localhost:8016/my-dashboard/?state=error
空数据    http://localhost:8016/my-dashboard/?state=empty
```

失败模式请求实际不存在的JSON并捕获HTTP 404；空数据模式通过fetch加载仓库中的空数据测试文件，不是只改页面文字。

## 运行和测试

完整启动步骤见 [`RUNNING.md`](RUNNING.md)，重新测试结果见 [`TESTING.md`](TESTING.md)。

## 数据与依赖来源

- `data/books.json`、`data/studyrooms.json`：课程统一教学演示数据。
- jQuery 3.7.1、Apache ECharts 5.6.0、Chart.js 4.4.7：本地保存的压缩发行文件。
- 页面不使用远程字体、远程图片或在线CDN。

## 工具使用说明

本仓库在需求核对、代码整理、自动测试与报告排版过程中使用了智能工具辅助。提交者需要亲自运行、理解、截图并能够解释和修改全部代码；本说明未把成果表述为完全独立手写。

