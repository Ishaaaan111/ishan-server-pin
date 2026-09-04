import { Injectable, ConfigService } from '@nitrostack/core';

export interface WeatherData {
  location: string;
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  feelsLike: number;
  uvIndex: number;
  visibility: number;
  pressure: number;
  icon: string;
  timestamp: string;
}

@Injectable({ deps: [ConfigService] })
export class WeatherService {
  private apiKey: string;
  private baseUrl = 'https://api.weatherapi.com/v1';

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get('WEATHER_API_KEY') || 'demo';
  }

  async lookupWeather(location: string): Promise<WeatherData> {
    try {
      const url = `${this.baseUrl}/current.json?key=${this.apiKey}&q=${encodeURIComponent(location)}&aqi=no`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Weather API error: ${response.statusText}`);
      }

      const data = await response.json() as any;

      return {
        location: `${data.location.name}, ${data.location.country}`,
        temperature: Math.round(data.current.temp_c),
        condition: data.current.condition.text,
        humidity: data.current.humidity,
        windSpeed: Math.round(data.current.wind_kph),
        feelsLike: Math.round(data.current.feelslike_c),
        uvIndex: data.current.uv,
        visibility: Math.round(data.current.vis_km),
        pressure: data.current.pressure_mb,
        icon: data.current.condition.icon,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(
        `Failed to fetch weather data: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
