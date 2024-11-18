let cityInput = document.getElementById('city_input'),
    searchBtn = document.getElementById('searchBtn'),
    locationBtn = document.getElementById('locationBtn'),
    api_key = '4906d33803ebc5127933f127f971a9ed',
    currentWeatherCard = document.querySelector('.weather-left .card'),
    fiveDaysForecastCard = document.querySelector('.day-forecast'),
    aqiCard = document.querySelectorAll('.highlights .card')[0],
    sunriseCard = document.querySelector('.sunrise-sunset .item:nth-child(1) h2'),
    sunsetCard = document.querySelector('.sunrise-sunset .item:nth-child(2) h2'),
    humidityVal = document.getElementById('humidityVal'),
    pressureVal = document.getElementById('pressureVal'),
    visibilityVal = document.getElementById('visibilityVal'),
    windSpeedVal = document.getElementById('windSpeedVal'),
    feelsVal = document.getElementById('feelsVal'),
    hourlyForecastCard = document.querySelector('.hourly-forecast');

const aqiList = ['Good', 'Fair', 'Moderate', 'Poor', 'Very Poor'];
const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Generic error handler for fetch calls
const handleError = (errorMessage) => alert(errorMessage);

// Function to safely access data properties
const safeAccess = (obj, path, fallback = 'N/A') => {
    return path.split('.').reduce((acc, key) => acc && acc[key] !== undefined ? acc[key] : fallback, obj);
};

