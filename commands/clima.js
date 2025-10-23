// commands/clima.js (VERSIÓN "KATANA DEMONIACA")

const axios = require('axios');
const DB = require('../core/db.js');

const PREFIX = process.env.PREFIX || '!';
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;

// Listas de traducción e iconos (sin cambios)
const weatherTranslations = { 'clear sky': 'Cielo despejado', 'few clouds': 'Pocas nubes', 'scattered clouds': 'Nubes dispersas', 'broken clouds': 'Nubes fragmentadas', 'overcast clouds': 'Cielo nublado', 'shower rain': 'Lluvia de chubascos', 'rain': 'Lluvia', 'light rain': 'Lluvia ligera', 'moderate rain': 'Lluvia moderada', 'heavy intensity rain': 'Lluvia intensa', 'thunderstorm': 'Tormenta eléctrica', 'snow': 'Nieve', 'mist': 'Niebla', 'smoke': 'Humo', 'haze': 'Neblina', 'dust': 'Polvo', 'fog': 'Niebla' };
const weatherIcons = { '01d': '☀️', '01n': '🌙', '02d': '🌤️', '02n': '☁️', '03d': '☁️', '03n': '☁️', '04d': '☁️', '04n': '☁️', '09d': '🌧️', '09n': '🌧️', '10d': '🌦️', '10n': '🌧️', '11d': '⛈️', '11n': '⛈️', '13d': '❄️', '13n': '❄️', '50d': '🌫️', '50n': '🌫️' };

module.exports = {
    name: 'clima',
    alias: ['weather', 'tiempo'],
    description: 'Ejecuta una técnica de adivinación para revelar el estado de los cielos.',
    public: true,

    execute: async (sock, msg, args, ctx) => {
        const { chatJid, userJid } = ctx;

        if (!WEATHER_API_KEY) {
            console.error('[WEATHER COMMAND] La clave de API de OpenWeatherMap no está configurada.');
            return sock.sendMessage(chatJid, { text: '👹 La técnica de adivinación celestial no ha sido configurada por el maestro.' });
        }

        const user = DB.getUserByPhone(userJid.split('@')[0]);
        if (!user) {
            return sock.sendMessage(chatJid, { text: `👹 Debes ser un guerrero registrado para usar esta técnica. Usa *${PREFIX}registrar*.` });
        }

        if (args.length === 0) {
            const usageMessage =
`╪══════ 👹 ══════╪
    *~ Técnica Fallida ~*

Debes nombrar un lugar para adivinar su destino celestial.

┫ *Ejemplo:*
┃   \`${PREFIX}clima <nombre_de_la_ciudad>\`
╪═══════ •| ✧ |• ═══════╪`;
            return sock.sendMessage(chatJid, { text: usageMessage });
        }

        const cityName = args.join(' ');
        const API_URL = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(cityName)}&appid=${WEATHER_API_KEY}&units=metric&lang=es`;

        try {
            await sock.sendMessage(chatJid, { text: `👹 Adivinando los cielos para *${cityName}*...` });

            const response = await axios.get(API_URL);
            const data = response.data;

            const current = data.list[0];
            const description = weatherTranslations[current.weather[0].description] || current.weather[0].description.charAt(0).toUpperCase() + current.weather[0].description.slice(1);
            const icon = weatherIcons[current.weather[0].icon] || '🌐';
            
            let dailyMax = -Infinity;
            let dailyMin = Infinity;
            const today = new Date().setHours(0, 0, 0, 0);

            for (const forecast of data.list) {
                const forecastDate = new Date(forecast.dt * 1000).setHours(0, 0, 0, 0);
                if (forecastDate === today) {
                    if (forecast.main.temp_max > dailyMax) dailyMax = forecast.main.temp_max;
                    if (forecast.main.temp_min < dailyMin) dailyMin = forecast.main.temp_min;
                }
            }

            // --- PERGAMINO CELESTIAL ESTILO "KATANA DEMONIACA" ---
            const weatherMessage = 
`╪══════ 👹 ══════╪
    *~ Pergamino Celestial ~*
    *${data.city.name}, ${data.city.country}*

┫ *Estado:* ${description} ${icon}

┫ 🌡️ *Temperatura:* ${current.main.temp.toFixed(1)}°C
┃   *(Sensación: ${current.main.feels_like.toFixed(1)}°C)*

┫ 🥵 *Máxima del día:* ${dailyMax.toFixed(1)}°C
┫ 🥶 *Mínima del día:* ${dailyMin.toFixed(1)}°C

┫ 💧 *Humedad:* ${current.main.humidity}%
┫ 💨 *Viento:* ${current.wind.speed} m/s
╪══════ •| ✧ |• ══════╪`;

            await sock.sendMessage(chatJid, { text: weatherMessage });

        } catch (error) {
            console.error('[WEATHER COMMAND ERROR]', error.response?.data || error.message);
            if (error.response && error.response.status === 404) {
                await sock.sendMessage(chatJid, { text: `❌ No se pudo adivinar el destino de "${cityName}". Verifica el nombre.` });
            } else {
                await sock.sendMessage(chatJid, { text: '❌ Ocurrió un error al ejecutar la técnica de adivinación celestial.' });
            }
        }
    }
};
