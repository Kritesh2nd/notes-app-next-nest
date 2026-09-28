import { INestApplication, ValidationPipe } from "@nestjs/common";
import cookieParser from "cookie-parser";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { ResponseInterceptor } from "./common/interceptors/response.interceptor";
import { AppLoggerService } from "./logger/app-logger.service";

/** Shared HTTP setup so the real server (main.ts) and the e2e tests behave identically. */
export async function configureApp(app: INestApplication) {
  app.use(cookieParser());

  app.enableCors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
      errorHttpStatusCode: 422,
    })
  );

  const appLogger = await app.resolve(AppLoggerService);
  app.useGlobalFilters(new HttpExceptionFilter(appLogger));
  app.useGlobalInterceptors(new ResponseInterceptor());

  app.setGlobalPrefix("api");
}
