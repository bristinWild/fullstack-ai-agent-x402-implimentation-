import { Module } from '@nestjs/common';
import { PaymentsModule } from './payments/payments.module';
import { MerchantsModule } from './merchants/merchants.module';
import { UsersModule } from './users/users.module';
import { LimitsModule } from './limits/limits.module';
import { PurchasesModule } from './purchases/purchases.module';
import { SolanaModule } from './solana/solana.module';
import { X402Module } from './x402/x402.module';

@Module({
  imports: [
    SolanaModule,
    MerchantsModule,
    UsersModule,
    LimitsModule,
    PurchasesModule,
    PaymentsModule,
    X402Module,
  ],
})
export class AppModule {}
