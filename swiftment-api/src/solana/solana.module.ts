import { Module } from '@nestjs/common';
import { SolanaProgramService } from './solana-program.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  providers: [SolanaProgramService],
  exports: [SolanaProgramService],
})
export class SolanaModule {}
