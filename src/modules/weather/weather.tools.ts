import { ToolDecorator as Tool, Widget, Injectable, ExecutionContext, z } from '@nitrostack/core';
import { WeatherService } from '../../services/weather.service.js';

@Injectable({ deps: [WeatherService] })
export class WeatherTools {
  constructor(private readonly weatherService: WeatherService) {}

  @Tool({
    name: 'weather.lookup',
    description:
      'Look up current weather conditions for a specific location. ' +
      'Returns temperature, humidity, wind speed, condition, and other weather metrics.',
    inputSchema: z.object({
      location: z
        .string()
        .min(1, 'location must not be empty')
        .describe(
          'The city name or location to look up weather for. ' +
          'Examples: "London", "New York", "Tokyo", "Paris"'
        ),
    }),
    examples: {
      request: { location: 'London' },
      response: {
        location: 'London, United Kingdom',
        temperature: 15,
        condition: 'Partly cloudy',
        humidity: 72,
        windSpeed: 12,
        feelsLike: 13,
        uvIndex: 3,
        visibility: 10,
        pressure: 1013,
        icon: 'https://cdn.weatherapi.com/weather/64x64/day/116.png',
        timestamp: '2024-01-15T10:30:00Z',
      },
    },
  })
  @Widget('weather-lookup')
  async lookupWeather(input: { location: string }, ctx: ExecutionContext) {
    ctx.logger.info('weather.lookup called', {
      location: input.location,
      user: ctx.auth?.subject,
    });

    try {
      const result = await this.weatherService.lookupWeather(input.location);

      ctx.logger.info('weather.lookup completed', {
        location: input.location,
        temperature: result.temperature,
      });

      return result;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error fetching weather';
      ctx.logger.error('weather.lookup failed', { location: input.location, error: message });
      throw new Error(`weather.lookup failed: ${message}`);
    }
  }
}
