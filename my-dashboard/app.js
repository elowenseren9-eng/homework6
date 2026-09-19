"use strict";

const DATA_URLS = {
  books: "../data/books.json",
  rooms: "../data/studyrooms.json",
  emptyBooks: "../data/books-empty.json",
  emptyRooms: "../data/studyrooms-empty.json"
};

const mode = new URLSearchParams(window.location.search).get("state") || "success";
const appState = {
  books: null,
  rooms: [],
  building: "全部",
  query: "",
  selectedRoomName: null
};

let roomChart = null;
let seatChart = null;
let misleadingChart = null;
let honestChart = null;

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const fetchJson = async (url) => {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`HTTP ${response.status}：${url.split("/").pop()}`);
  return response.json();
};

const validateBooks = (data) => (
  data && Array.isArray(data.months) && Array.isArray(data.series)
  && data.series.every((item) => typeof item.category === "string" && Array.isArray(item.counts))
);

const validateRooms = (data) => (
  data && Array.isArray(data.rooms)
  && data.rooms.every((room) => (
    typeof room.name === "string" && typeof room.building === "string"
    && Number.isFinite(room.seats) && Number.isFinite(room.occupied)
    && room.occupied >= 0 && room.occupied <= room.seats
  ))
);

const setStatus = (type, title, detail) => {
  $("#status")
    .removeClass("is-error is-empty")
    .addClass(type === "error" ? "is-error" : type === "empty" ? "is-empty" : "")
    .prop("hidden", false);
  $("#status-title").text(title);
  $("#status-detail").text(detail);
  $("#retry-button").prop("hidden", type !== "error");
};

const occupancyRate = (room) => room.seats === 0 ? 0 : Math.round((room.occupied / room.seats) * 100);
const availableSeats = (room) => room.status === "开放" ? Math.max(0, room.seats - room.occupied) : 0;

const filteredRooms = () => appState.rooms.filter((room) => {
  const matchesBuilding = appState.building === "全部" || room.building === appState.building;
  const matchesQuery = room.name.toLocaleLowerCase("zh-CN").includes(appState.query.toLocaleLowerCase("zh-CN"));
  return matchesBuilding && matchesQuery;
});

const renderFilters = () => {
  const buildings = ["全部", ...new Set(appState.rooms.map((room) => room.building))];
  const $filters = $("#building-filters").empty();
  buildings.forEach((building) => {
    $("<button>", {
      type: "button",
      class: `filter-button${building === appState.building ? " is-active" : ""}`,
      "data-building": building,
      "aria-pressed": String(building === appState.building),
      text: building
    }).appendTo($filters);
  });
};

const renderMetrics = (rooms) => {
  const openRooms = rooms.filter((room) => room.status === "开放");
  const totalSeats = rooms.reduce((sum, room) => sum + room.seats, 0);
  const available = openRooms.reduce((sum, room) => sum + availableSeats(room), 0);
  $("#metric-rooms").text(rooms.length);
  $("#metric-open").text(openRooms.length);
  $("#metric-seats").text(totalSeats.toLocaleString("zh-CN"));
  $("#metric-available, #hero-availability").text(available.toLocaleString("zh-CN"));
};

const barColor = (room) => {
  if (room.status !== "开放") return "#c6c9c7";
  const rate = occupancyRate(room);
  if (rate >= 90) return "#ff7d61";
  if (rate >= 75) return "#ffd166";
  return "#73ded0";
};

const renderRoomChart = (rooms) => {
  if (!roomChart) roomChart = echarts.init(document.querySelector("#room-chart"), null, { renderer: "canvas" });
  roomChart.setOption({
    animationDuration: 450,
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      formatter: (items) => {
        const room = rooms[items[0].dataIndex];
        return [
          `<strong>${room.name}</strong>`,
          `状态：${room.status}`,
          `占用率：${occupancyRate(room)}%`,
          `座位：${room.occupied} / ${room.seats}`
        ].join("<br>");
      }
    },
    grid: { left: 55, right: 18, top: 22, bottom: 105 },
    xAxis: {
      type: "category",
      data: rooms.map((room) => room.name),
      axisLabel: { interval: 0, rotate: 38, width: 110, overflow: "truncate", fontSize: 10 },
      axisTick: { alignWithLabel: true }
    },
    yAxis: {
      type: "value",
      min: 0,
      max: 100,
      name: "占用率（%）",
      axisLabel: { formatter: "{value}%" }
    },
    series: [{
      name: "占用率",
      type: "bar",
      barMaxWidth: 34,
      data: rooms.map((room) => ({
        name: room.name,
        value: occupancyRate(room),
        itemStyle: {
          color: room.name === appState.selectedRoomName ? "#9182ff" : barColor(room),
          borderColor: room.name === appState.selectedRoomName ? "#101716" : "transparent",
          borderWidth: room.name === appState.selectedRoomName ? 2 : 0,
          borderRadius: [7, 7, 0, 0]
        }
      }))
    }]
  }, true);

  roomChart.off("click");
  roomChart.on("click", (params) => {
    if (params.componentType === "series") selectRoom(params.name);
  });
};

