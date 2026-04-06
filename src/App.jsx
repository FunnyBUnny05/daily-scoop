import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [history, setHistory] = useState({});
  const [reminderTime, setReminderTime] = useState('17:00'); // Default to 5 PM
  const [currentDate, setCurrentDate] = useState(new Date());

  const THEME = {
    accent: '#00FFFF',
    bg: '#0A0A0A',
    surface: '#1E1E1E',
    text: '#FFFFFF',
    textDim: '#757575',
  };

  const getFormattedDate = (date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const todayStr = getFormattedDate(currentDate);
  const todayData = history[todayStr];
  const isTakenToday = !!todayData;

  useEffect(() => {
    loadData();

    // Check every minute if day has changed
    const interval = setInterval(() => {
      const now = new Date();
      if (now.getDate() !== currentDate.getDate()) {
        setCurrentDate(now);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [currentDate]);

  const loadData = () => {
    const storedHistory = localStorage.getItem('creatine_history');
    if (storedHistory) setHistory(JSON.parse(storedHistory));

    const storedTime = localStorage.getItem('reminder_time');
    if (storedTime) {
      setReminderTime(storedTime);
    } else {
      localStorage.setItem('reminder_time', '17:00');
    }
  };

  const scheduleReminder = (timeStr) => {
    setReminderTime(timeStr);
    localStorage.setItem('reminder_time', timeStr);
  };

  const markTaken = () => {
    const now = new Date();
    const newHistory = {
      ...history,
      [todayStr]: {
        taken: true,
        time: formatTime(now),
      }
    };
    setHistory(newHistory);
    localStorage.setItem('creatine_history', JSON.stringify(newHistory));
  };
  
  const generateICS = () => {
    const timeParts = reminderTime.split(':');
    const hours = timeParts[0].padStart(2, '0');
    const minutes = timeParts[1].padStart(2, '0');
    
    // Creating an ICS string for a daily recurring event at chosen time with an exact alarm
    // DTSTART uses a generic recent date (20240101) to begin the daily recurring rule forever
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Daily Scoop//Creatine Tracker//EN
BEGIN:VEVENT
UID:${new Date().getTime()}@dailyscoop.com
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTSTART:20240101T${hours}${minutes}00
RRULE:FREQ=DAILY
SUMMARY:Take Creatine! 🥄
DESCRIPTION:Don't lose those gains! Time for your daily scoop.
BEGIN:VALARM
TRIGGER:-PT0M
ACTION:DISPLAY
DESCRIPTION:Take Creatine!
END:VALARM
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'daily-scoop-alarm.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getRecentDays = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - i);
      days.push({
        dateStr: getFormattedDate(d),
        dayName: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'][d.getDay()],
        isToday: i === 0,
      });
    }
    return days;
  };

  return (
    <div className="container">
      <header className="header">
        <h1 className="title">Daily Scoop</h1>
        <p className="subtitle">Creatine Tracker</p>
      </header>

      <div className="calendar">
        {getRecentDays().map((day, idx) => {
          const taken = !!history[day.dateStr];
          return (
            <div key={idx} className="dayCol">
              <span className="dayText" style={{ color: day.isToday ? THEME.text : THEME.textDim }}>
                {day.dayName}
              </span>
              <div 
                className="dayCircle" 
                style={{
                  borderColor: day.isToday && !taken ? THEME.textDim : 'transparent',
                  backgroundColor: taken ? THEME.accent : THEME.surface,
                }}
              >
                {taken && <span className="check" style={{ color: '#000' }}>✓</span>}
              </div>
            </div>
          );
        })}
      </div>

      <main className="mainContent">
        {isTakenToday ? (
          <div className="statusBox" style={{ borderColor: THEME.accent }}>
            <h2 className="statusTitle" style={{ color: THEME.accent }}>Completed</h2>
            <p className="statusTime" style={{ color: THEME.text }}>Today at {todayData.time}</p>
          </div>
        ) : (
          <button 
            className="mainButton" 
            style={{ backgroundColor: THEME.accent }} 
            onClick={markTaken}
          >
            MARK AS TAKEN
          </button>
        )}
      </main>

      <footer className="footer">
        <p className="reminderLabel" style={{ color: THEME.textDim }}>Daily Reminder Time</p>
        <div className="timerControlRow">
          <input 
            type="time" 
            value={reminderTime}
            onChange={(e) => scheduleReminder(e.target.value)}
            className="timeInput"
            style={{ backgroundColor: THEME.surface, color: THEME.text }}
          />
          <button className="syncButton" onClick={generateICS} style={{ backgroundColor: THEME.surface, color: THEME.text }}>
             Sync Offline Alarm
          </button>
        </div>
      </footer>
    </div>
  );
}

export default App;
