// 2027 Outreach Schedule Application Logic

document.addEventListener("DOMContentLoaded", () => {
  // State
  let selectedYear = "2027"; // "2026", "2027", or "all"
  let currentView = "matrix";
  let currentCategory = "all";
  let searchQuery = "";
  let currentCalendarYear = 2027;
  let currentCalendarMonth = 1; // 1-12
  let selectedEvent = null;
  const MONTH_NAMES = window.MONTH_NAMES || [
    "1月 Jan", "2月 Feb", "3月 Mar", "4月 Apr", "5月 May", "6月 Jun",
    "7月 Jul", "8月 Aug", "9月 Sep", "10月 Oct", "11月 Nov", "12月 Dec"
  ];
  const DEFAULT_GAS_URL = "https://script.google.com/macros/s/AKfycbxhU4NT0F_0a-dd8f125-8_Ma6CQlyWwSvD9ht6QayNa6MJI7ez1MC7ywH70kGz__h8/exec";
  const STORAGE_CUSTOM_EVENTS = "outreach_custom_events_2027";
  let appEvents = Array.isArray(window.EVENTS_DATA) ? [...window.EVENTS_DATA] : [];

  // Load custom local saved events if available (merging with official defaults so new 2026 events won't be lost)
  const savedCustom = localStorage.getItem(STORAGE_CUSTOM_EVENTS);
  if (savedCustom) {
    try {
      const parsed = JSON.parse(savedCustom);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const existingIds = new Set(parsed.map(e => e.id));
        const missingDefaults = (window.EVENTS_DATA || []).filter(e => !existingIds.has(e.id));
        appEvents = [...parsed, ...missingDefaults];
      }
    } catch (e) {
      console.warn("Failed to parse saved custom events", e);
    }
  }

  // DOM Elements
  const badgeYearText = document.getElementById("badgeYearText");
  const matrixViewTitle = document.getElementById("matrixViewTitle");
  const matrixViewSubtitle = document.getElementById("matrixViewSubtitle");
  const timelineViewTitle = document.getElementById("timelineViewTitle");
  const timelineViewSubtitle = document.getElementById("timelineViewSubtitle");
  const statGatheringCount = document.getElementById("statGatheringCount");
  const statCoreCount = document.getElementById("statCoreCount");
  const statBethanyCount = document.getElementById("statBethanyCount");
  const statAngelCount = document.getElementById("statAngelCount");
  const statMustardCount = document.getElementById("statMustardCount");

  const searchInput = document.getElementById("searchInput");
  const clearSearchBtn = document.getElementById("clearSearchBtn");
  const searchBoxContainer = document.getElementById("searchBoxContainer");
  const mobileSearchToggleBtn = document.getElementById("mobileSearchToggleBtn");
  const viewTabs = document.querySelectorAll(".view-tab");
  const viewSections = document.querySelectorAll(".view-section");
  const filterPills = document.querySelectorAll(".filter-pill");
  const filterNotice = document.getElementById("filterNotice");
  const resetFilterBtn = document.getElementById("resetFilterBtn");
  const themeToggleBtn = document.getElementById("themeToggleBtn");
  const themeIcon = document.getElementById("themeIcon");
  const metaThemeColor = document.getElementById("metaThemeColor");
  const printBtn = document.getElementById("printBtn");
  const exportIcsBtn = document.getElementById("exportIcsBtn");
  const lineCopyModalBtn = document.getElementById("lineCopyModalBtn");
  const statTotalEvents = document.getElementById("statTotalEvents");
  const matrixMonthChips = document.getElementById("matrixMonthChips");
  const mobileBottomNav = document.getElementById("mobileBottomNav");
  const bottomNavItems = document.querySelectorAll(".bottom-nav-item");
  const pwaInstallBtn = document.getElementById("pwaInstallBtn");

  // Modal Elements
  const eventModal = document.getElementById("eventModal");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const modalCategoryBadge = document.getElementById("modalCategoryBadge");
  const modalTitle = document.getElementById("modalTitle");
  const modalDate = document.getElementById("modalDate");
  const modalTime = document.getElementById("modalTime");
  const modalLocation = document.getElementById("modalLocation");
  const modalTopicSection = document.getElementById("modalTopicSection");
  const modalTopicText = document.getElementById("modalTopicText");
  const modalDescContent = document.getElementById("modalDescContent");
  const modalNeedsSection = document.getElementById("modalNeedsSection");
  const modalNeedsContent = document.getElementById("modalNeedsContent");
  const modalMapLink = document.getElementById("modalMapLink");
  const modalGoogleCalLink = document.getElementById("modalGoogleCalLink");
  const modalShareBtn = document.getElementById("modalShareBtn");
  const modalCopyBtn = document.getElementById("modalCopyBtn");
  const modalSingleIcsBtn = document.getElementById("modalSingleIcsBtn");

  // Line Modal Elements
  const lineModal = document.getElementById("lineModal");
  const closeLineModalBtn = document.getElementById("closeLineModalBtn");
  const lineTabs = document.querySelectorAll(".line-tab");
  const lineTextOutput = document.getElementById("lineTextOutput");
  const copyLineTextBtn = document.getElementById("copyLineTextBtn");
  const shareLineBtn = document.getElementById("shareLineBtn");
  const lineCopySuccessNotice = document.getElementById("lineCopySuccessNotice");
  const toast = document.getElementById("toast");

  // iOS Install Modal Elements
  const iosInstallModal = document.getElementById("iosInstallModal");
  const closeIosModalBtn = document.getElementById("closeIosModalBtn");
  const confirmIosModalBtn = document.getElementById("confirmIosModalBtn");

  // Calendar Elements
  const prevMonthBtn = document.getElementById("prevMonthBtn");
  const nextMonthBtn = document.getElementById("nextMonthBtn");
  const calendarMonthTitle = document.getElementById("calendarMonthTitle");
  const monthQuickSelect = document.getElementById("monthQuickSelect");
  const calendarDaysGrid = document.getElementById("calendarDaysGrid");
  const calendarDayDetails = document.getElementById("calendarDayDetails");
  const selectedDateTitle = document.getElementById("selectedDateTitle");
  const selectedDateEventsList = document.getElementById("selectedDateEventsList");

  // Deferred PWA Prompt
  let deferredInstallPrompt = null;

  // (Note: Bootstrapping is safely called at the bottom after all elements & event handlers are declared)

  // ==========================================
  // Render Functions
  // ==========================================
  function getFilteredEvents() {
    return appEvents.filter(evt => {
      // Year filter
      let matchesYear = true;
      if (selectedYear !== "all") {
        matchesYear = evt.date.startsWith(selectedYear + "-");
      }

      // Category filter
      const matchesCategory = (currentCategory === "all") || (evt.category === currentCategory);
      
      // Search query filter
      let matchesSearch = true;
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        const content = `${evt.title} ${evt.categoryName} ${evt.topic || ''} ${evt.location} ${evt.description} ${evt.needs || ''} ${evt.month}月 ${evt.date}`.toLowerCase();
        matchesSearch = content.includes(q);
      }

      return matchesYear && matchesCategory && matchesSearch;
    });
  }

  function renderAll() {
    renderMatrixView();
    renderTimelineView();
    renderCalendarView();
    renderMinistryView();
    updateFilterNotice();
    updateTotalStats();
  }

  function updateTotalStats() {
    const yearEvents = (selectedYear === "all") 
      ? appEvents 
      : appEvents.filter(e => e.date.startsWith(selectedYear + "-"));

    if (statTotalEvents) statTotalEvents.textContent = yearEvents.length;
    if (statGatheringCount) {
      statGatheringCount.textContent = yearEvents.filter(e => e.category === "gathering").length;
    }
    if (statCoreCount) {
      statCoreCount.textContent = yearEvents.filter(e => e.category === "core").length;
    }
    if (statBethanyCount) {
      statBethanyCount.textContent = yearEvents.filter(e => e.category === "bethany").length;
    }
    if (statAngelCount) {
      statAngelCount.textContent = yearEvents.filter(e => e.category === "angel").length;
    }
    if (statMustardCount) {
      statMustardCount.textContent = yearEvents.filter(e => e.category === "mustard").length;
    }
  }

  function updateFilterNotice() {
    const isFiltered = (selectedYear !== "2027") || (currentCategory !== "all") || (searchQuery.trim() !== "");
    if (isFiltered) {
      filterNotice.style.display = "flex";
      let filterText = "目前篩選：";
      if (selectedYear !== "all") {
        filterText += `[${selectedYear} 年度] `;
      } else {
        filterText += `[跨年度 (全部)] `;
      }
      if (currentCategory !== "all") {
        filterText += `[${CATEGORY_MAP[currentCategory]?.label || currentCategory}] `;
      }
      if (searchQuery.trim() !== "") {
        filterText += `關鍵字 "${searchQuery}" `;
      }
      filterText += `(共 ${getFilteredEvents().length} 筆活動)`;
      filterNotice.querySelector("span").textContent = filterText;
    } else {
      filterNotice.style.display = "none";
    }
  }

  // 1. Matrix View (12 Months Grid)
  function initMatrixMonthChips() {
    if (!matrixMonthChips) return;
    matrixMonthChips.innerHTML = "";
    for (let m = 1; m <= 12; m++) {
      const chip = document.createElement("button");
      chip.className = "chip-jump-month";
      chip.textContent = `${m}月`;
      chip.setAttribute("aria-label", `跳轉至 ${m} 月`);
      chip.addEventListener("click", () => {
        const targetCard = document.getElementById(`month-card-${m}`);
        if (targetCard) {
          targetCard.scrollIntoView({ behavior: "smooth", block: "start" });
          targetCard.style.boxShadow = "0 0 0 2px var(--color-gathering)";
          setTimeout(() => {
            targetCard.style.boxShadow = "";
          }, 1500);
        }
      });
      matrixMonthChips.appendChild(chip);
    }
  }

  function renderMatrixView() {
    const container = document.getElementById("matrixGrid");
    container.innerHTML = "";

    const filtered = getFilteredEvents();

    for (let m = 1; m <= 12; m++) {
      const monthEvents = filtered.filter(e => e.month === m);
      // Sort by date
      monthEvents.sort((a, b) => a.date.localeCompare(b.date));

      const card = document.createElement("div");
      card.className = "matrix-month-card";
      card.id = `month-card-${m}`;

      let eventsHtml = "";
      if (monthEvents.length === 0) {
        eventsHtml = `<div style="color:var(--text-muted);font-size:0.8rem;padding:0.75rem 0;text-align:center;">此月份無排定事工</div>`;
      } else {
        eventsHtml = monthEvents.map(evt => {
          const cat = CATEGORY_MAP[evt.category] || CATEGORY_MAP.gathering;
          const displayDate = (selectedYear === "all") 
            ? evt.date.replace(/-/g, "/") 
            : `${parseInt(evt.date.slice(5, 7))}/${parseInt(evt.date.slice(8, 10))}`;
          return `
            <div class="month-event-item" data-id="${evt.id}" style="border-left-color: ${cat.color}">
              <div class="month-event-date">${displayDate}</div>
              <div class="month-event-info">
                <div class="month-event-title">${evt.title}</div>
                <div class="month-event-sub">📍 ${evt.location}</div>
                ${evt.topic ? `<div class="month-event-sub" style="color:${cat.color}">★ ${evt.topic}</div>` : ''}
              </div>
            </div>
          `;
        }).join("");
      }

      card.innerHTML = `
        <div class="month-card-header">
          <div class="month-num-badge">
            <span>${m} 月</span>
            <span style="font-size:0.85rem;color:var(--text-muted);font-weight:600;">${MONTH_NAMES[m-1].split(" ")[1]}</span>
          </div>
          <span class="month-count">${monthEvents.length} 場活動</span>
        </div>
        <div class="month-events-list">
          ${eventsHtml}
        </div>
      `;

      container.appendChild(card);
    }

    // Attach click events on month items
    container.querySelectorAll(".month-event-item").forEach(item => {
      item.addEventListener("click", () => {
        const id = item.getAttribute("data-id");
        openEventModalById(id);
      });
    });
  }

  // 2. Timeline View
  function renderTimelineView() {
    const container = document.getElementById("timelineContainer");
    const countBadge = document.getElementById("timelineCountText");
    const filtered = getFilteredEvents();

    // Sort by date
    filtered.sort((a, b) => a.date.localeCompare(b.date));

    countBadge.textContent = `顯示 ${filtered.length} 個行程`;
    container.innerHTML = "";

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="text-align:center;padding:3rem;background:var(--bg-card);border-radius:var(--radius-lg);border:1px solid var(--border-color);">
          <div style="font-size:2.5rem;margin-bottom:0.5rem;">🔍</div>
          <h3 style="font-size:1.1rem;color:var(--text-primary);margin-bottom:0.3rem;">找不到符合的服事行程</h3>
          <p style="color:var(--text-secondary);font-size:0.85rem;">請嘗試放寬關鍵字、切換「全部事工」或切換年份。</p>
        </div>
      `;
      return;
    }

    let lastYear = null;

    filtered.forEach(evt => {
      const cat = CATEGORY_MAP[evt.category] || CATEGORY_MAP.gathering;
      const dateParts = evt.date.split("-");
      const currentEvtYear = dateParts[0];
      const monthStr = `${parseInt(dateParts[1])}月`;
      const dayStr = `${parseInt(dateParts[2])}日`;

      // 如果是跨年度 (all)，在年份變更時插入年份分隔標籤
      if (selectedYear === "all" && lastYear !== currentEvtYear) {
        lastYear = currentEvtYear;
        const divider = document.createElement("div");
        divider.className = "timeline-year-divider";
        divider.innerHTML = `<span class="timeline-year-divider-pill">📅 ${currentEvtYear} 年度外展行程</span>`;
        container.appendChild(divider);
      }

      const card = document.createElement("div");
      card.className = "timeline-card";
      card.style.setProperty("--card-accent-color", cat.color);

      card.innerHTML = `
        <div class="timeline-date-block">
          ${selectedYear === "all" ? `<div style="font-size:0.75rem;color:var(--text-muted);font-weight:700;margin-bottom:2px;">${currentEvtYear}年</div>` : ''}
          <div class="timeline-day">${monthStr} ${dayStr}</div>
          <div class="timeline-month-dow">${evt.dayOfWeek}</div>
          <div class="timeline-time">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            ${evt.time}
          </div>
        </div>

        <div class="timeline-content-block">
          <div class="timeline-top-tags">
            <span class="badge ${cat.badgeClass}">${evt.categoryName}</span>
            ${evt.status.includes('tbd') ? '<span class="badge badge-tbd">地點/細節籌備中</span>' : ''}
          </div>
          <div class="timeline-title">${evt.title}</div>
          <div class="timeline-location">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            ${evt.location}
          </div>
          ${evt.topic ? `<div class="timeline-topic">📖 ${evt.topic}</div>` : ''}
        </div>

        <div class="timeline-action-block">
          <button class="btn btn-secondary btn-detail-action" data-id="${evt.id}">
            查看詳情
          </button>
        </div>
      `;

      card.addEventListener("click", () => {
        openEventModal(evt);
      });

      container.appendChild(card);
    });
  }

  // 3. Calendar Grid View
  function initCalendarQuickSelect() {
    monthQuickSelect.innerHTML = "";
    for (let m = 1; m <= 12; m++) {
      const chip = document.createElement("button");
      chip.className = `chip-month ${m === currentCalendarMonth ? 'active' : ''}`;
      chip.textContent = `${m}月`;
      chip.dataset.month = m;
      chip.addEventListener("click", () => {
        currentCalendarMonth = m;
        updateCalendarActiveChip();
        renderCalendarView();
      });
      monthQuickSelect.appendChild(chip);
    }
  }

  function updateCalendarActiveChip() {
    monthQuickSelect.querySelectorAll(".chip-month").forEach(chip => {
      chip.classList.toggle("active", parseInt(chip.dataset.month) === currentCalendarMonth);
    });
  }

  function renderCalendarView() {
    calendarMonthTitle.textContent = `${currentCalendarYear} 年 ${currentCalendarMonth} 月`;
    updateCalendarActiveChip();

    calendarDaysGrid.innerHTML = "";
    calendarDayDetails.style.display = "none";

    const calendarEvents = appEvents.filter(evt => {
      const matchesYear = evt.date.startsWith(currentCalendarYear + "-") || (evt.endDate && evt.endDate.startsWith(currentCalendarYear + "-"));
      const matchesCategory = (currentCategory === "all") || (evt.category === currentCategory);
      let matchesSearch = true;
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        const content = `${evt.title} ${evt.categoryName} ${evt.topic || ''} ${evt.location} ${evt.description} ${evt.needs || ''} ${evt.month}月 ${evt.date}`.toLowerCase();
        matchesSearch = content.includes(q);
      }
      return matchesYear && matchesCategory && matchesSearch;
    });

    // First day of month (0 = Sun, 1 = Mon ... 6 = Sat)
    const firstDayIndex = new Date(currentCalendarYear, currentCalendarMonth - 1, 1).getDay();
    // Days in current month
    const totalDays = new Date(currentCalendarYear, currentCalendarMonth, 0).getDate();
    // Days in previous month
    const prevMonthDays = new Date(currentCalendarYear, currentCalendarMonth - 1, 0).getDate();

    // Leading days from previous month
    for (let x = firstDayIndex; x > 0; x--) {
      const dayNum = prevMonthDays - x + 1;
      const cell = document.createElement("div");
      cell.className = "calendar-day-cell other-month";
      cell.innerHTML = `<div class="calendar-day-header"><span class="day-number">${dayNum}</span></div>`;
      calendarDaysGrid.appendChild(cell);
    }

    // Days in current month
    for (let day = 1; day <= totalDays; day++) {
      const cell = document.createElement("div");
      cell.className = "calendar-day-cell";

      const formattedMonth = String(currentCalendarMonth).padStart(2, "0");
      const formattedDay = String(day).padStart(2, "0");
      const dateString = `${currentCalendarYear}-${formattedMonth}-${formattedDay}`;

      const daysEvents = calendarEvents.filter(e => {
        if (e.endDate) {
          return dateString >= e.date && dateString <= e.endDate;
        }
        return e.date === dateString;
      });

      let eventsHtml = "";
      let dotsHtml = "";
      if (daysEvents.length > 0) {
        eventsHtml = daysEvents.map(evt => {
          const cat = CATEGORY_MAP[evt.category] || CATEGORY_MAP.gathering;
          return `<div class="day-event-pill" style="background-color: ${cat.color}" title="${evt.title} (${evt.time})">${evt.title}</div>`;
        }).join("");

        // Indicator dots for mobile view (up to 3 colored dots)
        dotsHtml = daysEvents.slice(0, 3).map(evt => {
          const cat = CATEGORY_MAP[evt.category] || CATEGORY_MAP.gathering;
          return `<span class="event-dot" style="background-color: ${cat.color}; color: ${cat.color};" title="${evt.title}"></span>`;
        }).join("");
        if (daysEvents.length > 3) {
          dotsHtml += `<span style="font-size:0.6rem;color:var(--text-muted);font-weight:700;">+${daysEvents.length - 3}</span>`;
        }
      }

      cell.innerHTML = `
        <div class="calendar-day-header">
          <span class="day-number">${day}</span>
          ${daysEvents.length > 0 ? `<span class="badge" style="background:var(--color-gathering);font-size:0.65rem;">${daysEvents.length}</span>` : ''}
        </div>
        <div class="day-events">
          ${eventsHtml}
          <div class="day-event-dots">${dotsHtml}</div>
        </div>
      `;

      cell.addEventListener("click", () => {
        calendarDaysGrid.querySelectorAll(".calendar-day-cell").forEach(c => c.classList.remove("selected"));
        if (daysEvents.length > 0) {
          cell.classList.add("selected");
          showCalendarDayDetails(dateString, daysEvents);
          // On mobile screens, smoothly scroll down to day details
          if (window.innerWidth <= 768) {
            calendarDayDetails.scrollIntoView({ behavior: "smooth", block: "nearest" });
          }
        } else {
          calendarDayDetails.style.display = "none";
        }
      });

      calendarDaysGrid.appendChild(cell);
    }

    // Trailing days to fill 35 or 42 cells
    const totalCells = firstDayIndex + totalDays;
    const remainingCells = (totalCells > 35 ? 42 : 35) - totalCells;
    for (let i = 1; i <= remainingCells; i++) {
      const cell = document.createElement("div");
      cell.className = "calendar-day-cell other-month";
      cell.innerHTML = `<div class="calendar-day-header"><span class="day-number">${i}</span></div>`;
      calendarDaysGrid.appendChild(cell);
    }
  }

  function showCalendarDayDetails(dateString, events) {
    calendarDayDetails.style.display = "block";
    selectedDateTitle.textContent = `📅 ${dateString} 當日行程 (${events.length} 場)`;
    selectedDateEventsList.innerHTML = events.map(evt => {
      const cat = CATEGORY_MAP[evt.category] || CATEGORY_MAP.gathering;
      return `
        <div class="timeline-card" style="margin-top:0.75rem;cursor:pointer;" onclick="window.openEventById('${evt.id}')">
          <div class="timeline-date-block">
            <div class="timeline-day">${evt.time}</div>
            <div class="timeline-month-dow">${evt.location}</div>
          </div>
          <div class="timeline-content-block">
            <div class="timeline-top-tags">
              <span class="badge ${cat.badgeClass}">${evt.categoryName}</span>
            </div>
            <div class="timeline-title">${evt.title}</div>
            ${evt.topic ? `<div class="timeline-topic">📖 ${evt.topic}</div>` : ''}
          </div>
        </div>
      `;
    }).join("");
  }

  // 4. Ministry Project Hub View
  function renderMinistryView() {
    const container = document.getElementById("ministryGrid");
    container.innerHTML = "";

    const ministries = [
      {
        id: "gathering",
        name: "Monthly Gathering 月聚集",
        freq: "每月週二 7:30PM - 9:30PM (共 12 場)",
        loc: "Kids Central",
        desc: "凝聚全體外展同工、新年度宣教異象發佈、禾場消息分享與彼此代禱祝福。全體團隊不可或缺的每月心靈加油站！",
        icon: "🔥",
        catKey: "gathering"
      },
      {
        id: "core",
        name: "核心夥伴季聚集",
        freq: "每季週四 7:30PM - 9:30PM (3/4, 6/3, 9/2, 12/2)",
        loc: "副堂",
        desc: "核心決策團隊季度對焦會議，審視各外展專案資源、同工動員佈署、跨機構連結與年度藍圖規劃。",
        icon: "⭐",
        catKey: "core"
      },
      {
        id: "bethany",
        name: "伯大尼基金會兒少服事",
        freq: "週五 6:30PM - 9:00PM (共 11 場)",
        loc: "伯大尼兒少家庭基金會 (文山區)",
        desc: "使用 Hope Kids 兒童主日學教案！從創世紀、出埃及記一路講述到撒母耳記、聖誕耶穌誕生。陪伴失親兒少在神的話語中剛強長大！",
        icon: "🌱",
        catKey: "bethany"
      },
      {
        id: "angel",
        name: "天使樹受刑人子女事工",
        freq: "全年度多元任務 (特訓、營隊、送禮、典禮)",
        loc: "校園書房 / 監所 / 仁愛堂浸信會",
        desc: "陪伴受刑人子女與照顧者家庭。2026年12/5聖誕送禮開跑典禮籌備、12/10~12/20親送10個家庭與後續探訪；2027年四週特訓、4/5兒童節、7/10快樂營、9月進監填卡與12/4開跑盛典！",
        icon: "🕊️",
        catKey: "angel"
      },
      {
        id: "mustard",
        name: "芥菜種 & 無邊界事工",
        freq: "多走一哩路 ✕ 偏鄉探訪短宣 ✕ 營隊",
        loc: "全台巡迴 (台東/台南/中區/北區/達谷婻/田埔/花蓮/福隆)",
        desc: "走遍各城各鄉宣教！包含多走一哩路健走嘉年華、達谷婻與田埔部落春秋探訪與7月暑期短宣、花蓮冬夏令營及福隆 SHOUT CAMP 青年衝浪營！",
        icon: "🏕️",
        catKey: "mustard"
      },
      {
        id: "partner",
        name: "合作機構外展與校園事工",
        freq: "監獄家庭日、洗禮、青年歸主、醒吾科技大學",
        loc: "監所 / 醒吾科技大學 / 青年歸主中心",
        desc: "深耕高牆與大專校園，9月監獄家庭日、11月獄中洗禮、12月青年歸主 Afterschool 課後陪伴，以及醒吾科技大學全年度青年得著事工！",
        icon: "🤝",
        catKey: "partner"
      }
    ];

    const focusedCat = (currentCategory !== "all") ? currentCategory : null;

    const todayStr = new Date().toISOString().slice(0, 10);

    ministries.forEach(min => {
      const cat = CATEGORY_MAP[min.catKey] || CATEGORY_MAP.gathering;
      const minEvents = (selectedYear === "all")
        ? appEvents.filter(e => e.category === min.catKey)
        : appEvents.filter(e => e.category === min.catKey && e.date.startsWith(selectedYear + "-"));
      const isFocused = focusedCat === min.catKey;

      // 分離即將到來日程（今天及之後，若無則取近期 4 場）
      const futureEvents = minEvents.filter(e => e.date >= todayStr);
      const upcomingEvents = futureEvents.length > 0 ? futureEvents.slice(0, 4) : minEvents.slice(0, 4);
      const upcomingCount = upcomingEvents.length;
      const totalCount = minEvents.length;
      const hasMore = totalCount > upcomingCount;

      const card = document.createElement("div");
      card.className = "ministry-card" + (isFocused ? " is-focused" : "");
      card.id = `ministryCard-${min.catKey}`;
      card.dataset.mode = "upcoming";

      const renderRow = (e) => {
        const dateShort = (selectedYear === "all")
          ? e.date.replace(/-/g, "/")
          : `${parseInt(e.date.slice(5, 7))}/${parseInt(e.date.slice(8, 10))}`;
        const topicTag = e.topic ? `<span class="item-topic-tag">📖 ${e.topic}</span>` : "";
        return `
          <div class="ministry-schedule-item" onclick="window.openEventById('${e.id}')">
            <span class="item-date-badge">${dateShort} ${e.dayOfWeek}</span>
            <div class="item-main-info">
              <div class="item-title-row">
                ${e.title}
                ${topicTag}
              </div>
              <div class="item-sub-row">
                <span>⏰ ${e.time}</span>
                <span>📍 ${e.location}</span>
              </div>
            </div>
          </div>
        `;
      };

      const upcomingRowsHtml = upcomingEvents.map(renderRow).join("") || `<div class="ministry-empty-hint">暫無近期日程</div>`;
      const allRowsHtml = minEvents.map(renderRow).join("");

      const focusBadge = isFocused ? `
        <div style="display:inline-flex;align-items:center;gap:0.5rem;margin-bottom:0.85rem;">
          <span class="focus-pill" style="background:${cat.color}25; color:${cat.color}; border:1px solid ${cat.color}60;">
            🎯 目前篩選中
          </span>
          <span class="focus-count">${minEvents.length} 場行程</span>
        </div>
      ` : "";

      card.innerHTML = `
        <div class="ministry-card-header">
          <div class="ministry-title-group">
            <div class="ministry-badge-icon" style="background:${cat.color}20; color:${cat.color}">
              ${min.icon}
            </div>
            <div>
              <div class="ministry-name">${min.name}</div>
              <div class="ministry-freq">⏰ ${min.freq}</div>
            </div>
          </div>
          <div class="ministry-card-actions">
            <button class="ministry-quick-btn" onclick="window.jumpToMinistry('${min.catKey}')">
              🔍 篩選此項
            </button>
          </div>
        </div>
        ${focusBadge}
        <p class="ministry-desc">📍 <strong>主要場地：</strong>${min.loc}<br>${min.desc}</p>
        
        <!-- Schedule Section with Tab Bar & Read More -->
        <div class="ministry-full-schedule">
          <div class="ministry-schedule-nav">
            <div class="ministry-nav-tabs">
              <button class="ministry-nav-tab active" data-tab-type="upcoming" onclick="window.setMinistryScheduleMode('${min.catKey}', 'upcoming')">
                ⚡ 即將到來 (${upcomingCount})
              </button>
              <button class="ministry-nav-tab" data-tab-type="all" onclick="window.setMinistryScheduleMode('${min.catKey}', 'all')">
                📋 全排程 (${totalCount})
              </button>
            </div>
            ${hasMore ? `
            <button class="ministry-readmore-link" onclick="window.toggleMinistryExpand('${min.catKey}')" title="展開或收合全排程">
              <span class="readmore-text">閱讀更多</span>
              <span class="readmore-icon">▼</span>
            </button>` : ''}
          </div>

          <!-- Mode 1: Upcoming Schedule Container -->
          <div class="ministry-schedule-view-upcoming">
            ${upcomingRowsHtml}
          </div>

          <!-- Mode 2: Full All-Schedule Container -->
          <div class="ministry-schedule-view-all" style="display:none;">
            ${allRowsHtml}
          </div>

          ${hasMore ? `
          <div class="ministry-card-bottom-action">
            <button class="ministry-expand-btn" onclick="window.toggleMinistryExpand('${min.catKey}')">
              <span class="expand-btn-text">📖 閱讀更多：展開全排程 (${totalCount} 場) ▼</span>
            </button>
          </div>` : ''}
        </div>
      `;

      container.appendChild(card);
    });
  }

  // Switch between Upcoming and All schedule view
  window.setMinistryScheduleMode = function(catKey, mode) {
    const card = document.getElementById(`ministryCard-${catKey}`);
    if (!card) return;
    card.dataset.mode = mode;

    const tabs = card.querySelectorAll(".ministry-nav-tab");
    tabs.forEach(tab => {
      tab.classList.toggle("active", tab.dataset.tabType === mode);
    });

    const upcomingView = card.querySelector(".ministry-schedule-view-upcoming");
    const allView = card.querySelector(".ministry-schedule-view-all");
    const readMoreBtn = card.querySelector(".ministry-readmore-link");
    const readMoreText = readMoreBtn ? readMoreBtn.querySelector(".readmore-text") : null;
    const readMoreIcon = readMoreBtn ? readMoreBtn.querySelector(".readmore-icon") : null;
    const bottomBtn = card.querySelector(".ministry-expand-btn");
    const bottomBtnText = bottomBtn ? bottomBtn.querySelector(".expand-btn-text") : null;
    const totalCount = appEvents.filter(e => e.category === catKey).length;

    if (mode === "all") {
      if (upcomingView) upcomingView.style.display = "none";
      if (allView) allView.style.display = "flex";
      if (readMoreText) readMoreText.textContent = "收合為即將到來";
      if (readMoreIcon) readMoreIcon.textContent = "▲";
      if (bottomBtnText) bottomBtnText.textContent = "▲ 收合至即將到來日程";
    } else {
      if (upcomingView) upcomingView.style.display = "flex";
      if (allView) allView.style.display = "none";
      if (readMoreText) readMoreText.textContent = "閱讀更多";
      if (readMoreIcon) readMoreIcon.textContent = "▼";
      if (bottomBtnText) bottomBtnText.textContent = `📖 閱讀更多：展開全排程 (${totalCount} 場) ▼`;
    }
  };

  // Toggle expand/collapse between Upcoming and All schedule
  window.toggleMinistryExpand = function(catKey) {
    const card = document.getElementById(`ministryCard-${catKey}`);
    if (!card) return;
    const currentMode = card.dataset.mode || "upcoming";
    const newMode = currentMode === "upcoming" ? "all" : "upcoming";
    window.setMinistryScheduleMode(catKey, newMode);
  };

  // Jump to a ministry card: update filter + scroll + highlight
  window.jumpToMinistry = function(catKey) {
    currentCategory = catKey;
    filterPills.forEach(p => p.classList.toggle("active", p.dataset.category === catKey));
    renderAll();
    if (currentView !== "ministry") switchView("ministry");
    setTimeout(() => {
      const card = document.getElementById(`ministryCard-${catKey}`);
      if (card) {
        card.scrollIntoView({ behavior: "smooth", block: "start" });
        card.classList.add("card-jump-highlight");
        card.addEventListener("animationend", () => card.classList.remove("card-jump-highlight"), { once: true });
      }
    }, 80);
  };

  // ==========================================
  // Modal Actions
  // ==========================================
  window.openEventById = function(id) {
    openEventModalById(id);
  };

  function openEventModalById(id) {
    const evt = appEvents.find(e => e.id === id);
    if (evt) {
      openEventModal(evt);
    }
  }

  function getEventShareText(evt) {
    const yearPrefix = evt.date.startsWith("2026") ? "2026" : "2027";
    return `【${yearPrefix} 外展服事通告】\n📌 活動：${evt.title}\n📅 日期：${evt.date} (${evt.dayOfWeek})\n⏰ 時間：${evt.time}\n📍 地點：${evt.location}\n${evt.topic ? `📖 主題：${evt.topic}\n` : ''}📋 說明：${evt.description}\n${evt.needs ? `🤝 需求：${evt.needs}\n` : ''}${evt.itemsToBring ? `🎒 攜帶：${evt.itemsToBring}\n` : ''}${evt.locationUrl ? `🗺️ 導航：${evt.locationUrl}\n` : ''}\n邀請大家同心代禱並預備心服事！`;
  }

  function formatRichDescription(desc) {
    if (!desc) return "";
    let safe = desc
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    // Convert markdown links [title](url)
    safe = safe.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="desc-link-badge">🔗 $1</a>');
    // Convert standalone urls
    safe = safe.replace(/(^|[^">])(https?:\/\/[^\s<]+)/g, '$1<a href="$2" target="_blank" rel="noopener noreferrer" class="desc-link-badge">🔗 $2</a>');
    return safe.replace(/\n/g, "<br>");
  }

  function openEventModal(evt) {
    selectedEvent = evt;
    const cat = CATEGORY_MAP[evt.category] || CATEGORY_MAP.gathering;

    modalCategoryBadge.textContent = evt.categoryName;
    modalCategoryBadge.style.backgroundColor = cat.color;

    modalTitle.textContent = evt.title;
    modalDate.textContent = `${evt.date} (${evt.dayOfWeek})`;
    modalTime.textContent = evt.time;
    modalLocation.textContent = evt.location;

    // Topic
    if (evt.topic) {
      modalTopicSection.style.display = "block";
      modalTopicText.textContent = evt.topic;
    } else {
      modalTopicSection.style.display = "none";
    }

    // Description
    modalDescContent.innerHTML = formatRichDescription(evt.description);

    // Needs & Items
    let needsHtml = "";
    if (evt.needs) {
      needsHtml += `<p><strong>服事人力需求：</strong>${evt.needs}</p>`;
    }
    if (evt.itemsToBring) {
      needsHtml += `<p style="margin-top:0.35rem;"><strong>攜帶物品：</strong>${evt.itemsToBring}</p>`;
    }
    if (needsHtml) {
      modalNeedsSection.style.display = "block";
      modalNeedsContent.innerHTML = needsHtml;
    } else {
      modalNeedsSection.style.display = "none";
    }

    // Map link
    if (evt.locationUrl) {
      modalMapLink.style.display = "inline-flex";
      modalMapLink.href = evt.locationUrl;
    } else {
      modalMapLink.style.display = "none";
    }

    // Google Calendar Web Link (Cross-platform direct link)
    if (modalGoogleCalLink) {
      const dateNoHyphen = evt.date.replace(/-/g, "");
      let dtStart = `${dateNoHyphen}T193000`;
      let dtEnd = `${dateNoHyphen}T213000`;
      if (evt.time.includes("6:30PM") || evt.time.includes("6:30 PM")) {
        dtStart = `${dateNoHyphen}T183000`;
        dtEnd = `${dateNoHyphen}T210000`;
      } else if (evt.time.includes("9:00AM") || evt.time.includes("9:00 AM") || evt.time.includes("9AM")) {
        dtStart = `${dateNoHyphen}T090000`;
        dtEnd = `${dateNoHyphen}T123000`;
      } else if (evt.time.includes("10:00AM") || evt.time.includes("10:00 AM") || evt.time.includes("10AM")) {
        dtStart = `${dateNoHyphen}T100000`;
        dtEnd = `${dateNoHyphen}T150000`;
      } else if (evt.time.includes("10:30AM")) {
        dtStart = `${dateNoHyphen}T103000`;
        dtEnd = `${dateNoHyphen}T153000`;
      } else {
        dtStart = `${dateNoHyphen}T090000`;
        dtEnd = `${dateNoHyphen}T180000`;
      }
      const gcalDetails = `${evt.description || ''}\n${evt.topic ? `主題：${evt.topic}\n` : ''}${evt.needs ? `需求：${evt.needs}\n` : ''}${evt.itemsToBring ? `攜帶：${evt.itemsToBring}\n` : ''}`;
      modalGoogleCalLink.href = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(evt.title)}&dates=${dtStart}/${dtEnd}&details=${encodeURIComponent(gcalDetails)}&location=${encodeURIComponent(evt.location)}`;
    }

    eventModal.style.display = "flex";
    document.body.classList.add("modal-open");
  }

  function closeEventModal() {
    eventModal.style.display = "none";
    document.body.classList.remove("modal-open");
  }

  closeModalBtn.addEventListener("click", closeEventModal);

  eventModal.addEventListener("click", (e) => {
    if (e.target === eventModal) {
      closeEventModal();
    }
  });

  // Copy single event announcement
  modalCopyBtn.addEventListener("click", () => {
    if (!selectedEvent) return;
    const text = getEventShareText(selectedEvent);
    navigator.clipboard.writeText(text).then(() => {
      showToast("活動通告已複製，可直接貼在 LINE 群組！");
    });
  });

  // Native Mobile Share
  if (modalShareBtn) {
    modalShareBtn.addEventListener("click", () => {
      if (!selectedEvent) return;
      const text = getEventShareText(selectedEvent);
      if (navigator.share) {
        navigator.share({
          title: selectedEvent.title,
          text: text
        }).catch(() => {});
      } else {
        navigator.clipboard.writeText(text).then(() => {
          showToast("活動通告已複製！");
        });
      }
    });
  }

  // Download Single .ics
  modalSingleIcsBtn.addEventListener("click", () => {
    if (!selectedEvent) return;
    const icsContent = generateIcsContent([selectedEvent]);
    downloadIcsFile(icsContent, `${selectedEvent.title}.ics`);
    showToast("已下載日曆檔，可直接加入行事曆！");
  });

  // ==========================================
  // Export All to .ICS File (Apple/Google/Outlook)
  // ==========================================
  exportIcsBtn.addEventListener("click", () => {
    const eventsToExport = (selectedYear === "all")
      ? appEvents
      : appEvents.filter(e => e.date.startsWith(selectedYear + "-"));
    const icsContent = generateIcsContent(eventsToExport);
    const fileName = (selectedYear === "all")
      ? "Outreach_Schedule_Full.ics"
      : `${selectedYear}_Outreach_Schedule.ics`;
    downloadIcsFile(icsContent, fileName);
    showToast(`已成功匯出 ${selectedYear === "all" ? "全部跨年度" : selectedYear + " 年"} 事工行事曆 (.ics)`);
  });

  function generateIcsContent(events) {
    let ics = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Antigravity//2027 Outreach Schedule//ZH\nCALSCALE:GREGORIAN\nMETHOD:PUBLISH\nX-WR-CALNAME:2027 Outreach Schedule\n";

    events.forEach(evt => {
      const dateNoHyphen = evt.date.replace(/-/g, "");
      // Default time windows if evening or daytime
      let dtStart = `${dateNoHyphen}T193000`;
      let dtEnd = `${dateNoHyphen}T213000`;

      if (evt.time.includes("6:30PM") || evt.time.includes("6:30 PM")) {
        dtStart = `${dateNoHyphen}T183000`;
        dtEnd = `${dateNoHyphen}T210000`;
      } else if (evt.time.includes("9:00AM") || evt.time.includes("9:00 AM") || evt.time.includes("9AM")) {
        dtStart = `${dateNoHyphen}T090000`;
        dtEnd = `${dateNoHyphen}T123000`;
      } else if (evt.time.includes("10:00AM") || evt.time.includes("10:00 AM") || evt.time.includes("10AM")) {
        dtStart = `${dateNoHyphen}T100000`;
        dtEnd = `${dateNoHyphen}T150000`;
      } else if (evt.time.includes("10:30AM")) {
        dtStart = `${dateNoHyphen}T103000`;
        dtEnd = `${dateNoHyphen}T153000`;
      } else {
        // all-day or default
        dtStart = `${dateNoHyphen}T090000`;
        dtEnd = `${dateNoHyphen}T180000`;
      }

      const summary = escapeIcsText(evt.title);
      const location = escapeIcsText(evt.location);
      const desc = escapeIcsText(`${evt.description} ${evt.topic ? `主題：${evt.topic}` : ''} ${evt.needs ? `需求：${evt.needs}` : ''}`);

      ics += "BEGIN:VEVENT\n";
      ics += `UID:${evt.id}-2027@antigravity.outreach\n`;
      ics += `DTSTAMP:20261014T000000Z\n`;
      ics += `DTSTART:${dtStart}\n`;
      ics += `DTEND:${dtEnd}\n`;
      ics += `SUMMARY:${summary}\n`;
      ics += `LOCATION:${location}\n`;
      ics += `DESCRIPTION:${desc}\n`;
      ics += "END:VEVENT\n";
    });

    ics += "END:VCALENDAR";
    return ics;
  }

  function escapeIcsText(str) {
    if (!str) return "";
    return str.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
  }

  function downloadIcsFile(content, filename) {
    const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }

  // ==========================================
  // Line Text Package Generator
  // ==========================================
  lineCopyModalBtn.addEventListener("click", () => {
    updateLineText("year-summary");
    lineModal.style.display = "flex";
    document.body.classList.add("modal-open");
  });

  function closeLineModal() {
    lineModal.style.display = "none";
    document.body.classList.remove("modal-open");
  }

  closeLineModalBtn.addEventListener("click", closeLineModal);

  lineModal.addEventListener("click", (e) => {
    if (e.target === lineModal) {
      closeLineModal();
    }
  });

  if (shareLineBtn) {
    shareLineBtn.addEventListener("click", () => {
      const text = lineTextOutput.value;
      if (navigator.share) {
        navigator.share({
          title: "2027 外展服事通告",
          text: text
        }).catch(() => {});
      } else {
        navigator.clipboard.writeText(text).then(() => {
          showToast("文案已複製！");
        });
      }
    });
  }

  lineTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      lineTabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      updateLineText(tab.dataset.tab);
    });
  });

  function updateLineText(type) {
    lineCopySuccessNotice.style.display = "none";
    let text = "";

    if (type === "year-summary") {
      text = `🌟【2027 年度外展事工總表 2027 Outreach Schedule】🌟
願神親自引導祝福團隊夥伴全年的每一步腳蹤！

【每月週二 7:30PM-9:30PM 月聚集】場地：Kids Central
1/26, 2/23, 3/23, 4/27, 5/25, 6/29, 7/27, 8/31, 9/21, 10/26, 11/23, 12/21

【核心夥伴季聚集】週四 7:30PM-9:30PM 場地：副堂
Q1: 3/4 | Q2: 6/3 | Q3: 9/2 | Q4: 12/2

【伯大尼基金會兒少服事】週五 6:30PM-9:00PM
教材：Hope Kids 兒童主日學教案
1/29 創世紀 | 3/12 出埃及記 | 4/23 利未記
5/28 民數記 | 6/25 申命記 | 7/30 約書亞
8/27 士師記 | 9/24 路得記 | 10/22 撒母耳記
11/26 奉獻相關 | 12/10 歡慶耶穌聖誕

【天使樹事工 Angel Tree】
• 2026/12/5 (六) 聖誕送禮開跑典禮籌備
• 2026/12/10 ~ 12/20 聖誕送禮與分組探訪 (預計10個家庭，報名13位)
• 2027/1/30 (六) 10AM-3PM 圍爐活動（徵求攝影、錄影、剪輯同工）
• 2027/3/6, 3/13, 3/20, 3/27 (六) 9AM-12:30PM 第三屆關懷大隊特訓（校園書房4F 免費附午餐）
• 2027/4/5 (一) 10:30AM-3:30PM 兒童節協辦（採茶/烤肉/闖關）
• 2027/7/10-7/11 快樂營協辦（新竹聖經書院）
• 2027/9月 進監送禮推廣（雙北400家庭/500禮物/100間教會）
• 2027/12/4 (六) 10:00AM-1:30PM 開跑典禮協辦＆頒發獎助學金（仁愛堂浸信會）

【多走一哩路 ＆ 偏鄉宣教】
• 多走一哩路：台南 1/23, 中區 3/13, 北區 4/10
• 偏鄉探訪：達谷婻 3月, 田埔 11月
• 暑期短宣：達谷婻 7月, 田埔 7月
• 營隊：花蓮市區(1-2月), 花蓮光復(7-8月), 福隆 SHOUT CAMP

【合作機構】
9月監獄家庭日 | 11月監獄洗禮 | 12月青年歸主 Afterschool | 醒吾大學校園事工`;
    } else if (type === "bethany-series") {
      text = `👶【2027 伯大尼基金會兒少服事時間表】
⏰ 時間：每場週五 6:30PM - 9:00PM
📍 地點：伯大尼兒少家庭基金會 (文山區保儀路129號)
🗺️ 導航：https://maps.app.goo.gl/hSVuz1nydria9Ui39
📖 使用教材：Hope Kids 兒童主日學教案

1/29 (五) 創世紀
3/12 (五) 出埃及記
4/23 (五) 利未記
5/28 (五) 民數記
6/25 (五) 申命記
7/30 (五) 約書亞
8/27 (五) 士師記
9/24 (五) 路得記
10/22 (五) 撒母耳記
11/26 (五) 奉獻相關
12/10 (五) 歡慶耶穌 (聖誕聯歡特會)

歡迎夥伴踴躍認領各堂次服事同工（活動帶領、敬拜、隊輔、點心）！`;
    } else if (type === "angel-series") {
      text = `🕊️【2026-2027 天使樹事工行程與招募】
邀請弟兄姊妹一同成為受刑人子女與家庭生命中的天使！

🎄【2026 天使樹最新聖誕送禮行動】
• 12/5 (六) 聖誕送禮開跑典禮籌備
• 12/10 (四) ~ 12/20 (日) 聖誕送禮（預計 10 個家庭，送禮後安排分組探訪時間與人力）
• 目前報名關懷夥伴：13 位
• 目前完成前置項目：
  1. 關懷夥伴招募說明：https://docs.google.com/presentation/d/1FU_Pb3D-sC_udnhg1__k37JydjaMb_j8/edit?slide=id.h11dcf76717e27257_0_0#slide=id.h11dcf76717e27257_0_0
  2. 關懷志工報名表：https://docs.google.com/forms/d/e/1FAIpQLSfszvilI7nUylWY0ye2wxAQoI6wDzzof0fXTL30_uq9-GgAZA/viewform?usp=sharing&ouid=101362833456397058496
  3. 關懷紀錄表：https://peterpeng-maker.github.io/care-record-system/

🌱【2027 年度規劃】
1. 1/30 (六) 10AM-3PM 關懷大隊圍爐活動
   急需：攝影、錄影的同工、剪輯志工！

2. 第三屆關懷大隊特訓（連續四個週六）
   時間：3/6, 3/13, 3/20, 3/27（六）9:00AM - 12:30PM
   地點：校園書房 4F 教室（捷運公館站4號出口）
   費用：免費，提供午餐
   攜帶物品：聖經、筆記本、筆、環保杯
   課後實習：參與關懷大隊（陪伴孩子三個月，學長姐帶著做）
   服事方式：請吃飯、喝下午茶、公園玩、打球（每月至少一次）＋每月團契時間

3. 4/5 (一) 10:30AM-3:30PM 兒童節協辦（可協辦或參加）
   內容：生態導覽 / 採茶體驗 / 烤肉 / 闖關 / 見證分享（費用免費）

4. 7/10 (六) - 7/11 (日) 快樂營協辦
   地點：新竹聖經書院（可認領活動、節目、隊輔、攝影）

5. 9月 送禮推廣：進監探訪，填寫禮物卡（雙北400家庭/500份禮物/100間教會）
6. 12/4 (六) 10:00AM-1:30PM 送禮開跑典禮協辦＆頒發獎學金（仁愛堂浸信會）`;
    } else if (type === "q1") {
      text = `🌱【2027 第一季 Q1 外展重點行事曆】
1月：
• 1/23 (六) 多走一哩路【台南站】（北門遊客中心）
• 1/26 (二) 7:30PM 月聚集 @ Kids Central
• 1/29 (五) 6:30PM 伯大尼服事 #1 (創世紀)
• 1/30 (六) 10AM-3PM 天使樹關懷大隊圍爐活動 (急徵攝影/錄影/剪輯)

2月：
• 1-2月 寒假兒少希望營隊 @ 花蓮市區
• 2/23 (二) 7:30PM 月聚集 @ Kids Central

3月：
• 3/4 (四) 7:30PM 核心夥伴季聚集 Q1 @ 副堂
• 3/6, 3/13, 3/20, 3/27 (連續四個週六) 9:00AM 第三屆關懷大隊特訓 @ 校園書房4F
• 3/12 (五) 6:30PM 伯大尼服事 #2 (出埃及記)
• 3/13 (六) 多走一哩路【中區站】（沙鹿區公所前廣場）
• 3/23 (二) 7:30PM 月聚集 @ Kids Central
• 3月中 偏鄉探訪：南投達谷婻部落`;
    } else if (type === "q2") {
      text = `☀️【2027 第二季 Q2 外展重點行事曆】
4月：
• 4/5 (一) 10:30AM-3:30PM 天使樹兒童節採茶烤肉嘉年華
• 4/10 (六) 多走一哩路【北區站】（竹東火車站）
• 4/23 (五) 6:30PM 伯大尼服事 #3 (利未記)
• 4/27 (二) 7:30PM 月聚集 @ Kids Central

5月：
• 5/25 (二) 7:30PM 月聚集 @ Kids Central
• 5/28 (五) 6:30PM 伯大尼服事 #4 (民數記)
• 5月中 (籌備中) 上半年監獄福音佈道會

6月：
• 6/3 (四) 7:30PM 核心夥伴季聚集 Q2 @ 副堂
• 6/25 (五) 6:30PM 伯大尼服事 #5 (申命記)
• 6/29 (二) 7:30PM 月聚集 (暑期短宣差遣) @ Kids Central`;
    }

    lineTextOutput.value = text;
  }

  copyLineTextBtn.addEventListener("click", () => {
    lineTextOutput.select();
    navigator.clipboard.writeText(lineTextOutput.value).then(() => {
      lineCopySuccessNotice.style.display = "inline";
      showToast("Line 文案已成功複製到剪貼簿！");
    });
  });

  // ==========================================
  // Search & Filters Handling
  // ==========================================
  searchInput.addEventListener("input", (e) => {
    searchQuery = e.target.value;
    clearSearchBtn.style.display = searchQuery ? "block" : "none";
    renderAll();
  });

  clearSearchBtn.addEventListener("click", () => {
    searchInput.value = "";
    searchQuery = "";
    clearSearchBtn.style.display = "none";
    renderAll();
  });

  filterPills.forEach(pill => {
    pill.addEventListener("click", () => {
      filterPills.forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      currentCategory = pill.dataset.category;
      renderAll();
      // 在事工專案匯整畫面時，自動 scroll 到對應卡片
      if (currentView === "ministry" && currentCategory !== "all") {
        setTimeout(() => {
          const card = document.getElementById(`ministryCard-${currentCategory}`);
          if (card) {
            card.scrollIntoView({ behavior: "smooth", block: "start" });
            card.classList.add("card-jump-highlight");
            card.addEventListener("animationend", () => card.classList.remove("card-jump-highlight"), { once: true });
          }
        }, 80);
      }
    });
  });

  resetFilterBtn.addEventListener("click", () => {
    currentCategory = "all";
    searchQuery = "";
    searchInput.value = "";
    clearSearchBtn.style.display = "none";
    filterPills.forEach(p => p.classList.toggle("active", p.dataset.category === "all"));
    renderAll();
  });

  // ==========================================
  // Views Switching (Desktop Tabs & Mobile Bottom Nav)
  // ==========================================
  function switchView(viewName) {
    currentView = viewName;

    // Update Desktop Tabs
    viewTabs.forEach(tab => {
      tab.classList.toggle("active", tab.dataset.view === viewName);
    });

    // Update Mobile Bottom Nav
    bottomNavItems.forEach(item => {
      item.classList.toggle("active", item.dataset.view === viewName);
    });

    // Update View Sections
    viewSections.forEach(sec => {
      sec.classList.toggle("active", sec.id === `${viewName}View`);
    });

    // Smooth scroll to top on mobile
    if (window.innerWidth <= 768) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  viewTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      switchView(tab.dataset.view);
    });
  });

  function initMobileNavigation() {
    // Mobile search button toggle
    if (mobileSearchToggleBtn && searchBoxContainer) {
      mobileSearchToggleBtn.addEventListener("click", () => {
        searchBoxContainer.classList.toggle("mobile-open");
        if (searchBoxContainer.classList.contains("mobile-open")) {
          searchInput.focus();
        }
      });
    }

    // Mobile bottom navigation switching
    bottomNavItems.forEach(item => {
      item.addEventListener("click", () => {
        switchView(item.dataset.view);
      });
    });
  }

  // ==========================================
  // Year Selector Handling
  // ==========================================
  function initYearSelector() {
    const yearPills = document.querySelectorAll(".year-pill");
    yearPills.forEach(pill => {
      pill.addEventListener("click", () => {
        const year = pill.dataset.year;
        setYear(year);
      });
    });
  }

  function setYear(year) {
    selectedYear = year;

    // Update Pill Buttons
    document.querySelectorAll(".year-pill").forEach(pill => {
      pill.classList.toggle("active", pill.dataset.year === year);
    });

    // Update Header Brand Badge
    if (badgeYearText) {
      if (year === "all") {
        badgeYearText.textContent = "OUTREACH SCHEDULE (跨年度)";
      } else {
        badgeYearText.textContent = `${year} OUTREACH SCHEDULE`;
      }
    }

    // Update Section Headings
    if (matrixViewTitle) {
      matrixViewTitle.textContent = (year === "all") ? "跨年度 (全部) 12 個月份全景鳥瞰" : `${year} 年度 12 個月份全景鳥瞰`;
    }
    if (matrixViewSubtitle) {
      matrixViewSubtitle.textContent = (year === "all") 
        ? "整合呈現各年度所有月份事工安排" 
        : `適合領袖快速掌握 ${year} 年度各月份事工密集度、同工動員安排`;
    }
    if (timelineViewTitle) {
      timelineViewTitle.textContent = (year === "all") ? "跨年度全部外展詳細時間軸" : `${year} 全年外展詳細時間軸`;
    }

    // Sync Calendar if specific year selected
    if (year !== "all") {
      currentCalendarYear = parseInt(year);
      if (year === "2026") {
        currentCalendarMonth = 1; // 2026 完整 1-12 月行程，預設從 1 月開始
      } else if (year === "2027") {
        currentCalendarMonth = 1;
      }
    }

    renderAll();
  }

  function syncYearPillsFromCalendar() {
    const yearStr = String(currentCalendarYear);
    if (selectedYear !== "all" && selectedYear !== yearStr) {
      selectedYear = yearStr;
      document.querySelectorAll(".year-pill").forEach(pill => {
        pill.classList.toggle("active", pill.dataset.year === yearStr);
      });
      if (badgeYearText) badgeYearText.textContent = `${yearStr} OUTREACH SCHEDULE`;
      if (matrixViewTitle) matrixViewTitle.textContent = `${yearStr} 年度 12 個月份全景鳥瞰`;
      if (timelineViewTitle) timelineViewTitle.textContent = `${yearStr} 全年外展詳細時間軸`;
      renderMatrixView();
      renderTimelineView();
      renderMinistryView();
      updateFilterNotice();
      updateTotalStats();
    }
  }

  // Calendar month buttons with seamless cross-year flipping
  prevMonthBtn.addEventListener("click", () => {
    if (currentCalendarMonth > 1) {
      currentCalendarMonth--;
    } else {
      currentCalendarMonth = 12;
      currentCalendarYear--;
      syncYearPillsFromCalendar();
    }
    renderCalendarView();
  });

  nextMonthBtn.addEventListener("click", () => {
    if (currentCalendarMonth < 12) {
      currentCalendarMonth++;
    } else {
      currentCalendarMonth = 1;
      currentCalendarYear++;
      syncYearPillsFromCalendar();
    }
    renderCalendarView();
  });

  // ==========================================
  // Progressive Web App (PWA) & Offline Sync
  // ==========================================
  function initPWA() {
    // Register Service Worker for offline capability
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("./sw.js").then((reg) => {
          console.log("2027 Outreach PWA Service Worker Registered with scope:", reg.scope);
          // Check for service worker updates immediately
          reg.update();
        }).catch((err) => {
          console.warn("ServiceWorker registration failed:", err);
        });
      });
    }

    // Android/Chrome beforeinstallprompt event
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      deferredInstallPrompt = e;
      if (pwaInstallBtn) {
        pwaInstallBtn.style.display = "inline-flex";
      }
    });

    window.addEventListener("appinstalled", () => {
      if (pwaInstallBtn) {
        pwaInstallBtn.style.display = "none";
      }
      showToast("🎉 已成功將 2027 行事曆安裝至手機桌面！");
    });

    // iOS detection for Install Guide
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isStandalone = window.navigator.standalone === true || window.matchMedia("(display-mode: standalone)").matches;

    if (isIOS && !isStandalone && pwaInstallBtn) {
      pwaInstallBtn.style.display = "inline-flex";
    }

    if (pwaInstallBtn) {
      pwaInstallBtn.addEventListener("click", () => {
        if (deferredInstallPrompt) {
          deferredInstallPrompt.prompt();
          deferredInstallPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === "accepted") {
              pwaInstallBtn.style.display = "none";
            }
            deferredInstallPrompt = null;
          });
        } else if (isIOS) {
          openIosInstallModal();
        } else {
          showToast("可使用瀏覽器選單中的「安裝應用程式」或「加到主畫面」");
        }
      });
    }

    if (closeIosModalBtn) {
      closeIosModalBtn.addEventListener("click", closeIosInstallModal);
    }
    if (confirmIosModalBtn) {
      confirmIosModalBtn.addEventListener("click", closeIosInstallModal);
    }
    if (iosInstallModal) {
      iosInstallModal.addEventListener("click", (e) => {
        if (e.target === iosInstallModal) closeIosInstallModal();
      });
    }
  }

  function openIosInstallModal() {
    if (iosInstallModal) {
      iosInstallModal.style.display = "flex";
      document.body.classList.add("modal-open");
    }
  }

  function closeIosInstallModal() {
    if (iosInstallModal) {
      iosInstallModal.style.display = "none";
      document.body.classList.remove("modal-open");
    }
  }

  // ==========================================
  // Theme & Print
  // ==========================================
  function updateMetaThemeColor(isLight) {
    if (metaThemeColor) {
      metaThemeColor.setAttribute("content", isLight ? "#ffffff" : "#0a0f1d");
    }
  }

  function initTheme() {
    const saved = localStorage.getItem("outreach_schedule_theme");
    if (saved === "light") {
      document.body.classList.remove("dark-theme");
      document.body.classList.add("light-theme");
      themeIcon.textContent = "☀️";
      updateMetaThemeColor(true);
    } else {
      document.body.classList.add("dark-theme");
      document.body.classList.remove("light-theme");
      themeIcon.textContent = "🌙";
      updateMetaThemeColor(false);
    }
  }

  themeToggleBtn.addEventListener("click", () => {
    const isLight = document.body.classList.contains("light-theme");
    if (isLight) {
      document.body.classList.remove("light-theme");
      document.body.classList.add("dark-theme");
      themeIcon.textContent = "🌙";
      localStorage.setItem("outreach_schedule_theme", "dark");
      updateMetaThemeColor(false);
    } else {
      document.body.classList.remove("dark-theme");
      document.body.classList.add("light-theme");
      themeIcon.textContent = "☀️";
      localStorage.setItem("outreach_schedule_theme", "light");
      updateMetaThemeColor(true);
    }
  });

  if (printBtn) {
    printBtn.addEventListener("click", () => {
      window.print();
    });
  }

  // ==========================================
  // Google Sheets Database Integration
  // ==========================================
  const STORAGE_SHEET_URL = "outreach_sheet_url_2027";
  const STORAGE_SHEET_CACHE = "outreach_sheet_cache_2027";
  const STORAGE_SHEET_LAST_SYNC = "outreach_sheet_last_sync_2027";

  const sheetSyncBtn = document.getElementById("sheetSyncBtn");
  const syncStatusDot = document.getElementById("syncStatusDot");
  const sheetModal = document.getElementById("sheetModal");
  const closeSheetModalBtn = document.getElementById("closeSheetModalBtn");
  const sheetCurrentStatusDot = document.getElementById("sheetCurrentStatusDot");
  const sheetCurrentStatusText = document.getElementById("sheetCurrentStatusText");
  const sheetLastSyncTime = document.getElementById("sheetLastSyncTime");
  const sheetStatusDesc = document.getElementById("sheetStatusDesc");
  const sheetUrlInput = document.getElementById("sheetUrlInput");
  const testSheetSyncBtn = document.getElementById("testSheetSyncBtn");
  const sheetPushBtn = document.getElementById("sheetPushBtn");
  const copyGasScriptBtn = document.getElementById("copyGasScriptBtn");
  const syncIconSpin = document.getElementById("syncIconSpin");
  const resetSheetBtn = document.getElementById("resetSheetBtn");
  const saveAndSyncSheetBtn = document.getElementById("saveAndSyncSheetBtn");
  const adminPushToSheetBtn = document.getElementById("adminPushToSheetBtn");
  const adminConfigSheetBtn = document.getElementById("adminConfigSheetBtn");
  const adminSyncStatusLabel = document.getElementById("adminSyncStatusLabel");

  const GAS_SCRIPT_CODE = `/**
 * 2027 年度服事行事曆 - Google Apps Script (Web App) API 接收端
 * 部署設定：【網頁應用程式】➔ 誰可以存取設為【所有人 (Anyone)】
 */
var HEADERS = ["id","category","categoryName","title","date","time","dayOfWeek","month","location","locationUrl","topic","description","needs","itemsToBring","status"];

function doGet(e) {
  try {
    var sheet = getTargetSheet_();
    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return createJsonResponse_({ status: "success", count: 0, events: [], message: "試算表為空" });
    }
    var headerRow = data[0].map(function(h) { return String(h).trim(); });
    var events = [];
    for (var r = 1; r < data.length; r++) {
      var row = data[r];
      if (row.length === 0 || row.every(function(c) { return String(c).trim() === ""; })) continue;
      var item = {};
      for (var c = 0; c < headerRow.length; c++) {
        var key = headerRow[c];
        if (!key) continue;
        var val = row[c];
        if (val instanceof Date) {
          val = Utilities.formatDate(val, Session.getScriptTimeZone() || "Asia/Taipei", "yyyy-MM-dd");
        } else {
          val = val !== null && val !== undefined ? String(val).trim() : "";
        }
        item[key] = val;
      }
      if (item.month) item.month = parseInt(item.month, 10) || 1;
      if (item.title) {
        if (!item.id) item.id = "evt-" + r;
        events.push(item);
      }
    }
    return createJsonResponse_({ status: "success", count: events.length, events: events, lastUpdated: new Date().toISOString() });
  } catch (err) {
    return createJsonResponse_({ status: "error", message: err.toString() });
  }
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return createJsonResponse_({ status: "error", message: "缺少 POST 內容" });
    }
    var payload = JSON.parse(e.postData.contents);
    var events = Array.isArray(payload) ? payload : (payload.events || []);
    var sheet = getTargetSheet_();
    var lastRow = sheet.getLastRow();
    var lastCol = Math.max(sheet.getLastColumn(), HEADERS.length);
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    if (lastRow > 1) {
      sheet.getRange(2, 1, lastRow - 1, lastCol).clearContent();
    }
    if (events.length > 0) {
      var rows = events.map(function(item) {
        return HEADERS.map(function(h) {
          var v = item[h];
          return v !== undefined && v !== null ? String(v) : "";
        });
      });
      sheet.getRange(2, 1, rows.length, HEADERS.length).setValues(rows);
    }
    return createJsonResponse_({ status: "success", message: "成功寫入 " + events.length + " 筆活動至 Google 試算表！", count: events.length, timestamp: new Date().toISOString() });
  } catch (err) {
    return createJsonResponse_({ status: "error", message: err.toString() });
  }
}

function createJsonResponse_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function getTargetSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName("2027事工行事曆") || ss.getSheetByName("工作表1") || ss.getActiveSheet();
}

function setupSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("2027事工行事曆") || ss.getActiveSheet();
  sheet.setName("2027事工行事曆");
  var headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
  headerRange.setValues([HEADERS]);
  headerRange.setFontWeight("bold").setFontColor("#ffffff").setBackground("#1e293b").setHorizontalAlignment("center");
  sheet.setRowHeight(1, 36);
  sheet.setFrozenRows(1);
  Logger.log("✅ 試算表已完成格式初始化！");
}
`;

  function initGoogleSheetIntegration() {
    let savedUrl = localStorage.getItem(STORAGE_SHEET_URL);
    // Automatically apply user deployed Apps Script API if not set or outdated
    if (!savedUrl || savedUrl.trim() === "" || savedUrl.includes("AKfycb...") || !savedUrl.startsWith("https://script.google.com")) {
      savedUrl = DEFAULT_GAS_URL;
      localStorage.setItem(STORAGE_SHEET_URL, DEFAULT_GAS_URL);
    }
    const cachedData = localStorage.getItem(STORAGE_SHEET_CACHE);
    const lastSync = localStorage.getItem(STORAGE_SHEET_LAST_SYNC);

    if (savedUrl) {
      if (sheetUrlInput) sheetUrlInput.value = savedUrl;
      if (cachedData) {
        try {
          const parsed = JSON.parse(cachedData);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const cachedIds = new Set(parsed.map(e => e.id));
            const missingDefaults = (window.EVENTS_DATA || []).filter(e => !cachedIds.has(e.id));
            appEvents = [...parsed, ...missingDefaults];
          }
        } catch (e) {
          console.error("Failed to parse cached sheet data", e);
        }
      }
      const isGas = savedUrl.includes("script.google.com");
      updateSyncStatusUI(isGas ? "online-api" : "online-csv", lastSync, appEvents.length);
      // Auto refresh in background
      syncFromGoogleSheets(savedUrl, true);
    } else {
      updateSyncStatusUI("offline", null, appEvents.length);
    }

    const sheetConfigBtn = document.getElementById("sheetConfigBtn");

    // Event listeners
    if (sheetSyncBtn) {
      sheetSyncBtn.addEventListener("click", (e) => {
        e.preventDefault();
        const savedUrl = localStorage.getItem(STORAGE_SHEET_URL);
        if (savedUrl) {
          showToast("🔄 正在連線 Google 雲端同步資料...");
          syncFromGoogleSheets(savedUrl, false);
        } else {
          openSheetModal();
          showToast("💡 請先設定 Google Apps Script 或試算表發布網址");
          if (sheetUrlInput) sheetUrlInput.focus();
        }
      });
    }

    if (sheetConfigBtn) {
      sheetConfigBtn.addEventListener("click", () => {
        openSheetModal();
      });
    }

    if (closeSheetModalBtn) {
      closeSheetModalBtn.addEventListener("click", closeSheetModal);
    }

    if (sheetModal) {
      sheetModal.addEventListener("click", (e) => {
        if (e.target === sheetModal) closeSheetModal();
      });
    }

    // Pull from cloud
    if (testSheetSyncBtn) {
      testSheetSyncBtn.addEventListener("click", () => {
        const url = sheetUrlInput ? sheetUrlInput.value.trim() : "";
        if (!url) {
          showToast("請先輸入 Google Apps Script API 或試算表網址！");
          return;
        }
        syncFromGoogleSheets(url, false);
      });
    }

    // Push to cloud
    if (sheetPushBtn) {
      sheetPushBtn.addEventListener("click", () => {
        const url = sheetUrlInput ? sheetUrlInput.value.trim() : "";
        if (!url) {
          showToast("請先輸入 Google Apps Script (Web App) API 網址！");
          return;
        }
        pushToGoogleSheets(url, false);
      });
    }

    // Admin Panel Push
    if (adminPushToSheetBtn) {
      adminPushToSheetBtn.addEventListener("click", () => {
        const savedUrl = localStorage.getItem(STORAGE_SHEET_URL);
        if (!savedUrl) {
          openSheetModal();
          showToast("請先設定 Google Apps Script Web App 網址");
          return;
        }
        pushToGoogleSheets(savedUrl, false);
      });
    }

    if (adminConfigSheetBtn) {
      adminConfigSheetBtn.addEventListener("click", () => {
        openSheetModal();
      });
    }

    // Copy Apps Script code
    if (copyGasScriptBtn) {
      copyGasScriptBtn.addEventListener("click", () => {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(GAS_SCRIPT_CODE).then(() => {
            showToast("📋 已成功複製 Google Apps Script 腳本程式碼！");
          }).catch(() => {
            fallbackCopy(GAS_SCRIPT_CODE);
            showToast("📋 已成功複製腳本程式碼！");
          });
        } else {
          fallbackCopy(GAS_SCRIPT_CODE);
          showToast("📋 已成功複製腳本程式碼！");
        }
      });
    }

    // Save and Sync
    if (saveAndSyncSheetBtn) {
      saveAndSyncSheetBtn.addEventListener("click", () => {
        const url = sheetUrlInput ? sheetUrlInput.value.trim() : "";
        if (!url) {
          showToast("請輸入 Google Apps Script API 或試算表網址");
          return;
        }
        localStorage.setItem(STORAGE_SHEET_URL, url);
        syncFromGoogleSheets(url, false);
      });
    }

    // Reset button
    if (resetSheetBtn) {
      resetSheetBtn.addEventListener("click", () => {
        if (confirm("確定要清除 Google 雲端設定，還原為初始本地預設資料嗎？")) {
          localStorage.removeItem(STORAGE_SHEET_URL);
          localStorage.removeItem(STORAGE_SHEET_CACHE);
          localStorage.removeItem(STORAGE_SHEET_LAST_SYNC);
          if (sheetUrlInput) sheetUrlInput.value = "";
          appEvents = Array.isArray(window.EVENTS_DATA) ? [...window.EVENTS_DATA] : [];
          updateSyncStatusUI("offline", null, appEvents.length);
          renderAll();
          updateTotalStats();
          showToast("已還原為本機預設資料");
        }
      });
    }
  }

  function fallbackCopy(text) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
    } catch (e) {
      console.warn("execCommand copy failed", e);
    }
    document.body.removeChild(ta);
  }

  function openSheetModal() {
    if (sheetModal) {
      sheetModal.style.display = "flex";
      document.body.classList.add("modal-open");
      const savedUrl = localStorage.getItem(STORAGE_SHEET_URL);
      if (savedUrl && sheetUrlInput) {
        sheetUrlInput.value = savedUrl;
      }
    }
  }

  function closeSheetModal() {
    if (sheetModal) {
      sheetModal.style.display = "none";
      document.body.classList.remove("modal-open");
    }
  }

  function updateSyncStatusUI(status, lastSyncTime, eventCount) {
    const isGasApi = status === "online-api";
    const isOnline = status === "online" || isGasApi || status === "online-csv";

    if (syncStatusDot) {
      syncStatusDot.className = "status-indicator-dot " + (isOnline ? "dot-online" : status === "syncing" ? "dot-syncing" : "dot-offline");
      syncStatusDot.title = isGasApi ? "🟢 已連接 Google Apps Script API (雙向讀寫)" : isOnline ? "🔵 已連接 Google Sheets (CSV 唯讀)" : status === "syncing" ? "🟡 雲端資料同步中..." : "⚪ 目前使用本機離線資料";
    }

    if (sheetCurrentStatusDot) {
      sheetCurrentStatusDot.className = "status-indicator-dot " + (isOnline ? "dot-online" : status === "syncing" ? "dot-syncing" : "dot-offline");
    }

    if (sheetCurrentStatusText) {
      if (isGasApi) {
        sheetCurrentStatusText.textContent = `🟢 已連接 Google Apps Script API (雙向讀寫 · 共 ${eventCount} 筆)`;
      } else if (isOnline) {
        sheetCurrentStatusText.textContent = `🔵 已連接 Google 試算表 CSV (唯讀同步 · 共 ${eventCount} 筆)`;
      } else if (status === "syncing") {
        sheetCurrentStatusText.textContent = "🟡 正在與 Google 雲端進行資料同步...";
      } else {
        sheetCurrentStatusText.textContent = "⚪ 目前使用：本地預設資料 (離線備份)";
      }
    }

    if (adminSyncStatusLabel) {
      if (isGasApi) {
        adminSyncStatusLabel.innerHTML = `<span style="color:var(--color-gathering);">🟢 已連接 Apps Script API (支援一鍵推送到雲端)</span>`;
      } else if (isOnline) {
        adminSyncStatusLabel.innerHTML = `<span style="color:#38bdf8;">🔵 已連接 Google 試算表 (CSV 唯讀模式)</span>`;
      } else {
        adminSyncStatusLabel.textContent = "本地離線資料 (尚未設定雲端 API)";
      }
    }

    if (sheetLastSyncTime) {
      if (lastSyncTime) {
        const d = new Date(lastSyncTime);
        const timeStr = `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        sheetLastSyncTime.textContent = `上次同步: ${timeStr}`;
      } else {
        sheetLastSyncTime.textContent = "尚未連接雲端";
      }
    }

    if (sheetStatusDesc) {
      if (isGasApi) {
        sheetStatusDesc.innerHTML = `✨ <strong>雙向即時連線中</strong>：您可點選「從雲端拉取」獲取 Google 試算表最新修改，或點選「推送到雲端」將手機與本機新增/修改的事工直接寫回試算表！`;
      } else if (isOnline) {
        sheetStatusDesc.innerHTML = `已與 Google 試算表保持唯讀連線。在試算表修改內容後點擊同步即可更新。若想直接從網頁回寫試算表，可改用上方推薦的 Google Apps Script (Web App)！`;
      } else {
        sheetStatusDesc.innerHTML = `設定 Google Apps Script Web App 或試算表連結後，夥伴在試算表修改行程或您在 App 編輯活動，全體都會自動同步！`;
      }
    }
  }

  // Parse CSV function supporting quotes, commas, newlines
  function parseCSV(text) {
    const lines = [];
    let row = [""];
    let inQuotes = false;

    // Remove BOM if present
    if (text.charCodeAt(0) === 0xFEFF) {
      text = text.slice(1);
    }

    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      const next = text[i + 1];

      if (c === '"') {
        if (inQuotes && next === '"') {
          row[row.length - 1] += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (c === ',' && !inQuotes) {
        row.push("");
      } else if ((c === '\r' || c === '\n') && !inQuotes) {
        if (c === '\r' && next === '\n') {
          i++;
        }
        lines.push(row);
        row = [""];
      } else {
        row[row.length - 1] += c;
      }
    }
    if (row.length > 1 || row[0] !== "") {
      lines.push(row);
    }
    return lines;
  }

  function transformRowsToEvents(rows) {
    if (!rows || rows.length < 2) return [];
    const headers = rows[0].map(h => h.trim());
    const headerMap = {};
    headers.forEach((h, idx) => { headerMap[h] = idx; });

    const getVal = (row, key, defaultVal = "") => {
      const idx = headerMap[key];
      if (idx !== undefined && row[idx] !== undefined) {
        return row[idx].trim();
      }
      return defaultVal;
    };

    const events = [];
    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      // Skip empty rows
      if (row.length === 0 || row.every(col => col.trim() === "")) continue;

      const title = getVal(row, "title");
      if (!title) continue;

      const dateStr = getVal(row, "date", "2027-01-01");
      let monthNum = parseInt(getVal(row, "month", "0"), 10);
      if (!monthNum || isNaN(monthNum)) {
        const parts = dateStr.split("-");
        if (parts.length >= 2) monthNum = parseInt(parts[1], 10);
        else monthNum = 1;
      }

      const category = getVal(row, "category", "gathering");
      let categoryName = getVal(row, "categoryName");
      if (!categoryName && CATEGORY_MAP[category]) {
        categoryName = CATEGORY_MAP[category].label;
      }

      events.push({
        id: getVal(row, "id", `evt-${r}`),
        category: category,
        categoryName: categoryName || "未分類",
        title: title,
        date: dateStr,
        time: getVal(row, "time", "時間待定"),
        dayOfWeek: getVal(row, "dayOfWeek", ""),
        month: monthNum,
        location: getVal(row, "location", "地點待定"),
        locationUrl: getVal(row, "locationUrl", ""),
        topic: getVal(row, "topic", ""),
        description: getVal(row, "description", ""),
        needs: getVal(row, "needs", ""),
        itemsToBring: getVal(row, "itemsToBring", ""),
        status: getVal(row, "status", "confirmed")
      });
    }
    return events;
  }

  async function syncFromGoogleSheets(url, isSilent = false) {
    if (!url) return;
    try {
      updateSyncStatusUI("syncing", localStorage.getItem(STORAGE_SHEET_LAST_SYNC), appEvents.length);
      if (syncIconSpin) syncIconSpin.classList.add("spin");
      const syncHeaderIcon = document.getElementById("syncHeaderIcon");
      if (syncHeaderIcon) syncHeaderIcon.classList.add("spin");

      // Auto convert standard Google Sheets edit URL to published CSV URL if user pasted standard link
      let fetchUrl = url.trim();
      const sheetMatch = fetchUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (sheetMatch && !fetchUrl.includes("output=csv") && !fetchUrl.includes("/pub") && !fetchUrl.includes("gviz")) {
        const sheetId = sheetMatch[1];
        // Convert to export CSV link
        fetchUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
      }

      const res = await fetch(fetchUrl, { cache: "no-store", redirect: "follow" });
      if (!res.ok) {
        throw new Error(`HTTP 狀態碼 ${res.status}`);
      }

      const text = await res.text();
      let newEvents = [];

      // Check if response is JSON (e.g. from Apps Script) or CSV
      const trimmed = text.trim();
      if (trimmed.startsWith("[") || (trimmed.startsWith("{") && (trimmed.includes("events") || trimmed.includes("status")))) {
        const json = JSON.parse(trimmed);
        if (json.status === "error") {
          throw new Error(json.message || "Google Apps Script 執行錯誤");
        }
        newEvents = Array.isArray(json) ? json : (json.events || []);
      } else {
        const rows = parseCSV(text);
        newEvents = transformRowsToEvents(rows);
      }

      if (newEvents.length === 0) {
        if (!isSilent) {
          if (confirm("雲端試算表目前為空（尚無任何活動資料）。\n\n是否立即將目前的 53 筆活動推送到 Google 試算表？")) {
            await pushToGoogleSheets(url, false);
            return;
          }
        }
        throw new Error("無法從試算表中辨識出有效的事工活動資料，請確認欄位標題是否正確。");
      }

      // Merge with official default events so 2026/2027 defaults are not lost
      const sheetIds = new Set(newEvents.map(e => e.id));
      const missingDefaults = (window.EVENTS_DATA || []).filter(e => !sheetIds.has(e.id));
      appEvents = [...newEvents, ...missingDefaults];
      const now = new Date().toISOString();
      localStorage.setItem(STORAGE_SHEET_URL, url);
      localStorage.setItem(STORAGE_SHEET_CACHE, JSON.stringify(appEvents));
      localStorage.setItem(STORAGE_CUSTOM_EVENTS, JSON.stringify(appEvents));
      localStorage.setItem(STORAGE_SHEET_LAST_SYNC, now);

      const isGas = url.includes("script.google.com");
      updateSyncStatusUI(isGas ? "online-api" : "online-csv", now, appEvents.length);
      renderAll();
      updateTotalStats();

      if (!isSilent) {
        showToast(`🎉 成功同步！已載入 ${appEvents.length} 筆最新外展行程`);
        closeSheetModal();
      }
    } catch (err) {
      console.error("Google Sheets sync error:", err);
      updateSyncStatusUI("offline", localStorage.getItem(STORAGE_SHEET_LAST_SYNC), appEvents.length);
      if (!isSilent) {
        alert("同步失敗：" + err.message + "\n\n排查提示：\n1. 若為 Google Apps Script，請確認部署時「誰可以存取」已設為「所有人 (Anyone)」。\n2. 若為 Google 試算表 CSV，請確認已發布到網絡。");
      }
    } finally {
      if (syncIconSpin) syncIconSpin.classList.remove("spin");
      const syncHeaderIcon = document.getElementById("syncHeaderIcon");
      if (syncHeaderIcon) syncHeaderIcon.classList.remove("spin");
    }
  }

  async function pushToGoogleSheets(url, isSilent = false) {
    if (!url) {
      openSheetModal();
      showToast("💡 請先設定 Google Apps Script Web App 網址");
      return false;
    }

    if (!url.includes("script.google.com")) {
      alert("「推送到雲端」功能需要使用 Google Apps Script (Web App) API 網址。\n\n目前輸入的網址是 Google 試算表 CSV 連結（僅支援唯讀下載）。\n請參考彈窗內的【3 分鐘設定 Google Apps Script】建立 Web App 即可享受一鍵雙向讀寫！");
      return false;
    }

    try {
      updateSyncStatusUI("syncing", localStorage.getItem(STORAGE_SHEET_LAST_SYNC), appEvents.length);
      if (syncIconSpin) syncIconSpin.classList.add("spin");
      const syncHeaderIcon = document.getElementById("syncHeaderIcon");
      if (syncHeaderIcon) syncHeaderIcon.classList.add("spin");
      showToast("⏳ 正在將活動寫入 Google 試算表...");

      const payload = {
        action: "sync_all",
        events: appEvents
      };

      const res = await fetch(url.trim(), {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error(`HTTP 狀態碼 ${res.status}`);
      }

      const text = await res.text();
      let result = {};
      try {
        result = JSON.parse(text);
      } catch (e) {
        result = { status: "success", message: text };
      }

      if (result.status === "error") {
        throw new Error(result.message || "Google Apps Script 寫入失敗");
      }

      const now = new Date().toISOString();
      localStorage.setItem(STORAGE_SHEET_URL, url);
      localStorage.setItem(STORAGE_SHEET_CACHE, JSON.stringify(appEvents));
      localStorage.setItem(STORAGE_SHEET_LAST_SYNC, now);

      updateSyncStatusUI("online-api", now, appEvents.length);

      if (!isSilent) {
        showToast(`🎉 成功推送到雲端！已寫入 ${appEvents.length} 筆活動至 Google Sheets`);
      }
      return true;
    } catch (err) {
      console.error("Google Sheets push error:", err);
      updateSyncStatusUI("offline", localStorage.getItem(STORAGE_SHEET_LAST_SYNC), appEvents.length);
      if (!isSilent) {
        alert("推送到 Google 試算表失敗：" + err.message + "\n\n排查建議：\n1. 請確認 Apps Script 部署時【誰可以存取】是否設為【所有人 (Anyone)】。\n2. 網址結尾通常應為 /exec。\n3. 可直接在 Apps Script 執行一次 setupSheet() 確認試算表權限已開啟。");
      }
      return false;
    } finally {
      if (syncIconSpin) syncIconSpin.classList.remove("spin");
      const syncHeaderIcon = document.getElementById("syncHeaderIcon");
      if (syncHeaderIcon) syncHeaderIcon.classList.remove("spin");
    }
  }

  // ==========================================
  // Schedule Admin Edit Manager
  // ==========================================
  function initAdminManager() {
    const adminEditBtn = document.getElementById("adminEditBtn");
    const adminModal = document.getElementById("adminModal");
    const closeAdminModalBtn = document.getElementById("closeAdminModalBtn");
    const adminTabs = document.querySelectorAll(".admin-tab");
    const adminPanelList = document.getElementById("adminPanelList");
    const adminPanelAdd = document.getElementById("adminPanelAdd");
    const adminPanelExport = document.getElementById("adminPanelExport");
    const adminSearchInput = document.getElementById("adminSearchInput");
    const adminCategoryFilter = document.getElementById("adminCategoryFilter");
    const adminEventList = document.getElementById("adminEventList");
    const adminEventCount = document.getElementById("adminEventCount");
    const adminEventForm = document.getElementById("adminEventForm");
    const editEventId = document.getElementById("editEventId");
    const adminCancelEditBtn = document.getElementById("adminCancelEditBtn");
    const adminExportCsvBtn = document.getElementById("adminExportCsvBtn");
    const modalEditBtn = document.getElementById("modalEditBtn");

    // Delete confirm dialog elements
    const deleteConfirmDialog = document.getElementById("deleteConfirmDialog");
    const deleteConfirmName = document.getElementById("deleteConfirmName");
    const deleteCancelBtn = document.getElementById("deleteCancelBtn");
    const deleteConfirmBtn = document.getElementById("deleteConfirmBtn");
    let eventIdToDelete = null;

    // Form inputs
    const efTitle = document.getElementById("ef-title");
    const efCategory = document.getElementById("ef-category");
    const efStatus = document.getElementById("ef-status");
    const efDate = document.getElementById("ef-date");
    const efTime = document.getElementById("ef-time");
    const efLocation = document.getElementById("ef-location");
    const efLocationUrl = document.getElementById("ef-locationUrl");
    const efTopic = document.getElementById("ef-topic");
    const efDescription = document.getElementById("ef-description");
    const efNeeds = document.getElementById("ef-needs");
    const efItemsToBring = document.getElementById("ef-itemsToBring");
    const adminSaveEventBtn = document.getElementById("adminSaveEventBtn");

    function openAdminModal() {
      if (adminModal) {
        adminModal.style.display = "flex";
        document.body.classList.add("modal-open");
        switchAdminTab("list");
      }
    }

    function closeAdminModal() {
      if (adminModal) {
        adminModal.style.display = "none";
        document.body.classList.remove("modal-open");
      }
    }

    if (adminEditBtn) {
      adminEditBtn.addEventListener("click", openAdminModal);
    }

    if (closeAdminModalBtn) {
      closeAdminModalBtn.addEventListener("click", closeAdminModal);
    }

    if (adminModal) {
      adminModal.addEventListener("click", (e) => {
        if (e.target === adminModal) closeAdminModal();
      });
    }

    // Direct edit from Event Detail Modal
    if (modalEditBtn) {
      modalEditBtn.addEventListener("click", () => {
        if (!selectedEvent) return;
        const targetEvent = selectedEvent;
        closeEventModal();
        openAdminModal();
        populateFormForEdit(targetEvent);
      });
    }

    // Direct duplicate from Event Detail Modal
    const modalDuplicateBtn = document.getElementById("modalDuplicateBtn");
    if (modalDuplicateBtn) {
      modalDuplicateBtn.addEventListener("click", () => {
        if (!selectedEvent) return;
        const targetEvent = selectedEvent;
        closeEventModal();
        openAdminModal();
        duplicateEventToForm(targetEvent);
      });
    }

    // Tab Switching
    function switchAdminTab(tabName) {
      adminTabs.forEach(tab => {
        if (tab.dataset.adminTab === tabName) {
          tab.classList.add("active");
        } else {
          tab.classList.remove("active");
        }
      });

      if (adminPanelList) adminPanelList.style.display = tabName === "list" ? "flex" : "none";
      if (adminPanelAdd) adminPanelAdd.style.display = tabName === "add" ? "flex" : "none";
      if (adminPanelExport) adminPanelExport.style.display = tabName === "export" ? "flex" : "none";

      if (tabName === "list") {
        renderAdminEventList();
      } else if (tabName === "add") {
        if (!editEventId.value) {
          resetAdminForm();
        }
      } else if (tabName === "export") {
        if (adminEventCount) adminEventCount.textContent = appEvents.length;
      }
    }

    adminTabs.forEach(tab => {
      tab.addEventListener("click", () => {
        if (tab.dataset.adminTab === "add") {
          resetAdminForm();
        }
        switchAdminTab(tab.dataset.adminTab);
      });
    });

    // Reset Form for New Event
    function resetAdminForm() {
      if (adminEventForm) adminEventForm.reset();
      if (editEventId) editEventId.value = "";
      if (efCategory) efCategory.value = "gathering";
      if (efStatus) efStatus.value = "confirmed";
      if (adminSaveEventBtn) adminSaveEventBtn.textContent = "💾 儲存並新增活動";
      const addTab = document.querySelector('.admin-tab[data-admin-tab="add"]');
      if (addTab) addTab.textContent = "➕ 新增活動";
    }

    // Duplicate Event: Pre-fill form with copied data but no ID (saves as new event)
    function duplicateEventToForm(evt) {
      switchAdminTab("add");
      // Clear ID so it will be treated as a new event
      if (editEventId) editEventId.value = "";
      if (efTitle) efTitle.value = `${evt.title || ""} (複製)`;
      if (efCategory) efCategory.value = evt.category || "gathering";
      if (efStatus) efStatus.value = evt.status || "confirmed";
      // Pre-fill date from original so user can easily keep or adjust day/month
      if (efDate) efDate.value = evt.date || "";
      if (efTime) efTime.value = evt.time || "";
      if (efLocation) efLocation.value = evt.location || "";
      if (efLocationUrl) efLocationUrl.value = evt.locationUrl || "";
      if (efTopic) efTopic.value = evt.topic || "";
      if (efDescription) efDescription.value = evt.description || "";
      if (efNeeds) efNeeds.value = evt.needs || "";
      if (efItemsToBring) efItemsToBring.value = evt.itemsToBring || "";

      if (adminSaveEventBtn) adminSaveEventBtn.textContent = "💾 儲存為新活動";
      const addTab = document.querySelector('.admin-tab[data-admin-tab="add"]');
      if (addTab) addTab.textContent = "📋 複製新增";

      showToast("📋 已複製活動內容，請確認日期後儲存為新活動！");
    }

    // Populate Form for Editing Existing Event
    function populateFormForEdit(evt) {
      switchAdminTab("add");
      if (editEventId) editEventId.value = evt.id;
      if (efTitle) efTitle.value = evt.title || "";
      if (efCategory) efCategory.value = evt.category || "gathering";
      if (efStatus) efStatus.value = evt.status || "confirmed";
      if (efDate) efDate.value = evt.date || "";
      if (efTime) efTime.value = evt.time || "";
      if (efLocation) efLocation.value = evt.location || "";
      if (efLocationUrl) efLocationUrl.value = evt.locationUrl || "";
      if (efTopic) efTopic.value = evt.topic || "";
      if (efDescription) efDescription.value = evt.description || "";
      if (efNeeds) efNeeds.value = evt.needs || "";
      if (efItemsToBring) efItemsToBring.value = evt.itemsToBring || "";

      if (adminSaveEventBtn) adminSaveEventBtn.textContent = "💾 儲存修改內容";
      const addTab = document.querySelector('.admin-tab[data-admin-tab="add"]');
      if (addTab) addTab.textContent = "✏️ 編輯活動";
    }

    if (adminCancelEditBtn) {
      adminCancelEditBtn.addEventListener("click", () => {
        resetAdminForm();
        switchAdminTab("list");
      });
    }

    // Render Event List in Admin Panel
    function renderAdminEventList() {
      if (!adminEventList) return;
      const q = adminSearchInput ? adminSearchInput.value.trim().toLowerCase() : "";
      const cat = adminCategoryFilter ? adminCategoryFilter.value : "all";

      const filtered = appEvents.filter(evt => {
        const matchesCat = cat === "all" || evt.category === cat;
        let matchesQuery = true;
        if (q) {
          const text = `${evt.title} ${evt.location} ${evt.topic || ''} ${evt.date}`.toLowerCase();
          matchesQuery = text.includes(q);
        }
        return matchesCat && matchesQuery;
      });

      if (filtered.length === 0) {
        adminEventList.innerHTML = `<div style="text-align:center;padding:2.5rem 1rem;color:var(--text-muted);">無符合條件的活動</div>`;
        return;
      }

      adminEventList.innerHTML = filtered.map(evt => {
        const catInfo = CATEGORY_MAP[evt.category] || { label: evt.categoryName || "活動", badgeClass: "badge-gathering" };
        const statusBadge = evt.status === "tentative" ? `<span style="color:#f59e0b;font-weight:600;">(暫定)</span>` : "";
        return `
          <div class="admin-event-item" data-id="${evt.id}">
            <div class="admin-event-info">
              <div class="admin-event-title-row">
                <span class="badge ${catInfo.badgeClass}" style="font-size:0.75rem;padding:0.15rem 0.5rem;">${catInfo.label}</span>
                <span class="admin-event-title" title="${escapeHtml(evt.title)}">${escapeHtml(evt.title)}</span>
                ${statusBadge}
              </div>
              <div class="admin-event-meta">
                <span>📅 ${evt.date} (${evt.dayOfWeek || '待定'})</span>
                <span>⏰ ${escapeHtml(evt.time)}</span>
                <span>📍 ${escapeHtml(evt.location)}</span>
              </div>
            </div>
            <div class="admin-event-actions">
              <button class="btn-admin-action btn-admin-edit" data-id="${evt.id}" title="編輯此活動">
                ✏️ 編輯
              </button>
              <button class="btn-admin-action btn-admin-duplicate" data-id="${evt.id}" title="複製此活動（帶入所有欄位，可直接修改日期後儲存為新活動）">
                📋 複製
              </button>
              <button class="btn-admin-action btn-admin-delete" data-id="${evt.id}" title="刪除此活動">
                🗑️
              </button>
            </div>
          </div>
        `;
      }).join("");

      // Bind edit, duplicate, and delete button events
      adminEventList.querySelectorAll(".btn-admin-edit").forEach(btn => {
        btn.addEventListener("click", () => {
          const id = btn.dataset.id;
          const target = appEvents.find(e => e.id === id);
          if (target) {
            populateFormForEdit(target);
          }
        });
      });

      adminEventList.querySelectorAll(".btn-admin-duplicate").forEach(btn => {
        btn.addEventListener("click", () => {
          const id = btn.dataset.id;
          const target = appEvents.find(e => e.id === id);
          if (target) {
            duplicateEventToForm(target);
          }
        });
      });

      adminEventList.querySelectorAll(".btn-admin-delete").forEach(btn => {
        btn.addEventListener("click", () => {
          const id = btn.dataset.id;
          const target = appEvents.find(e => e.id === id);
          if (target) {
            eventIdToDelete = id;
            if (deleteConfirmName) deleteConfirmName.textContent = `「${target.title}」(${target.date})`;
            if (deleteConfirmDialog) deleteConfirmDialog.style.display = "flex";
          }
        });
      });
    }

    if (adminSearchInput) {
      adminSearchInput.addEventListener("input", renderAdminEventList);
    }
    if (adminCategoryFilter) {
      adminCategoryFilter.addEventListener("change", renderAdminEventList);
    }

    // Delete dialog handlers
    if (deleteCancelBtn) {
      deleteCancelBtn.addEventListener("click", () => {
        if (deleteConfirmDialog) deleteConfirmDialog.style.display = "none";
        eventIdToDelete = null;
      });
    }

    if (deleteConfirmBtn) {
      deleteConfirmBtn.addEventListener("click", () => {
        if (eventIdToDelete) {
          appEvents = appEvents.filter(e => e.id !== eventIdToDelete);
          saveCustomEvents();
          renderAll();
          updateTotalStats();
          renderAdminEventList();
          showToast("🗑️ 活動已刪除");
          if (deleteConfirmDialog) deleteConfirmDialog.style.display = "none";
          eventIdToDelete = null;
        }
      });
    }

    // Form Submit Handler (Add or Update)
    if (adminEventForm) {
      adminEventForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const id = editEventId ? editEventId.value.trim() : "";
        const title = efTitle.value.trim();
        const dateStr = efDate.value.trim();
        const locationStr = efLocation.value.trim();

        if (!title || !dateStr || !locationStr) {
          alert("請填寫活動標題、日期與地點！");
          return;
        }

        // Calculate month and day of week
        const d = new Date(dateStr + "T00:00:00");
        const days = ["週日", "週一", "週二", "週三", "週四", "週五", "週六"];
        const dayOfWeek = isNaN(d.getDay()) ? "" : days[d.getDay()];
        const monthNum = isNaN(d.getMonth()) ? 1 : d.getMonth() + 1;

        const categoryVal = efCategory.value;
        const categoryName = CATEGORY_MAP[categoryVal]?.label || "外展活動";

        if (id) {
          // Update existing
          const idx = appEvents.findIndex(item => item.id === id);
          if (idx !== -1) {
            appEvents[idx] = {
              ...appEvents[idx],
              title: title,
              category: categoryVal,
              categoryName: categoryName,
              status: efStatus.value,
              date: dateStr,
              time: efTime.value.trim() || "時間待定",
              dayOfWeek: dayOfWeek,
              month: monthNum,
              location: locationStr,
              locationUrl: efLocationUrl.value.trim(),
              topic: efTopic.value.trim(),
              description: efDescription.value.trim(),
              needs: efNeeds.value.trim(),
              itemsToBring: efItemsToBring.value.trim()
            };
            showToast(`✅ 已更新活動：${title}`);
          }
        } else {
          // Add new event
          const newId = `evt-${Date.now()}`;
          const newEvent = {
            id: newId,
            category: categoryVal,
            categoryName: categoryName,
            title: title,
            date: dateStr,
            time: efTime.value.trim() || "時間待定",
            dayOfWeek: dayOfWeek,
            month: monthNum,
            location: locationStr,
            locationUrl: efLocationUrl.value.trim(),
            topic: efTopic.value.trim(),
            description: efDescription.value.trim(),
            needs: efNeeds.value.trim(),
            itemsToBring: efItemsToBring.value.trim(),
            status: efStatus.value
          };
          appEvents.push(newEvent);
          // Sort events by date
          appEvents.sort((a, b) => (a.date || "").localeCompare(b.date || ""));
          showToast(`🎉 已成功新增活動：${title}`);
        }

        saveCustomEvents();
        renderAll();
        updateTotalStats();
        resetAdminForm();
        switchAdminTab("list");
      });
    }

    // Persist custom events to LocalStorage
    function saveCustomEvents() {
      try {
        localStorage.setItem(STORAGE_CUSTOM_EVENTS, JSON.stringify(appEvents));
        localStorage.setItem(STORAGE_SHEET_CACHE, JSON.stringify(appEvents));
      } catch (err) {
        console.error("Failed to save custom events to localStorage", err);
      }
    }

    // Export CSV (Compatible with Google Sheets)
    if (adminExportCsvBtn) {
      adminExportCsvBtn.addEventListener("click", () => {
        exportEventsToCsv();
      });
    }

    function exportEventsToCsv() {
      const headers = [
        "id", "category", "categoryName", "title", "date",
        "time", "dayOfWeek", "month", "location", "locationUrl",
        "topic", "description", "needs", "itemsToBring", "status"
      ];

      const escapeCsvCell = (val) => {
        if (val === undefined || val === null) return "";
        const str = String(val);
        if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      let csvContent = "\uFEFF"; // UTF-8 BOM to prevent Excel/Sheets garbled text
      csvContent += headers.join(",") + "\r\n";

      appEvents.forEach(evt => {
        const row = [
          escapeCsvCell(evt.id),
          escapeCsvCell(evt.category),
          escapeCsvCell(evt.categoryName),
          escapeCsvCell(evt.title),
          escapeCsvCell(evt.date),
          escapeCsvCell(evt.time),
          escapeCsvCell(evt.dayOfWeek),
          escapeCsvCell(evt.month),
          escapeCsvCell(evt.location),
          escapeCsvCell(evt.locationUrl),
          escapeCsvCell(evt.topic),
          escapeCsvCell(evt.description),
          escapeCsvCell(evt.needs),
          escapeCsvCell(evt.itemsToBring),
          escapeCsvCell(evt.status)
        ];
        csvContent += row.join(",") + "\r\n";
      });

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      const filename = `2027_Outreach_Schedule_Updated_${new Date().toISOString().slice(0, 10)}.csv`;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast(`📥 已成功匯出 ${appEvents.length} 筆活動 CSV！`);
    }

    function escapeHtml(str) {
      if (!str) return "";
      return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }
  }

  function showToast(msg) {
    if (toast) {
      toast.textContent = msg;
      toast.classList.add("show");
      setTimeout(() => {
        toast.classList.remove("show");
      }, 2800);
    }
  }

  // ==========================================
  // App Bootstrapping / Initialization
  // ==========================================
  try {
    initTheme();
    initYearSelector();
    updateTotalStats();
    initCalendarQuickSelect();
    initMatrixMonthChips();
    initMobileNavigation();
    initPWA();
    initGoogleSheetIntegration();
    initAdminManager();
    renderAll();
  } catch (initErr) {
    console.error("App initialization error:", initErr);
  }
});
