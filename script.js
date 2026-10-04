/**
 * ============================================================================
 * WEATHERLY — Modern Weather Web Application
 * ============================================================================
 * 
 * API CONFIGURATION:
 * 1. Sign up for a free API key at OpenWeatherMap: https://openweathermap.org/api
 * 2. Paste your API key in the API_KEY constant below.
 * ============================================================================
 */
const API_KEY = "ADD_YOUR_API_KEY"; // <-- REPLACE WITH YOUR OPENWEATHERMAP API KEY
// DOM Elements
const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const geoBtn = document.getElementById("geoBtn");
const themeToggle = document.getElementById("themeToggle");
const errorBanner = document.getElementById("errorBanner");
const errorMessage = document.getElementById("errorMessage");
const loadingState = document.getElementById("loadingState");
const dashboard = document.getElementById("dashboard");
const dynamicBgEffects = document.getElementById("dynamicBgEffects");

// Current Weather Elements
const cityNameEl = document.getElementById("cityName");
const currentDateEl = document.getElementById("currentDate");
const currentTempEl = document.getElementById("currentTemp");
const weatherIconEl = document.getElementById("weatherIcon");
const weatherConditionEl = document.getElementById("weatherCondition");
const feelsLikeEl = document.getElementById("feelsLike");

// Highlights Elements
const humidityValEl = document.getElementById("humidityVal");
const humidityDescEl = document.getElementById("humidityDesc");
const windValEl = document.getElementById("windVal");
const windDescEl = document.getElementById("windDesc");
const visibilityValEl = document.getElementById("visibilityVal");
const visibilityDescEl = document.getElementById("visibilityDesc");
const pressureValEl = document.getElementById("pressureVal");
const pressureDescEl = document.getElementById("pressureDesc");

// Forecast Elements
const dailyForecastContainer = document.getElementById("dailyForecastContainer");
const hourlyScrollContainer = document.getElementById("hourlyScrollContainer");
const hourlyTitle = document.getElementById("hourlyTitle");

// State
let currentForecastData = null; // Stores parsed 5-day / 3-hour forecast data grouped by day

// ==========================================
// Initialization & Event Listeners
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    initTheme();

    // Event Listeners for Search
    searchBtn.addEventListener("click", handleSearch);
    cityInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") handleSearch();
    });

    // Geolocation Listener
    geoBtn.addEventListener("click", handleGeolocation);

    // Theme Toggle Listener
    themeToggle.addEventListener("click", toggleTheme);

    // Initial default city search
    getWeatherData("New Delhi");
});

// ==========================================
// Theme Management (Dark/Light + LocalStorage)
// ==========================================
function initTheme() {
    const savedTheme = localStorage.getItem("weatherly_theme");
    if (savedTheme === "dark") {
        document.body.classList.add("dark-mode");
    } else {
        document.body.classList.remove("dark-mode");
    }
}

function toggleTheme() {
    document.body.classList.toggle("dark-mode");
    const isDark = document.body.classList.contains("dark-mode");
    localStorage.setItem("weatherly_theme", isDark ? "dark" : "light");
}

// ==========================================
// Search & API Handling
// ==========================================
function handleSearch() {
    const city = cityInput.value.trim();
    if (!city) {
        showError("Please enter a city name.");
        return;
    }
    getWeatherData(city);
}

function handleGeolocation() {
    if (!navigator.geolocation) {
        showError("Geolocation is not supported by your browser.");
        return;
    }

    showLoading(true);
    hideError();

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            getWeatherDataByCoords(latitude, longitude);
        },
        (error) => {
            showLoading(false);
            showError("Unable to retrieve your location. Please search manually.");
        }
    );
}

async function getWeatherData(city) {
    if (API_KEY === "YOUR_API_KEY_HERE") {
        showError("Please configure your OpenWeatherMap API key in script.js!");
        return;
    }

    showLoading(true);
    hideError();

    try {
        // 1. Fetch Current Weather
        const currentRes = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${API_KEY}`
        );
        if (!currentRes.ok) {
            throw new Error(currentRes.status === 404 ? "City not found. Please check spelling." : "Failed to fetch weather data.");
        }
        const currentData = await currentRes.json();

        // 2. Fetch 5-Day / 3-Hour Forecast
        const forecastRes = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&units=metric&appid=${API_KEY}`
        );
        if (!forecastRes.ok) {
            throw new Error("Failed to fetch forecast data.");
        }
        const forecastData = await forecastRes.json();

        processWeatherData(currentData, forecastData);
    } catch (error) {
        showLoading(false);
        showError(error.message);
    }
}

