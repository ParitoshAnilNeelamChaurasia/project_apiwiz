document.addEventListener("DOMContentLoaded", function () {
  initApp();
});

function initApp() {
  const moodButtons = document.querySelectorAll(".mood-btn");
  const saveButton = document.getElementById("save-btn");
  const moodNote = document.getElementById("mood-note");
  const currentDateElement = document.getElementById("current-date");
  const currentMonthYearElement = document.getElementById("current-month-year");
  const calendarDaysElement = document.getElementById("calendar-days");
  const prevMonthButton = document.getElementById("prev-month");
  const nextMonthButton = document.getElementById("next-month");
  const notesListElement = document.getElementById("notes-list");
  const moodFilter = document.getElementById("mood-filter");
  const notification = document.getElementById("notification");

  let selectedMood = null;
  let currentDate = new Date();
  let currentMonth = currentDate.getMonth();
  let currentYear = currentDate.getFullYear();
  let entries = loadEntries();
  
const exportCsvButton = document.getElementById('export-csv');
exportCsvButton.addEventListener('click', exportToCsv);

function exportToCsv() {
    const headers = ['Date', 'Mood', 'Note', 'Temperature', 'Weather'];
    const rows = entries.map(entry => [
        entry.date,
        entry.mood,
        entry.note,
        entry.weather ? `${Math.round(entry.weather.temp)}°C` : 'N/A',
        entry.weather ? entry.weather.description : 'N/A'
    ]);
    let csvContent = headers.join(',') + '\n';
    rows.forEach(row => {
        csvContent += row.map(field => `"${field.replace(/"/g, '""')}"`).join(',') + '\n';
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `moodmate_entries_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

  updateCurrentDateDisplay();
  generateCalendar(currentMonth, currentYear);
  renderNotesList();
  fetchWeather();
  // Mood selection
  moodButtons.forEach((button) => {
    button.addEventListener("click", function () {
      moodButtons.forEach((btn) => btn.classList.remove("selected"));
      this.classList.add("selected");
      selectedMood = this.getAttribute("data-mood");
      document.body.style.backgroundColor = getMoodColor(selectedMood, 0.1);
    });
  });

  saveButton.addEventListener("click", function () {
    if (!selectedMood) {
      showNotification("Please select a mood first");
      return;
    }

    const noteText = moodNote.value.trim();
    const weatherData = getCurrentWeather();

    const newEntry = {
      date: formatDate(currentDate),
      mood: selectedMood,
      note: noteText || "No note added",
      weather: weatherData,
    };

    saveEntry(newEntry);
    entries = loadEntries(); 
    
    moodButtons.forEach((btn) => btn.classList.remove("selected"));
    moodNote.value = "";
    selectedMood = null;
    document.body.style.backgroundColor = "";
    
    generateCalendar(currentMonth, currentYear);
    renderNotesList();

    showNotification("Mood entry saved successfully!");
  });
  prevMonthButton.addEventListener("click", function () {
    currentMonth--;
    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
    }
    generateCalendar(currentMonth, currentYear);
  });

  nextMonthButton.addEventListener("click", function () {
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
    generateCalendar(currentMonth, currentYear);
  });

  moodFilter.addEventListener("change", function () {
    renderNotesList();
  });
  function updateCurrentDateDisplay() {
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    currentDateElement.textContent = currentDate.toLocaleDateString(
      undefined,
      options
    );
  }

function generateCalendar(month, year) {
    currentMonthYearElement.textContent = new Date(year, month).toLocaleDateString(undefined, { 
        month: 'long', 
        year: 'numeric' 
    });
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    calendarDaysElement.innerHTML = '';
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.classList.add('calendar-day', 'empty');
        calendarDaysElement.appendChild(emptyDay);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        dayElement.classList.add('calendar-day');
        
        const dayNumber = document.createElement('div');
        dayNumber.classList.add('calendar-day-number');
        dayNumber.textContent = day;
        dayElement.appendChild(dayNumber);
        
        const dateStr = formatDate(new Date(year, month, day));
        const dayEntry = entries.find(entry => entry.date === dateStr);
        
        if (dayEntry) {
            dayElement.classList.add('has-entry', dayEntry.mood);
            
            const moodIcon = document.createElement('div');
            moodIcon.classList.add('day-mood');
            moodIcon.textContent = getMoodEmoji(dayEntry.mood);
            dayElement.appendChild(moodIcon);
            
            if (dayEntry.weather) {
                const weatherIcon = document.createElement('div');
                weatherIcon.classList.add('day-weather');
                weatherIcon.textContent = getWeatherIcon(dayEntry.weather.main);
                dayElement.appendChild(weatherIcon);
            }
            
            // Add tooltip
            const tooltip = document.createElement('div');
            tooltip.classList.add('calendar-day-tooltip');
            
            let tooltipContent = `${capitalizeFirstLetter(dayEntry.mood)}`;
            if (dayEntry.note && dayEntry.note !== 'No note added') {
                tooltipContent += `: ${dayEntry.note}`;
            }
            if (dayEntry.weather) {
                tooltipContent += ` (${Math.round(dayEntry.weather.temp)}°C ${dayEntry.weather.description})`;
            }
            
            tooltip.textContent = tooltipContent;
            dayElement.appendChild(tooltip);
        }
        
        if (day === currentDate.getDate() && month === currentDate.getMonth() && year === currentDate.getFullYear()) {
            dayElement.classList.add('today');
        }
        
        dayElement.addEventListener('click', function() {
            const clickedDate = new Date(year, month, day);
            showEntriesForDate(clickedDate);
        });
        
        calendarDaysElement.appendChild(dayElement);
    }
}

  function renderNotesList() {
    const filterValue = moodFilter.value;
    let filteredEntries = [...entries];

    if (filterValue !== "all") {
      filteredEntries = entries.filter((entry) => entry.mood === filterValue);
    }

    // Sort entries by date (newest first)
    filteredEntries.sort((a, b) => new Date(b.date) - new Date(a.date));

    notesListElement.innerHTML = "";

    if (filteredEntries.length === 0) {
      const noEntries = document.createElement("div");
      noEntries.classList.add("note-item");
      noEntries.textContent = "No entries found";
      notesListElement.appendChild(noEntries);
      return;
    }

    filteredEntries.forEach((entry) => {
      const noteItem = document.createElement("div");
      noteItem.classList.add("note-item");

      const noteContent = document.createElement("div");
      noteContent.classList.add("note-content");
      noteContent.innerHTML = `<strong>${getMoodEmoji(
        entry.mood
      )} ${capitalizeFirstLetter(entry.mood)}</strong> - ${entry.note}`;

      const noteDate = document.createElement("div");
      noteDate.classList.add("note-date");
      noteDate.textContent = entry.date;

      if (entry.weather) {
        const weatherInfo = document.createElement("div");
        weatherInfo.classList.add("weather-info");
        weatherInfo.innerHTML = `${getWeatherIcon(
          entry.weather.main
        )} ${Math.round(entry.weather.temp)}°C`;
        noteDate.appendChild(weatherInfo);
      }

      noteItem.appendChild(noteContent);
      noteItem.appendChild(noteDate);
      notesListElement.appendChild(noteItem);
    });
  }

  function showEntriesForDate(date) {
    const dateStr = formatDate(date);
    const dateEntries = entries.filter((entry) => entry.date === dateStr);

    if (dateEntries.length > 0) {
      // Temporarily set filter to show all
      moodFilter.value = "all";
      renderNotesList();

      // Scroll to the first entry for that date
      const firstEntryIndex = entries.findIndex(
        (entry) => entry.date === dateStr
      );
      if (firstEntryIndex !== -1) {
        const noteItems = document.querySelectorAll(".note-item");
        if (noteItems.length > firstEntryIndex) {
          noteItems[firstEntryIndex].scrollIntoView({
            behavior: "smooth",
            block: "nearest",
          });

          // Highlight the entry
          noteItems[firstEntryIndex].style.backgroundColor =
            "rgba(106, 90, 205, 0.2)";
          setTimeout(() => {
            noteItems[firstEntryIndex].style.backgroundColor = "";
          }, 2000);
        }
      }
    } else {
      showNotification("No entries found for this date");
    }
  }

  function showNotification(message) {
    notification.textContent = message;
    notification.classList.add("show");

    setTimeout(() => {
      notification.classList.remove("show");
    }, 3000);
  }

  function getMoodEmoji(mood) {
    const emojis = {
      happy: "😊",
      sad: "😢",
      angry: "😠",
      calm: "😌",
      excited: "🤩",
    };
    return emojis[mood] || "";
  }

  function getMoodColor(mood, opacity = 1) {
    const colors = {
      happy: `rgba(255, 221, 89, ${opacity})`,
      sad: `rgba(84, 160, 255, ${opacity})`,
      angry: `rgba(255, 107, 107, ${opacity})`,
      calm: `rgba(29, 209, 161, ${opacity})`,
      excited: `rgba(243, 104, 224, ${opacity})`,
    };
    return colors[mood] || "";
  }

  function getWeatherIcon(weatherMain) {
    const icons = {
      Clear: "☀️",
      Clouds: "☁️",
      Rain: "🌧️",
      Thunderstorm: "⛈️",
      Snow: "❄️",
      Mist: "🌫️",
      Fog: "🌫️",
      Drizzle: "🌦️",
    };
    return icons[weatherMain] || "🌈";
  }

  function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  function formatDate(date) {
    const options = { month: "long", day: "numeric", year: "numeric" };
    return date.toLocaleDateString(undefined, options);
  }
}
