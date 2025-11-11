// swiftment-api/src/main.ts
// Update this file to enable CORS for frontend

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS to allow frontend to connect
  app.enableCors({
    origin: [
      'http://localhost:5173', // Vite default
      'http://localhost:3000', // Alternative
      process.env.FRONTEND_URL // From .env
    ].filter(Boolean),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-payment'],
  });

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`🚀 Backend running on: http://localhost:${port}`);
}
bootstrap();
