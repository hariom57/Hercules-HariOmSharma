// --- Task and Level Definitions ---
const radarLabels = ['Physical', 'DEV', 'DSA', 'Social', 'Discipline', 'Mental'];
const categoryIndices = Object.fromEntries(radarLabels.map((cat, i) => [cat, i]));

const defaultTasks = [
  { name: "EXERCISE", completed: false, category: "Physical" },
  { name: "DEV", completed: false, category: "DEV" },
  { name: "DSA", completed: false, category: "DSA" },
  { name: "Journaling/meditating", completed: false, category: "Mental" },
  { name: "Networking", completed: false, category: "Social" },
  { name: "DNMB", completed: false, category: "Discipline" }, // Do Not Mind Bullshit
  { name: "NO SCROLLING", completed: false, category: "Discipline" }
];

const levels = [
  { name: "Shit", days: 0, icon: "💩" },
  { name: "Cat", days: 3, icon: "🐈" },
  { name: "Dog", days: 6, icon: "🐶" },
  { name: "Fox", days: 9, icon: "🦊" },
  { name: "Wolf", days: 12, icon: "🐺" },
  { name: "Jaguar", days: 14, icon: "🐆" },
  { name: "Tiger", days: 18, icon: "🐯" },
  { name: "Lion", days: 21, icon: "🦁" },
  { name: "KING", days: 30, icon: "👑" }
];

// --- Date Utilities ---
function getTodayStr() {
  return new Date().toISOString().split('T')[0];
}
function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}

// --- State ---
let allData = JSON.parse(localStorage.getItem('dawg_allData') || '{}');
let currentDate = getTodayStr();
let viewingDate = currentDate;

// --- Get/Set Data for a Date ---
function getDayData(dateStr) {
  if (!allData[dateStr]) {
    allData[dateStr] = {
      tasks: JSON.parse(JSON.stringify(defaultTasks)),
      allCompleted: false
    };
  }
  return allData[dateStr];
}
function saveAllData() {
  localStorage.setItem('dawg_allData', JSON.stringify(allData));
}

// --- DOM Elements ---
const taskList = document.getElementById('taskList');
const streakDisplay = document.getElementById('streakDisplay');
const calendar = document.getElementById('calendar');
const levelsDiv = document.getElementById('levels');
const physicalRating = document.getElementById('physicalRating');
const dateDisplay = document.getElementById('dateDisplay');
const prevDayBtn = document.getElementById('prevDayBtn');
const nextDayBtn = document.getElementById('nextDayBtn');
const ratingLabelSpan = document.querySelector('.rating span:first-child');
const ratingValueSpan = document.getElementById('physicalRating');

// --- Streaks ---
function calculateIndividualStreaks(asOfDateStr) {
  const streaks = new Array(defaultTasks.length).fill(0);
  const asOfDate = new Date(asOfDateStr);
  defaultTasks.forEach((_, taskIndex) => {
    let currentStreak = 0;
    let date = new Date(asOfDate);
    while (true) {
      const dateStr = date.toISOString().split('T')[0];
      const dayData = allData[dateStr];
      if (!dayData || !dayData.tasks[taskIndex].completed) break;
      currentStreak++;
      date.setDate(date.getDate() - 1);
    }
    streaks[taskIndex] = currentStreak;
  });
  return streaks;
}

// --- Render Tasks ---
function renderTasks() {
  const dayData = getDayData(viewingDate);
  const viewingStreaks = calculateIndividualStreaks(viewingDate);
  const currentStreaks = calculateIndividualStreaks(getTodayStr());
  taskList.innerHTML = '';
  dayData.tasks.forEach((task, i) => {
    const li = document.createElement('li');
    li.className = 'task-item';
    const cb = document.createElement('input');
    cb.type = "checkbox";
    cb.checked = task.completed;
    cb.addEventListener('change', () => toggleTask(i));
    li.appendChild(cb);
    const nameSpan = document.createElement('span');
    nameSpan.textContent = task.name;
    nameSpan.className = 'task-name';
    li.appendChild(nameSpan);
    const streakSpan = document.createElement('span');
    streakSpan.textContent = `🔥 ${viewingStreaks[i]} 🔥 ${currentStreaks[i]}`;
    streakSpan.className = 'task-streak';
    li.appendChild(streakSpan);
    taskList.appendChild(li);
  });
}

// --- Toggle Task Completion ---
function toggleTask(index) {
  const dayData = getDayData(viewingDate);
  const task = dayData.tasks[index];
  task.completed = !task.completed;
  dayData.allCompleted = dayData.tasks.every(t => t.completed);
  saveAllData();
  renderTasks();
  updateRadar();
  updateStreak();
}

// --- Calculate Current Streak (ending at today) ---
function calculateCurrentStreak() {
  let streak = 0;
  let date = new Date(getTodayStr());
  while (true) {
    const dateStr = date.toISOString().split('T')[0];
    const dayData = allData[dateStr];
    if (!dayData || !dayData.allCompleted) break;
    streak++;
    date.setDate(date.getDate() - 1);
  }
  return streak;
}

