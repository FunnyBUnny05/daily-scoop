import { useState, useEffect } from 'react';
import './App.css';
import FlexCreature from './components/FlexCreature';

function App() {
  const [history, setHistory] = useState({});
  const [reminderTime, setReminderTime] = useState('17:00'); // Default to 5 PM
  const [currentDate, setCurrentDate] = useState(new Date());
  const [pushEnabled, setPushEnabled] = useState(false);

  // Permanent cloud backend on Render
  const BACKEND_URL = 'https://daily-scoop-backend-u83x.onrender.com';

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
    registerServiceWorker();

    // Check every minute if day has changed
    const interval = setInterval(() => {
      const now = new Date();
      if (now.getDate() !== currentDate.getDate()) {
        setCurrentDate(now);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [currentDate]);

  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const registerServiceWorker = async () => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.register('/daily-scoop/sw.js');
        console.log('Service Worker Registered');
        
        // Check if already subscribed
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          setPushEnabled(true);
        }
      } catch (error) {
        console.error('Service Worker Registration Failed:', error);
      }
    }
  };

  const enablePushNotifications = async () => {
    // Check 1: Is this browser capable?
    if (!('serviceWorker' in navigator)) {
        alert("Error: Service Workers not supported in this browser.");
        return;
    }
    if (!('PushManager' in window)) {
        alert("Error: PushManager not available. On iPhone, you MUST open this from a Home Screen icon (not Safari). Go to Safari → Share → Add to Home Screen, then reopen.");
        return;
    }
    if (!('Notification' in window)) {
        alert("Error: Notification API not available.");
        return;
    }

    try {
        // Step 1: Request notification permission FIRST (iOS requires this)
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          alert(`Notification permission was ${permission}. You need to allow notifications. Go to Settings > Daily Scoop > Notifications and enable them.`);
          return;
        }

        // Step 2: Wait for the service worker to be ready
        const registration = await navigator.serviceWorker.ready;
        
        // Step 3: Fetch the public key from our backend
        const response = await fetch(`${BACKEND_URL}/vapidPublicKey`);
        if (!response.ok) {
          alert(`Backend error: ${response.status} ${response.statusText}. Is the server running?`);
          return;
        }
        const vapidPublicKey = await response.text();
        
        // Sanity check the key
        if (vapidPublicKey.includes('<') || vapidPublicKey.length < 20) {
          alert(`Got invalid VAPID key from server (got HTML page instead of key). Backend tunnel may be blocked.`);
          return;
        }
        
        const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

        // Step 4: Subscribe to push
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey
        });

        // Step 5: Send the subscription to our backend
        await fetch(`${BACKEND_URL}/subscribe`, {
          method: 'POST',
          body: JSON.stringify(subscription),
          headers: {
            'content-type': 'application/json'
          }
        });

        setPushEnabled(true);
        alert("Success! You'll receive real push notifications at 5 PM if you forget.");
    } catch (e) {
        console.error('Push registration failed', e);
        // Show the REAL error so we can debug
        alert(`Push failed: ${e.name}: ${e.message}`);
    }
  };

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

    // Tell the backend we took it so it cancels the 5 PM push
    fetch(`${BACKEND_URL}/mark-taken`, { method: 'POST' }).catch(e => console.error(e));
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
SUMMARY:Creatine Check-In 🥄
DESCRIPTION:Did you take your creatine today? Open Daily Scoop to check.
BEGIN:VALARM
TRIGGER:-PT0M
ACTION:DISPLAY
DESCRIPTION:Did you take your creatine? Open Daily Scoop to check.
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
        <div className="creatureSpawnArea">
           <FlexCreature isActive={isTakenToday} />
        </div>
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
        <p className="reminderLabel" style={{ color: THEME.textDim }}>Reminds you 24h after your last dose</p>
        <button className="syncButton" onClick={enablePushNotifications} style={{ backgroundColor: pushEnabled ? THEME.accent : THEME.surface, color: pushEnabled ? '#000' : THEME.text }}>
           {pushEnabled ? "Push Enabled ✓" : "Enable Smart Push"}
        </button>
      </footer>
    </div>
  );
}

export default App;