async function getWeatherDataByCoords(lat, lon) {
    if (API_KEY === "YOUR_API_KEY_HERE") {
        showError("Please configure your OpenWeatherMap API key in script.js!");
        return;
    }

    try {
        const currentRes = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
        );
        if (!currentRes.ok) throw new Error("Failed to fetch weather for your coordinates.");
        const currentData = await currentRes.json();

        const forecastRes = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
        );
        if (!forecastRes.ok) throw new Error("Failed to fetch forecast for your coordinates.");
        const forecastData = await forecastRes.json();

        processWeatherData(currentData, forecastData);
    } catch (error) {
        showLoading(false);
        showError(error.message);
    }
}

// ==========================================
// Data Processing & UI Rendering
// ==========================================
function processWeatherData(current, forecast) {
    showLoading(false);
    dashboard.classList.remove("hidden");

    // 1. Render Current Weather
    cityNameEl.textContent = `${current.name}, ${current.sys.country}`;
    currentDateEl.textContent = formatLocalDate(current.dt, current.timezone);
    currentTempEl.textContent = Math.round(current.main.temp);
    feelsLikeEl.textContent = Math.round(current.main.feels_like);
    
    const condition = current.weather[0].main;
    const description = current.weather[0].description;
    weatherConditionEl.textContent = capitalizeWords(description);
    
    setWeatherIcon(weatherIconEl, condition, current.dt, current.sys.sunrise, current.sys.sunset);

    // 2. Render Highlights
    const humidity = current.main.humidity;
    humidityValEl.textContent = `${humidity}%`;
    humidityDescEl.textContent = getHumidityDescription(humidity);

    const windSpeed = Math.round(current.wind.speed * 3.6); // m/s to km/h
    windValEl.textContent = `${windSpeed} km/h`;
    windDescEl.textContent = getWindDescription(windSpeed);

    const visibility = (current.visibility / 1000).toFixed(1); // meters to km
    visibilityValEl.textContent = `${visibility} km`;
    visibilityDescEl.textContent = getVisibilityDescription(visibility);

    const pressure = current.main.pressure;
    pressureValEl.textContent = `${pressure} hPa`;
    pressureDescEl.textContent = getPressureDescription(pressure);

    // 3. Process & Group 5-Day Forecast
    currentForecastData = groupForecastByDay(forecast.list);
    renderDailyForecast(currentForecastData);

    // Render Today's Hourly Forecast by default (first key)
    const firstDayKey = Object.keys(currentForecastData)[0];
    renderHourlyForecast(currentForecastData[firstDayKey], "Today");

    // 4. Apply Dynamic Weather UI Theme
    applyDynamicTheme(condition, current.dt, current.sys.sunrise, current.sys.sunset);
}

// Group 3-hour forecast list into daily collections
function groupForecastByDay(list) {
    const grouped = {};
    list.forEach(item => {
        const dateString = item.dt_txt.split(" ")[0]; // YYYY-MM-DD
        if (!grouped[dateString]) {
            grouped[dateString] = [];
        }
        grouped[dateString].push(item);
    });
    return grouped;
}

// ==========================================
// Rendering Daily & Hourly Forecasts
// ==========================================
function renderDailyForecast(groupedData) {
    dailyForecastContainer.innerHTML = "";
    let isFirst = true;

    Object.keys(groupedData).slice(0, 5).forEach((dateStr, index) => {
        const dayItems = groupedData[dateStr];
        
        // Calculate max and min temp for the day
        let maxTemp = -Infinity;
        let minTemp = Infinity;
        dayItems.forEach(item => {
            if (item.main.temp_max > maxTemp) maxTemp = item.main.temp_max;
            if (item.main.temp_min < minTemp) minTemp = item.main.temp_min;
        });

        // Pick midday weather condition or first item's condition
        const middayItem = dayItems.find(item => item.dt_txt.includes("12:00:00")) || dayItems[0];
        const condition = middayItem.weather[0].main;
        
        const dateObj = new Date(dateStr);
        const dayName = index === 0 ? "Today" : dateObj.toLocaleDateString("en-US", { weekday: "short" });

        const div = document.createElement("div");
        div.className = `daily-item ${isFirst ? "active" : ""}`;
        div.innerHTML = `
            <span class="daily-day">${dayName}</span>
            <i class="${getIconClass(condition)} daily-icon"></i>
            <div class="daily-temps">
                <span class="daily-max">${Math.round(maxTemp)}°</span>
                <span class="daily-min">${Math.round(minTemp)}°</span>
            </div>
        `;

        div.addEventListener("click", () => {
            document.querySelectorAll(".daily-item").forEach(el => el.classList.remove("active"));
            div.classList.add("active");
            renderHourlyForecast(dayItems, index === 0 ? "Today" : dateObj.toLocaleDateString("en-US", { weekday: "long" }));
        });

        dailyForecastContainer.appendChild(div);
        isFirst = false;
    });
}