// --- Update Streak Display ---
function updateStreak() {
  const streak = calculateCurrentStreak();
  streakDisplay.textContent = `Current streak: ${streak} days`;
  updateLevel(streak);
}

// --- Render Calendar Dots (last 14 days) ---
function renderCalendar() {
  calendar.innerHTML = '';
  const today = new Date(getTodayStr());
  for (let i = 13; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const dayData = getDayData(dateStr);
    const dot = document.createElement('span');
    dot.className = 'calendar-dot';
    if (dayData.allCompleted) dot.classList.add('done');
    else dot.classList.add('missed');
    if (dateStr === viewingDate) dot.classList.add('today');
    calendar.appendChild(dot);
  }
}

// --- Render Levels ---
function updateLevel(streak) {
  let levelIdx = 0;
  for (let i = 0; i < levels.length; i++) {
    if (streak >= levels[i].days) levelIdx = i;
  }
  levelsDiv.innerHTML = '';
  levels.forEach((lvl, idx) => {
    const card = document.createElement('div');
    card.className = 'level-card' + (idx === levelIdx ? ' active' : '');
    card.innerHTML = `<div class="wolf-icon">${lvl.icon}</div>
      <div>${lvl.name}</div>
      <div>${lvl.days}+ days</div>`;
    levelsDiv.appendChild(card);
  });
}

// --- Radar Chart Setup ---
let skillData = Array(radarLabels.length).fill(0);
const radarChart = new Chart(document.getElementById('radarChart').getContext('2d'), {
  type: 'radar',
  data: {
    labels: radarLabels,
    datasets: [{
      label: 'Skills',
      data: skillData,
      backgroundColor: 'rgba(255, 45, 45, 0.3)',
      borderColor: '#ff0000',
      borderWidth: 2,
      pointBackgroundColor: '#ffd600'
    }]
  },
  options: {
    scales: {
      r: {
        min: 0,
        max: 12,
        pointLabels: {
          font: { size: 14, weight: 'bold', family: 'Segoe UI' },
          color: '#ff0000'
        },
        angleLines: { color: '#333' },
        grid: { color: '#333' },
        ticks: { display: false }
      }
    },
    plugins: {
      legend: { display: false }
    }
  }
});

// --- Rating Display State ---
let selectedRatingIndex = 0; // Default: Physical

function updateRatingDisplay(index, value) {
  ratingLabelSpan.textContent = radarLabels[index] + ' Rating';
  ratingValueSpan.textContent = String(value).padStart(3, '0');
}

// --- Radar Chart (Cumulative Progress) ---
function updateRadar() {
  const cumulativeScores = Array(radarLabels.length).fill(0);
  Object.keys(allData).sort().forEach(dateStr => {
    if (dateStr > viewingDate) return;
    allData[dateStr].tasks.forEach(task => {
      const idx = categoryIndices[task.category];
      if (task.completed && idx !== undefined) cumulativeScores[idx]++;
    });
  });
  for (let i = 0; i < cumulativeScores.length; i++) {
    radarChart.data.datasets[0].data[i] = cumulativeScores[i];
  }
  radarChart.update();
  updateRatingDisplay(selectedRatingIndex, cumulativeScores[selectedRatingIndex]);
}

// --- Clickable Radar Labels ---
document.getElementById('radarChart').addEventListener('click', function(event) {
  const chart = radarChart;
  const canvasPosition = Chart.helpers.getRelativePosition(event, chart);
  const scale = chart.scales.r;
  for (let i = 0; i < radarLabels.length; i++) {
    const labelPos = scale.getPointPositionForValue(i, scale.max);
    const labelBoxSize = 80; // px
    if (
      Math.abs(canvasPosition.x - labelPos.x) < labelBoxSize / 2 &&
      Math.abs(canvasPosition.y - labelPos.y) < labelBoxSize / 2
    ) {
      selectedRatingIndex = i;
      updateRatingDisplay(i, radarChart.data.datasets[0].data[i]);
      break;
    }
  }
});

// --- Date Navigation ---
function updateDateDisplay() {
  dateDisplay.textContent = formatDate(viewingDate);
}
prevDayBtn.onclick = function() {
  const date = new Date(viewingDate);
  date.setDate(date.getDate() - 1);
  viewingDate = date.toISOString().split('T')[0];
  loadDay();
};
nextDayBtn.onclick = function() {
  const today = new Date(getTodayStr());
  const viewing = new Date(viewingDate);
  if (viewing < today) {
    viewing.setDate(viewing.getDate() + 1);
    viewingDate = viewing.toISOString().split('T')[0];
    loadDay();
  }
};

// --- Load Day ---
function loadDay() {
  renderTasks();
  updateRadar();
  renderCalendar();
  updateDateDisplay();
  updateStreak();
  const today = new Date(getTodayStr());
  const viewing = new Date(viewingDate);
  nextDayBtn.disabled = viewing >= today;
}

// --- Initialize ---
if (!allData[currentDate]) getDayData(currentDate);
loadDay();
