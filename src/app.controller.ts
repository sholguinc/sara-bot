import { Controller, Get, HttpCode } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('/')
  home() {
    return { message: 'Hello World!' };
  }

  @Get('/health')
  @HttpCode(200)
  healthEndpoint() {
    console.log('-> healthcheck endpoint');
    return { message: 'OK' };
  }
}
