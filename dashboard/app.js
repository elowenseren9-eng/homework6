"use strict";

const palette = ["#c8f460", "#8e80ff", "#75ded9", "#ff8d6a", "#ffd166", "#6fa8ff"];
const pageMode = new URLSearchParams(window.location.search).get("state") || "success";

let barChart = null;
let lineChart = null;
let loadedData = null;

const setStatus = (type, title, detail) => {
  const $status = $("#status")
    .removeClass("is-error is-empty")
    .addClass(type === "error" ? "is-error" : type === "empty" ? "is-empty" : "");
  $("#status-title").text(title);
  $("#status-detail").text(detail);
  $("#retry-button").prop("hidden", type !== "error");
  $status.prop("hidden", false);
};

const fetchJson = async (url) => {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
};

const renderCards = (data) => {
  const $cards = $("#cards").empty();
  data.series.forEach((series) => {
    const total = series.counts.reduce((sum, value) => sum + value, 0);
    $("<article>", { class: "metric-card", "data-category": series.category, tabindex: 0 })
      .append(
        $("<h3>").text(series.category),
        $("<strong>").text(total.toLocaleString("zh-CN")),
        $("<span>").text(`${data.months.length}个月累计 · 册`)
      )
      .appendTo($cards);
  });
};

const renderBarChart = (data) => {
  if (!barChart) barChart = echarts.init(document.querySelector("#bar-chart"), null, { renderer: "canvas" });
  barChart.setOption({
    backgroundColor: "transparent",
    color: palette,
    tooltip: { trigger: "axis" },
    legend: { bottom: 0, textStyle: { color: "#ffffff" } },
    grid: { left: 52, right: 18, top: 25, bottom: 65 },
    xAxis: {
      type: "category",
      data: data.months,
      axisLabel: { color: "rgba(255,255,255,.72)" },
      axisLine: { lineStyle: { color: "rgba(255,255,255,.3)" } }
    },
    yAxis: {
      type: "value",
      name: "册",
      min: 0,
      nameTextStyle: { color: "rgba(255,255,255,.7)" },
      axisLabel: { color: "rgba(255,255,255,.72)" },
      splitLine: { lineStyle: { color: "rgba(255,255,255,.12)" } }
    },
    series: data.series.map((series) => ({
      name: series.category,
      type: "bar",
      data: series.counts,
      emphasis: { focus: "series" },
      barMaxWidth: 16
    }))
  });
};

const renderLineChart = (data) => {
  if (lineChart) lineChart.destroy();
  lineChart = new Chart(document.querySelector("#line-chart"), {
    type: "line",
    data: {
      labels: data.months,
      datasets: data.series.map((series, index) => ({
        label: series.category,
        data: series.counts,
        borderColor: palette[index],
        backgroundColor: palette[index],
        borderWidth: 2,
        pointRadius: 2,
        pointHoverRadius: 5,
        tension: .28
      }))
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { position: "bottom", labels: { usePointStyle: true, boxWidth: 8 } },
        title: { display: false }
      },
      scales: {
        y: { beginAtZero: true, title: { display: true, text: "借阅量（册）" } },
        x: { grid: { display: false } }
      }
    }
  });
};

const showDashboard = (data) => {
  loadedData = data;
  $("#sub-title").text(`${data.title} · ${data.period}`);
  renderCards(data);
  $("#dashboard-content").prop("hidden", false);
  $("#status").prop("hidden", true);
  requestAnimationFrame(() => {
    renderBarChart(data);
    renderLineChart(data);
  });
};

const loadData = async () => {
  $("#dashboard-content").prop("hidden", true);
  setStatus("loading", "加载中", "正在通过 fetch 请求本地 JSON 数据…");

  if (pageMode === "loading") {
    $("#status-detail").text("加载状态演示已保持；点击顶部“成功”返回正常页面。");
    return;
  }

  const source = pageMode === "error"
    ? "../data/not-found.json"
    : pageMode === "empty"
      ? "../data/books-empty.json"
      : "../data/books.json";

  try {
    const data = await fetchJson(source);
    if (!Array.isArray(data.series) || data.series.length === 0) {
      setStatus("empty", "暂无数据", "请求成功，但数据集没有可绘制的系列。请切换到成功状态。 ");
      return;
    }
    showDashboard(data);
  } catch (error) {
    console.warn("图书馆数据加载失败。", error);
    setStatus("error", "加载失败", `未能读取数据：${error.message}。请检查网络或点击重试。`);
  }
};

$("#cards").on("click keydown", ".metric-card", function (event) {
  if (event.type === "keydown" && event.key !== "Enter" && event.key !== " ") return;
  const category = $(this).data("category");
  $(".metric-card").removeClass("is-active");
  $(this).addClass("is-active");
  if (barChart) {
    barChart.dispatchAction({ type: "legendAllSelect" });
    loadedData.series
      .filter((series) => series.category !== category)
      .forEach((series) => barChart.dispatchAction({ type: "legendUnSelect", name: series.category }));
  }
});

$("#retry-button").on("click", () => {
  window.location.href = "./";
});

window.addEventListener("resize", () => {
  if (barChart) barChart.resize();
});

loadData();
