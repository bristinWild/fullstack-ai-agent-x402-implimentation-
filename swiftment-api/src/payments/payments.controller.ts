// import { Controller, Post, Req, Res, Headers } from "@nestjs/common";
// import type { Request, Response } from "express"; // ← use Express types
// import { PaymentsService } from "./payments.service";
// import { CFG } from "../config";

// @Controller("api")
// export class PaymentsController {
//   constructor(private readonly svc: PaymentsService) {}

//   @Post("protected")
//   async protected(
//     @Req() req: Request,
//     @Res() res: Response,
//     @Headers("x-payment") xPay?: string
//   ) {
//     const amountUsdc = 2_500_000; // 2.5 USDC (6 decimals)

//     if (!xPay) {
//       return res.status(402).json({
//         reason: "payment_required",
//         merchantAuthority: CFG.merchantAuth,
//         amountUsdc,
//       });
//     }

//     const ok = await this.svc.verifyXPayment(xPay, amountUsdc);
//     if (!ok) {
//       return res.status(400).json({ ok: false, reason: "invalid_payment" });
//     }

//     return res.status(200).json({ ok: true, data: "Hello, paid user!" });
//   }
// }


import { Controller, Post, Body, Res } from '@nestjs/common';
import type { Response } from 'express';
import { PaymentsService } from './payments.service';

@Controller('api')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  /**
   * Body: { signature: string, merchant: string }
   * The service will load on-chain Config (fee authority / bps),
   * fetch the parsed tx, and verify SPL transfers:
   *   - USDC to merchant treasury ATA
   *   - USDC fee to authority fee ATA
   */
  @Post('protected/verify-x-payment')
  async verifyXPayment(@Body() body: any, @Res() res: Response) {
    const { signature, merchant } = body ?? {};
    if (!signature || !merchant) {
      return res.status(400).json({ ok: false, reason: 'missing_params' });
    }

    try {
      const ok = await this.payments.verifySPLTransfer(signature, merchant);
      if (!ok) return res.status(400).json({ ok: false, reason: 'invalid_payment' });
      return res.json({ ok: true });
    } catch (e: any) {
      return res.status(500).json({ ok: false, reason: 'server_error', message: e?.message });
    }
  }
}
