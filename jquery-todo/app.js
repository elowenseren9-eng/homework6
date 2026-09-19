"use strict";

const STORAGE_KEY = "homework6.jquery.tasks";
let tasks = [];
let currentFilter = "all";

const createId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const isValidTask = (task) => (
  task && typeof task.id === "string" && typeof task.text === "string" && typeof task.done === "boolean"
);

const showTip = (message, type = "error") => {
  $("#form-tip")
    .stop(true, true)
    .removeClass("success")
    .toggleClass("success", type === "success")
    .text(message)
    .hide()
    .fadeIn(180);
};

const loadTasks = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new TypeError("任务数据不是数组");
    return parsed.filter(isValidTask);
  } catch (error) {
    console.warn("任务数据读取失败，已恢复为空列表。", error);
    showTip("旧数据无法读取，已安全恢复为空列表");
    return [];
  }
};

const saveTasks = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    return true;
  } catch (error) {
    console.warn("任务数据保存失败。", error);
    showTip("浏览器存储空间不足，本次修改没有保存");
    return false;
  }
};

const getVisibleTasks = () => tasks.filter((task) => {
  if (currentFilter === "active") return !task.done;
  if (currentFilter === "done") return task.done;
  return true;
});

const render = () => {
  const $list = $("#task-list").empty();
  const visibleTasks = getVisibleTasks();
  const completed = tasks.filter((task) => task.done).length;
  $("#task-stats").text(`${tasks.length} 项任务 · ${completed} 项完成`);

  if (visibleTasks.length === 0) {
    const title = tasks.length === 0 ? "还没有任务" : "当前筛选下没有任务";
    const detail = tasks.length === 0 ? "从上方添加今天的第一件事。" : "切换筛选条件看看。";
    $("<li>", { class: "empty" })
      .append($("<strong>").text(title), $("<span>").text(detail))
      .appendTo($list);
    return;
  }

  visibleTasks.forEach((task) => {
    const $item = $("<li>", {
      class: `task-item${task.done ? " is-done" : ""}`,
      "data-id": task.id
    });
    $("<button>", {
      type: "button",
      class: "toggle",
      "data-action": "toggle",
      "aria-label": task.done ? `将“${task.text}”设为未完成` : `完成“${task.text}”`,
      text: task.done ? "✓" : ""
    }).appendTo($item);
    $("<span>", { class: "task-text", text: task.text }).appendTo($item);
    $("<button>", {
      type: "button",
      class: "delete",
      "data-action": "delete",
      text: "删除"
    }).appendTo($item);
    $item.appendTo($list);
  });
};

$("#task-form").on("submit", function (event) {
  event.preventDefault();
  const text = $(this).find("#task-input").val().trim();
  if (!text) {
    showTip("任务名不能为空");
    $("#task-input").trigger("focus");
    return;
  }
  tasks.unshift({ id: createId(), text, done: false });
  saveTasks();
  $(this).find("#task-input").val("");
  showTip("任务已添加", "success");
  render();
});

$(".filter-row").on("click", ".filter", function () {
  currentFilter = $(this).data("filter");
  $(".filter").removeClass("is-active").attr("aria-pressed", "false");
  $(this).addClass("is-active").attr("aria-pressed", "true");
  render();
});

// jQuery事件委托：后来动态创建的任务按钮也会被父列表统一处理。
$("#task-list").on("click", "[data-action]", function () {
  const id = $(this).closest(".task-item").data("id");
  const task = tasks.find((item) => item.id === id);
  if (!task) return;

  if ($(this).data("action") === "toggle") task.done = !task.done;
  if ($(this).data("action") === "delete") tasks = tasks.filter((item) => item.id !== id);
  saveTasks();
  render();
});

$("#clear-completed").on("click", () => {
  const originalLength = tasks.length;
  tasks = tasks.filter((task) => !task.done);
  if (tasks.length === originalLength) {
    showTip("当前没有已完成任务");
    return;
  }
  saveTasks();
  showTip("已清除完成项", "success");
  render();
});

tasks = loadTasks();
render();
