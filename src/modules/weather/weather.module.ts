import { Module } from '@nitrostack/core';
import { WeatherTools } from './weather.tools.js';
import { WeatherService } from '../../services/weather.service.js';

@Module({
  name: 'weather',
  description: 'Weather lookup module providing current weather conditions for any location',
  providers: [WeatherService],
  controllers: [WeatherTools],
})
export class WeatherModule {}