function renderHourlyForecast(dayItems, dayLabel) {
    hourlyTitle.innerHTML = `<i class="fa-solid fa-clock"></i> Hourly Forecast — ${dayLabel}`;
    hourlyScrollContainer.innerHTML = "";

    dayItems.forEach(item => {
        const timeStr = formatHour(item.dt);
        const condition = item.weather[0].main;
        const temp = Math.round(item.main.temp);

        const div = document.createElement("div");
        div.className = "hourly-item";
        div.innerHTML = `
            <span class="hourly-time">${timeStr}</span>
            <i class="${getIconClass(condition)} hourly-icon"></i>
            <span class="hourly-temp">${temp}°</span>
        `;
        hourlyScrollContainer.appendChild(div);
    });
}

// ==========================================
// Dynamic Weather UI & Theme Effects
// ==========================================
function applyDynamicTheme(condition, dt, sunrise, sunset) {
    const isNight = dt < sunrise || dt > sunset;
    dynamicBgEffects.innerHTML = "";

    let themeClass = "weather-sunny";

    if (isNight) {
        themeClass = "weather-night";
    } else {
        const condLower = condition.toLowerCase();
        if (condLower.includes("rain") || condLower.includes("drizzle")) {
            themeClass = "weather-rainy";
            createRaindrops();
        } else if (condLower.includes("thunder") || condLower.includes("storm")) {
            themeClass = "weather-stormy";
            createRaindrops();
        } else if (condLower.includes("cloud")) {
            themeClass = "weather-cloudy";
        } else if (condLower.includes("mist") || condLower.includes("fog") || condLower.includes("haze")) {
            themeClass = "weather-foggy";
        } else {
            themeClass = "weather-sunny";
        }
    }

    // Apply theme class along with dark mode state if active
    document.body.className = document.body.classList.contains("dark-mode") 
        ? `${themeClass} dark-mode` 
        : themeClass;
}

function createRaindrops() {
    const dropCount = 40;
    for (let i = 0; i < dropCount; i++) {
        const drop = document.createElement("div");
        drop.className = "drop";
        drop.style.left = `${Math.random() * 100}%`;
        drop.style.top = `${Math.random() * -20}px`;
        drop.style.animationDuration = `${0.5 + Math.random() * 0.5}s`;
        drop.style.animationDelay = `${Math.random() * 2}s`;
        dynamicBgEffects.appendChild(drop);
    }
}

// ==========================================
// Utility & Formatting Helpers
// ==========================================
function setWeatherIcon(el, condition, dt, sunrise, sunset) {
    const isNight = dt < sunrise || dt > sunset;
    el.className = getIconClass(condition, isNight);
}

function getIconClass(condition, isNight = false) {
    const cond = condition.toLowerCase();
    if (cond.includes("clear")) {
        return isNight ? "fa-solid fa-moon" : "fa-solid fa-sun";
    } else if (cond.includes("rain")) {
        return "fa-solid fa-cloud-rain";
    } else if (cond.includes("drizzle")) {
        return "fa-solid fa-cloud-sun-rain";
    } else if (cond.includes("thunder") || cond.includes("storm")) {
        return "fa-solid fa-cloud-bolt";
    } else if (cond.includes("snow")) {
        return "fa-solid fa-snowflake";
    } else if (cond.includes("cloud")) {
        return "fa-solid fa-cloud";
    } else if (cond.includes("mist") || cond.includes("fog") || cond.includes("haze")) {
        return "fa-solid fa-smog";
    }
    return "fa-solid fa-cloud-sun";
}

function formatLocalDate(dt, timezoneOffsetSeconds) {
    const localTimestamp = (dt + timezoneOffsetSeconds) * 1000;
    const date = new Date(localTimestamp);
    return date.toUTCString().replace(/GMT.*$/, "").trim();
}

function formatHour(dt) {
    const date = new Date(dt * 1000);
    let hours = date.getHours();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours} ${ampm}`;
}

function capitalizeWords(str) {
    return str.replace(/\b\w/g, l => l.toUpperCase());
}

function getHumidityDescription(h) {
    if (h < 30) return "Dry & low humidity";
    if (h <= 60) return "Comfortable humidity level";
    return "High humidity, feels muggy";
}

function getWindDescription(w) {
    if (w < 10) return "Light air breeze";
    if (w <= 25) return "Gentle pleasant breeze";
    return "Strong windy conditions";
}

function getVisibilityDescription(v) {
    if (v < 4) return "Hazy & restricted visibility";
    if (v <= 8) return "Moderate visibility";
    return "Crystal clear view";
}

function getPressureDescription(p) {
    if (p < 1010) return "Low pressure system";
    if (p <= 1020) return "Stable normal pressure";
    return "High pressure system";
}

function showLoading(isLoading) {
    if (isLoading) {
        loadingState.classList.remove("hidden");
        dashboard.classList.add("hidden");
        hideError();
    } else {
        loadingState.classList.add("hidden");
    }
}

function showError(msg) {
    errorMessage.textContent = msg;
    errorBanner.classList.remove("hidden");
    loadingState.classList.add("hidden");
}

function hideError() {
    errorBanner.classList.add("hidden");
}