// Fetch and Render Weather Details
function getWeatherDetails(name, lat, lon, country) {
    const FORECAST_API_URL = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${api_key}`;
    const WEATHER_API_URL = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${api_key}`;
    const AIR_POLLUTION_API_URL = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${api_key}`;

    // Fetch Air Quality Data
    fetch(AIR_POLLUTION_API_URL)
        .then(res => res.json())
        .then(data => {
            if (data.list && data.list[0]) {
                const { co, no, no2, o3, so2, pm2_5, pm10, nh3 } = data.list[0].components;
                const aqi = data.list[0].main.aqi;
                aqiCard.innerHTML = `
                    <div class="card-head">
                        <p>Air Quality Index</p>
                        <p class="air-index aqi-${aqi}">${aqiList[aqi - 1]}</p>
                    </div>
                    <div class="air-indices">
                        <div class="item"><p>PM2.5</p><h2>${pm2_5}</h2></div>
                        <div class="item"><p>PM10</p><h2>${pm10}</h2></div>
                        <div class="item"><p>SO2</p><h2>${so2}</h2></div>
                        <div class="item"><p>CO2</p><h2>${co}</h2></div>
                        <div class="item"><p>NO</p><h2>${no}</h2></div>
                        <div class="item"><p>NOx</p><h2>${no2}</h2></div>
                        <div class="item"><p>NH3</p><h2>${nh3}</h2></div>
                        <div class="item"><p>VOC</p><h2>${o3}</h2></div>
                    </div>`;
            } else {
                handleError('Failed to fetch Air Quality Index');
            }
        })
        .catch(() => handleError('Error fetching Air Quality Index'));

    // Fetch Current Weather
    fetch(WEATHER_API_URL)
        .then(res => res.json())
        .then(data => {
            if (data.main && data.weather && data.sys) {
                const { temp, humidity, pressure, feels_like } = data.main;
                const { description, icon } = data.weather[0];
                const date = new Date();
                const { sunrise, sunset, timezone } = data.sys;
                const visibility = data.visibility / 1000; // Convert visibility to kilometers
                const windSpeed = data.wind.speed; // Wind speed in m/s

                // Convert sunrise and sunset times to local
                const sRiseTime = sunrise ? moment.utc(sunrise, 'X').add(timezone, 'seconds').format('hh:mm A') : 'N/A';
                const sSetTime = sunset ? moment.utc(sunset, 'X').add(timezone, 'seconds').format('hh:mm A') : 'N/A';


                // Update Current Weather Card
                currentWeatherCard.innerHTML = `
                    <div class="current-weather">
                        <div class="details">
                            <p>Now</p>
                            <h2>${(temp - 273.15).toFixed(2)}&deg;C</h2>
                            <p>${description}</p>
                        </div>
                        <div class="weather-icon">
                            <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="Weather Icon">
                        </div>
                    </div>
                    <hr>
                    <div class="card-footer">
                        <p><i class="fa-light fa-calendar"></i> ${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]}</p>
                        <p><i class="fa-light fa-location-dot"></i> ${name}, ${country}</p>
                    </div>`;
                humidityVal.innerHTML = `${humidity}%`;
                pressureVal.innerHTML = `${pressure} hPa`;
                feelsVal.innerHTML = `${(feels_like - 273.15).toFixed(2)}&deg;C`;
                visibilityVal.innerHTML = `${visibility.toFixed(1)} km`;
                windSpeedVal.innerHTML = `${windSpeed.toFixed(1)} m/s`;
                 // Update Sunrise & Sunset
                 document.querySelector('.sunrise-sunset .item:nth-child(1) h2').innerText = sRiseTime;
                 document.querySelector('.sunrise-sunset .item:nth-child(2) h2').innerText = sSetTime;
             
           
            } else {
                handleError('Failed to fetch current weather');
            }
        })
        .catch(() => handleError('Error fetching current weather'));

    // Fetch 5-Day Forecast
    fetch(FORECAST_API_URL)
        .then(res => res.json())
        .then(data => {
            if (data.list && data.list.length > 0) {
                const uniqueDays = new Set();
                const fiveDaysForecast = data.list.filter(forecast => {
                    const date = new Date(forecast.dt_txt).getDate();
                    if (!uniqueDays.has(date)) {
                        uniqueDays.add(date);
                        return true;
                    }
                    return false;
                }).slice(0, 5);

                fiveDaysForecastCard.innerHTML = '';
                fiveDaysForecast.forEach(forecast => {
                    const forecastDate = new Date(forecast.dt_txt);
                    const day = days[forecastDate.getDay()];
                    const monthDay = `${forecastDate.getDate()} ${months[forecastDate.getMonth()]}`;
                    const tempCelsius = (forecast.main.temp - 273.15).toFixed(1);
                    const weatherIcon = forecast.weather[0].icon;

                    fiveDaysForecastCard.innerHTML += `
                        <div class="forecast-item">
                            <div class="icon-wrapper">
                                <img src="https://openweathermap.org/img/wn/${weatherIcon}@2x.png" alt="Weather Icon">
                                <span>${tempCelsius}&deg;C</span>
                            </div>
                            <p>${day}</p>
                            <p>${monthDay}</p>
                        </div>`;
                });
            } else {
                handleError('No forecast data available');
            }
        })
        .catch(() => handleError('Error fetching 5-day forecast'));

    // Fetch and Render Hourly Forecast
    fetch(FORECAST_API_URL)
        .then(res => res.json())
        .then(data => {
            if (data.list && data.list.length > 0) {
                const hourlyForecast = data.list.slice(0, 8);
                hourlyForecastCard.innerHTML = '';
                hourlyForecast.forEach(forecast => {
                    const forecastDate = new Date(forecast.dt_txt);
                    let hour = forecastDate.getHours();
                    const period = hour >= 12 ? 'PM' : 'AM';
                    if (hour > 12) hour -= 12;
                    if (hour === 0) hour = 12;

                    const tempCelsius = (forecast.main.temp - 273.15).toFixed(1);
                    const weatherIcon = forecast.weather[0].icon;

                    hourlyForecastCard.innerHTML += `
                        <div class="card">
                            <p>${hour} ${period}</p>
                            <img src="https://openweathermap.org/img/wn/${weatherIcon}@2x.png" alt="Weather Icon">
                            <p>${tempCelsius}&deg;C</p>
                        </div>`;
                });
            } else {
                handleError('No hourly forecast data available');
            }
        })
        .catch(() => handleError('Error fetching hourly forecast'));
}

// Fetch City Coordinates
function getCityCoordinates() {
    const cityName = cityInput.value.trim();
    cityInput.value = '';
    if (!cityName) return handleError('City name cannot be empty');

    const GEOCODING_API_URL = `http://api.openweathermap.org/geo/1.0/direct?q=${cityName}&limit=1&appid=${api_key}`;
    fetch(GEOCODING_API_URL)
        .then(res => res.json())
        .then(data => {
            if (data.length > 0) {
                const { name, lat, lon, country } = data[0];
                getWeatherDetails(name, lat, lon, country);
            } else {
                handleError(`City not found: ${cityName}`);
            }
        })
        .catch(() => handleError('Error fetching city coordinates'));
}

// Get User's Current Location
function getUserCoordinates() {
    navigator.geolocation.getCurrentPosition(position => {
        const { latitude, longitude } = position.coords;
        const REVERSE_GEOCODING_URL = `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${api_key}`;

        fetch(REVERSE_GEOCODING_URL)
            .then(res => res.json())
            .then(data => {
                if (data.length > 0) {
                    const { name, country } = data[0];
                    getWeatherDetails(name, latitude, longitude, country);
                } else {
                    handleError('Failed to fetch user location');
                }
            })
            .catch(() => handleError('Error fetching user location'));
    }, error => {
        if (error.code === error.PERMISSION_DENIED) {
            handleError('Geolocation permission denied. Please allow location access.');
        }
    });
}

// Event Listeners
searchBtn.addEventListener('click', getCityCoordinates);
locationBtn.addEventListener('click', getUserCoordinates);
cityInput.addEventListener('keyup', e => e.key === 'Enter' && getCityCoordinates());
window.addEventListener('load', getUserCoordinates);


