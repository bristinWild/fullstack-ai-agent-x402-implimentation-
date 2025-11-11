import { Body, Controller, Get, Param, Post } from '@nestjs/common';

const mem: Record<string, number> = {};

@Controller('api/limits')
export class LimitsController {
  @Get(':merchant')
  async get(@Param('merchant') merchant: string) {
    return { merchant, limit: mem[merchant] ?? 0 };
  }

  @Post(':merchant')
  async set(@Param('merchant') merchant: string, @Body() body: any) {
    const n = Number(body?.limit ?? 0);
    mem[merchant] = isFinite(n) && n >= 0 ? n : 0;
    return { ok: true, merchant, limit: mem[merchant] };
  }
}
