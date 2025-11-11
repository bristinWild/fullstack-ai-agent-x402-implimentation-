import { Module } from '@nestjs/common';
import { MerchantsController } from './merchants.controller';
import { HttpModule } from '@nestjs/axios';
import { SolanaModule } from '../solana/solana.module';

@Module({
  imports: [
    SolanaModule,
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
  ],
  controllers: [MerchantsController],
  providers: [],
  exports: [],
})
export class MerchantsModule {}
