# 运行说明

## 环境

- Windows 10或Windows 11
- Chrome或Edge
- Python 3
- 不需要安装npm包，不需要数据库，运行时不需要互联网

## 启动

在PowerShell执行：

```powershell
Set-Location 'D:\各科作业\软件开发\six\homework6'
py -m http.server 8016
```

浏览器打开 <http://localhost:8016/>。不要直接双击HTML文件，因为浏览器会限制 `file://` 页面使用fetch读取本地JSON。

完成检查后回到服务器窗口按 `Ctrl+C` 停止。

## 直接入口

- 作品首页：<http://localhost:8016/>
- jQuery任务清单：<http://localhost:8016/jquery-todo/>
- 图书馆案例看板：<http://localhost:8016/dashboard/>
- 校园学习空间看板：<http://localhost:8016/my-dashboard/>
- 研究记录：打开仓库中的 `research/README.md`

## 四状态截图

访问自主看板的以下地址：

```text
加载中  http://localhost:8016/my-dashboard/?state=loading
成功    http://localhost:8016/my-dashboard/
失败    http://localhost:8016/my-dashboard/?state=error
空数据  http://localhost:8016/my-dashboard/?state=empty
```

若教师要求真实断网证据：先保持成功页面打开，按F12进入Network，切换Offline，然后点击页面“重新加载”或在Console执行 `location.reload()`；恢复Online后再继续。

## 常见问题

- 页面打开但一直失败：确认地址是 `http://localhost:8016/`，不是磁盘文件地址。
- 端口被占用：把启动命令和所有地址中的8016统一改为8017。
- 图表空白：先检查Console和Network，再确认库文件与JSON请求均为200。
- 想恢复默认状态：删除网址问号后的参数并刷新。

