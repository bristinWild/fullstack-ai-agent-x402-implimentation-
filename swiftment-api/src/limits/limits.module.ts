import { Module } from '@nestjs/common';
import { LimitsController } from './limits.controller';

@Module({ controllers: [LimitsController] })
export class LimitsModule {}
