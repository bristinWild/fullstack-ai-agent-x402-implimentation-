import { Module } from '@nestjs/common';
import { X402Controller } from './x402.controller';
import { X402Service } from './x402.service';
import { PaymentsService } from '../payments/payments.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  controllers: [X402Controller],
  providers: [X402Service, PaymentsService],
  exports: [X402Service],
})
export class X402Module {}
