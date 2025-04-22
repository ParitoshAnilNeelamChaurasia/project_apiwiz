let currentWeather = null;

function fetchWeather() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                const latitude = position.coords.latitude;
                const longitude = position.coords.longitude;
                getWeatherData(latitude, longitude);
            },
            error => {
                console.error('Error getting location:', error);
                getWeatherData(51.5074, -0.1278);
            }
        );
    } else {
        console.log('Geolocation is not supported by this browser.');
        getWeatherData(51.5074, -0.1278);
    }
}

function getWeatherData(lat, lon) {
    const apiKey = 'YOUR_OPENWEATHERMAP_API_KEY'; 
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Weather data not available');
            }
            return response.json();
        })
        .then(data => {
            currentWeather = {
                temp: data.main.temp,
                main: data.weather[0].main,
                description: data.weather[0].description,
                city: data.name,
                country: data.sys.country
            };
            updateWeatherDisplay();
        })
        .catch(error => {
            console.error('Error fetching weather data:', error);
            currentWeather = {
                temp: 20,
                main: 'Clear',
                description: 'clear sky',
                city: 'Unknown',
                country: ''
            };
            updateWeatherDisplay();
        });
}

function updateWeatherDisplay() {
    if (!currentWeather) return;

    const weatherIcon = document.getElementById('weather-icon');
    const temperature = document.getElementById('temperature');
    const location = document.getElementById('location');

    weatherIcon.textContent = getWeatherIcon(currentWeather.main);
    temperature.textContent = `${Math.round(currentWeather.temp)}°C`;
    location.textContent = `${currentWeather.city}, ${currentWeather.country}`;
}

function getCurrentWeather() {
    return currentWeather;
}

function getWeatherIcon(weatherMain) {
    const icons = {
        Clear: '☀️',
        Clouds: '☁️',
        Rain: '🌧️',
        Thunderstorm: '⛈️',
        Snow: '❄️',
        Mist: '🌫️',
        Fog: '🌫️',
        Drizzle: '🌦️'
    };
    return icons[weatherMain] || '🌈';
}
