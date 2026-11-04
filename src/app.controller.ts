import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service.js';
import { Public } from './auth/decorators/public.decorator.js';

@ApiTags('App')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @ApiOperation({ summary: 'Hello world', description: 'Public smoke test.' })
  @ApiOkResponse({
    description: 'Greeting text.',
    schema: { type: 'string', example: 'Hello World!' },
  })
  @Public()
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
