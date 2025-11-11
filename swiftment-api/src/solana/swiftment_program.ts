import { Idl } from '@coral-xyz/anchor';
import swiftmentProgramIdl from './swiftment_program.json';

export const IDL = swiftmentProgramIdl as Idl;

export type SwiftmentProgram = {
  version: string;
  name: string;
  instructions: Array<{
    name: string;
    accounts: Array<{
      name: string;
      isMut: boolean;
      isSigner: boolean;
    }>;
    args: Array<{ name: string; type: string }>;
  }>;
  accounts: Array<{
    name: string;
    type: {
      kind: string;
      fields: Array<{ name: string; type: string }>;
    };
  }>;
  errors: Array<{ code: number; name: string; msg: string }>;
  metadata: {
    address: string;
  };
};

export type Merchant = {
  merchantAuthority: string;
  treasury: string;
  bump: number;
};

export type Treasury = {
  merchant: string;
  usdcAta: string;
  bump: number;
};

export type User = {
  owner: string;
  defaultDailyLimitUsdc: number;
  bump: number;
};

export type UserPlatform = {
  user: string;
  merchant: string;
  dailyLimitUsdc: number;
  spentTodayUsdc: number;
  lastResetUnix: number;
  bump: number;
};

export type PurchaseEvent = {
  user: string;
  merchant: string;
  amountUsdc: number;
  feeUsdc: number;
  ts: number;
};

export type WithdrawEvent = {
  merchant: string;
  amountUsdc: number;
  feeUsdc: number;
  ts: number;
};