const seatComposition = (rooms) => {
  const openRooms = rooms.filter((room) => room.status === "开放");
  const occupied = openRooms.reduce((sum, room) => sum + room.occupied, 0);
  const available = openRooms.reduce((sum, room) => sum + availableSeats(room), 0);
  return { occupied, available, labels: ["已占用", "可用"] };
};

const renderSeatChart = (rooms) => {
  const selected = appState.rooms.find((room) => room.name === appState.selectedRoomName);
  let values;
  let labels;
  if (selected) {
    const unavailable = selected.status === "开放" ? availableSeats(selected) : selected.seats;
    values = [selected.occupied, unavailable];
    labels = selected.status === "开放" ? ["已占用", "可用"] : ["已占用", "暂不可用"];
    $("#seat-chart-title").text(selected.name);
    $("#linkage-note").text(`${selected.status} · ${selected.hours} · 占用率 ${occupancyRate(selected)}%`);
  } else {
    const summary = seatComposition(rooms);
    values = [summary.occupied, summary.available];
    labels = summary.labels;
    $("#seat-chart-title").text(`${appState.building}范围座位构成`);
    $("#linkage-note").text("点击左侧柱状图，查看单个自习室。 ");
  }

  if (seatChart) seatChart.destroy();
  seatChart = new Chart(document.querySelector("#seat-chart"), {
    type: "doughnut",
    data: {
      labels,
      datasets: [{ data: values, backgroundColor: ["#ff936b", "#c9f55d"], borderColor: "#101716", borderWidth: 5 }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "68%",
      plugins: {
        legend: { position: "bottom", labels: { color: "#ffffff", usePointStyle: true, boxWidth: 10 } },
        tooltip: { callbacks: { label: (context) => `${context.label}：${context.raw} 个座位` } }
      }
    }
  });
};

const renderTable = (rooms) => {
  const $body = $("#room-table").empty();
  $("#table-empty").prop("hidden", rooms.length !== 0);
  rooms.forEach((room) => {
    const remaining = availableSeats(room);
    const $row = $("<tr>", {
      "data-room": room.name,
      class: room.name === appState.selectedRoomName ? "is-selected" : ""
    });
    const values = [room.name, room.building, room.hours];
    values.forEach((value) => $("<td>").text(value).appendTo($row));
    $("<td>").append(
      $("<span>", {
        class: `status-pill${room.status === "开放" ? "" : " is-closed"}`,
        text: room.status
      })
    ).appendTo($row);
    [room.seats, room.occupied, remaining].forEach((value) => $("<td>").text(value).appendTo($row));
    $("<td>", { class: "rate", text: `${occupancyRate(room)}%` }).appendTo($row);
    $row.appendTo($body);
  });
};

const renderDashboard = () => {
  const rooms = filteredRooms();
  if (appState.selectedRoomName && !rooms.some((room) => room.name === appState.selectedRoomName)) {
    appState.selectedRoomName = null;
  }
  renderFilters();
  renderMetrics(rooms);
  renderRoomChart(rooms);
  renderSeatChart(rooms);
  renderTable(rooms);
};

const selectRoom = (name) => {
  appState.selectedRoomName = name;
  renderDashboard();
  const row = document.querySelector(`[data-room="${CSS.escape(name)}"]`);
  if (row) row.scrollIntoView({ behavior: "smooth", block: "nearest" });
};

const renderIntegrityCharts = (books) => {
  const totals = books.months.map((_, monthIndex) => (
    books.series.reduce((sum, series) => sum + series.counts[monthIndex], 0)
  ));
  const minimum = Math.min(...totals);
  const shared = {
    tooltip: { trigger: "axis" },
    grid: { left: 52, right: 15, top: 26, bottom: 42 },
    xAxis: { type: "category", data: books.months, axisLabel: { interval: 1 } },
    series: [{ type: "bar", data: totals, itemStyle: { color: "#9182ff", borderRadius: [5, 5, 0, 0] } }]
  };
  if (!misleadingChart) misleadingChart = echarts.init(document.querySelector("#misleading-chart"));
  if (!honestChart) honestChart = echarts.init(document.querySelector("#honest-chart"));
  misleadingChart.setOption({
    ...shared,
    yAxis: { type: "value", min: Math.floor(minimum * .94), name: "册" }
  });
  honestChart.setOption({
    ...shared,
    yAxis: { type: "value", min: 0, name: "册" }
  });
};

const showSuccess = (books, roomData, elapsed) => {
  appState.books = books;
  appState.rooms = roomData.rooms;
  $("#status").prop("hidden", true);
  $("#dashboard-content").prop("hidden", false);
  $("#success-detail").text(`全部完成：books.json 与 studyrooms.json 已并行加载并校验，共 ${books.months.length * books.series.length} 个借阅数据点、${roomData.rooms.length} 个自习空间；耗时 ${elapsed.toFixed(1)} ms。`);
  requestAnimationFrame(() => {
    renderDashboard();
    renderIntegrityCharts(books);
  });
};

const loadData = async () => {
  $("#dashboard-content").prop("hidden", true);
  setStatus("loading", "加载中", "正在通过 Promise.all 并行请求 books.json 与 studyrooms.json…");
  if (mode === "loading") {
    $("#status-detail").text("加载状态演示已保持；点击顶部“成功”返回正常页面。 ");
    return;
  }

  const bookUrl = mode === "error" ? "../data/missing-books.json" : mode === "empty" ? DATA_URLS.emptyBooks : DATA_URLS.books;
  const roomUrl = mode === "error" ? "../data/missing-rooms.json" : mode === "empty" ? DATA_URLS.emptyRooms : DATA_URLS.rooms;
  const startedAt = performance.now();
  try {
    const [books, roomData] = await Promise.all([fetchJson(bookUrl), fetchJson(roomUrl)]);
    if (!validateBooks(books) || !validateRooms(roomData)) throw new TypeError("JSON结构不符合预期");
    if (books.series.length === 0 || roomData.rooms.length === 0) {
      setStatus("empty", "暂无数据", "两个请求均成功，但至少一个数据集为空。界面没有用空图表冒充结果。 ");
      return;
    }
    showSuccess(books, roomData, performance.now() - startedAt);
  } catch (error) {
    console.warn("学习空间数据加载失败。", error);
    setStatus("error", "加载失败", `请求或解析没有完成：${error.message}。恢复网络后可重试。`);
  }
};

const requestWithTeachingDelay = async (url, minimumDelay = 220) => {
  const cacheBuster = `${url}${url.includes("?") ? "&" : "?"}bench=${Date.now()}-${Math.random()}`;
  const [data] = await Promise.all([fetchJson(cacheBuster), sleep(minimumDelay)]);
  return data;
};

const runBenchmark = async () => {
  const $button = $("#run-benchmark").prop("disabled", true).text("计时中…");
  $("#benchmark-summary").text("正在使用同一组URL执行串行与并行请求…");
  try {
    let start = performance.now();
    await requestWithTeachingDelay(DATA_URLS.books);
    await requestWithTeachingDelay(DATA_URLS.rooms);
    const serial = performance.now() - start;

    start = performance.now();
    await Promise.all([
      requestWithTeachingDelay(DATA_URLS.books),
      requestWithTeachingDelay(DATA_URLS.rooms)
    ]);
    const parallel = performance.now() - start;

    $("#serial-time").text(`${serial.toFixed(1)} ms`);
    $("#parallel-time").text(`${parallel.toFixed(1)} ms`);
    const saved = serial - parallel;
    $("#benchmark-summary").text(`本次并行比串行少用 ${Math.max(0, saved).toFixed(1)} ms。最慢请求决定 Promise.all 的总时长；本地小文件结果会受缓存和调度影响。`);
    console.table([{ mode: "串行", milliseconds: serial }, { mode: "并行", milliseconds: parallel }]);
  } catch (error) {
    $("#benchmark-summary").text(`计时失败：${error.message}`);
  } finally {
    $button.prop("disabled", false).text("再次运行计时实验");
  }
};

$("#building-filters").on("click", ".filter-button", function () {
  appState.building = $(this).data("building");
  appState.selectedRoomName = null;
  renderDashboard();
});

$("#room-search").on("input", function () {
  appState.query = $(this).val().trim();
  appState.selectedRoomName = null;
  renderDashboard();
});

$("#reset-linkage").on("click", () => {
  appState.selectedRoomName = null;
  renderDashboard();
});

// 表格行提供同一联动入口，便于键盘与自动化检查；柱状图仍通过ECharts click事件触发。
$("#room-table").on("click", "tr[data-room]", function () {
  selectRoom($(this).data("room"));
});

$("#run-benchmark").on("click", runBenchmark);
$("#refresh-button").on("click", loadData);
$("#retry-button").on("click", () => {
  if (mode === "error") window.location.href = "./";
  else loadData();
});

window.addEventListener("resize", () => {
  [roomChart, misleadingChart, honestChart].forEach((chart) => chart?.resize());
});

loadData();
