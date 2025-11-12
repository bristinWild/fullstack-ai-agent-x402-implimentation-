export class CreatePurchaseDto {
  merchantId: string;
  amount: number;
  productId: string;
  userId?: string;
  metadata?: any;
}