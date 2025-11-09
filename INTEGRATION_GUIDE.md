# 🔗 INTEGRATION GUIDE - Fraud Detection & Commission Reversal

## ✅ **ĐÃ HOÀN THÀNH**

### **Backend Core Implementation:**
- ✅ AffiliateFraudModule registered in app.module.ts
- ✅ FraudDetectionService with 5 fraud checks
- ✅ CommissionReversalService with transaction atomicity
- ✅ Controller endpoints for both modules
- ✅ findReversedByUser() method implemented
- ✅ All TypeScript errors fixed

---

## 🔧 **BƯỚC TIẾP THEO: INTEGRATION**

### **1. Integrate Fraud Detection vào Commission Calculation**

File: `backend/src/modules/affiliate-commissions/service/commission-calc.service.ts`

```typescript
// ✅ STEP 1: Import FraudDetectionService
import { FraudDetectionService } from '../../affiliate-fraud/service/fraud-detection.service';

// ✅ STEP 2: Inject vào constructor
constructor(
  // ...existing dependencies
  private readonly fraudService: FraudDetectionService,
) {}

// ✅ STEP 3: Add fraud check vào handleOrderPaid hoặc calculateCommission
async handleOrderPaid(orderId: number) {
  const order = await this.ordersRepo.findOne({
    where: { id: orderId },
    relations: ['user'],
  });

  if (!order) {
    throw new Error('Order not found');
  }

  // 🚨 RUN FRAUD CHECKS
  if (order.affiliate_user_id) {
    const fraudCheck = await this.fraudService.runFraudChecks({
      user_id: order.user.id,
      affiliate_user_id: order.affiliate_user_id,
      ip_address: order.ip_address, // Nếu có field này
    });

    // Block self-referral
    if (fraudCheck.checks.selfReferral) {
      console.log('⚠️ Self-referral blocked for order:', orderId);
      return { 
        blocked: true, 
        reason: 'Self-referral not allowed',
        fraudCheck 
      };
    }

    // Log other fraud types but continue
    if (fraudCheck.fraudDetected) {
      console.log('⚠️ Fraud detected but not blocking:', fraudCheck.checks);
    }
  }

  // Continue normal commission calculation...
  return await this.calculateCommission(order);
}
```

---

### **2. Hook Commission Reversal vào Order Status Changes**

File: `backend/src/modules/orders/orders.service.ts`

```typescript
// ✅ STEP 1: Import CommissionReversalService
import { CommissionRevesalService } from '../affiliate-commissions/service/commision-revesal.service';

// ✅ STEP 2: Inject vào constructor
constructor(
  // ...existing dependencies
  private readonly reversalService: CommissionRevesalService,
) {}

// ✅ STEP 3: Hook vào updateOrderStatus
async updateOrderStatus(orderId: number, newStatus: string) {
  // Update order status first
  const order = await this.ordersRepo.findOne({ where: { id: orderId } });
  if (!order) {
    throw new Error('Order not found');
  }

  order.status = newStatus;
  await this.ordersRepo.save(order);

  // 🔄 TRIGGER COMMISSION REVERSAL
  try {
    if (newStatus === 'CANCELLED' || newStatus === 'CANCELED') {
      // Void pending commissions
      await this.reversalService.voidCommissionForOrder(
        orderId
      );
      console.log(`✅ Voided commissions for cancelled order ${orderId}`);
    } 
    else if (newStatus === 'REFUNDED') {
      // Reverse paid commissions
      await this.reversalService.reverseCommissionForOrder(
        orderId,
        'Order refunded by customer'
      );
      console.log(`✅ Reversed commissions for refunded order ${orderId}`);
    }
  } catch (error) {
    console.error('❌ Failed to handle commission reversal:', error);
    // Don't throw - order status already updated
  }

  return order;
}
```

---

### **3. Partial Refund Integration**

File: `backend/src/modules/refunds/refunds.service.ts` (hoặc tương tự)

```typescript
// ✅ Import CommissionReversalService
import { CommissionRevesalService } from '../affiliate-commissions/service/commision-revesal.service';

constructor(
  // ...existing
  private readonly reversalService: CommissionRevesalService,
) {}

async createPartialRefund(orderItemId: number, refundAmount: number) {
  // Process refund...
  
  // 🔄 TRIGGER PARTIAL COMMISSION REVERSAL
  try {
    await this.reversalService.partialReversalForOrderItem(
      orderItemId,
      refundAmount
    );
    console.log(`✅ Partial reversal for order item ${orderItemId}`);
  } catch (error) {
    console.error('❌ Failed to reverse commission:', error);
  }

  return refund;
}
```

---

### **4. Module Dependencies**

Đảm bảo các modules import đúng dependencies:

#### **AffiliateCommissionsModule:**
```typescript
// backend/src/modules/affiliate-commissions/affiliate-commissions.module.ts
import { AffiliateFraudModule } from '../affiliate-fraud/affiliate-fraud.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([...]),
    AffiliateFraudModule,  // ✅ Import để dùng FraudDetectionService
  ],
  // ...
})
```

#### **OrdersModule:**
```typescript
// backend/src/modules/orders/orders.module.ts
import { AffiliateCommissionsModule } from '../affiliate-commissions/affiliate-commissions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([...]),
    AffiliateCommissionsModule,  // ✅ Import để dùng CommissionReversalService
  ],
  // ...
})
```

---

## 🎯 **TESTING CHECKLIST**

### **Test Fraud Detection:**
```bash
# 1. Test self-referral
POST /orders
{
  "user_id": 1,
  "affiliate_user_id": 1,  # Same user
  # ...
}
# Expected: Commission blocked, fraud log created

# 2. Test duplicate orders
# Create >5 orders from same user in 24h
# Expected: Fraud logged but not blocked

# 3. View fraud logs
GET /affiliate-fraud/logs?page=1&limit=20
# Expected: List of fraud attempts

# 4. Review fraud log
POST /affiliate-fraud/review/1
{
  "action": "IGNORE",
  "notes": "False positive"
}
```

### **Test Commission Reversal:**
```bash
# 1. Test void (cancel order)
POST /orders/123/status
{ "status": "CANCELLED" }
# Expected: Pending commissions voided

# 2. Test full reversal (refund)
POST /orders/123/status
{ "status": "REFUNDED" }
# Expected: Paid commissions reversed, wallet deducted

# 3. Test partial reversal
POST /affiliate-commissions/partial-reverse/456
{ "refundAmount": 50000 }
# Expected: Commission partially reversed

# 4. Check reversal history
GET /affiliate-commissions/reversal-history?page=1
# Expected: List of reversed commissions
```

---

## 📊 **DATABASE MIGRATION**

Nếu chưa có bảng `affiliate_fraud_logs`, chạy migration:

```sql
CREATE TABLE affiliate_fraud_logs (
  id SERIAL PRIMARY KEY,
  fraud_type VARCHAR(50) NOT NULL,
  affiliate_user_id INTEGER REFERENCES users(id),
  order_id INTEGER REFERENCES orders(id),
  details JSONB,
  ip_address VARCHAR(45),
  detected_at TIMESTAMP NOT NULL DEFAULT NOW(),
  is_reviewed BOOLEAN DEFAULT FALSE,
  admin_action VARCHAR(50),
  admin_notes TEXT,
  reviewed_by INTEGER REFERENCES users(id),
  reviewed_at TIMESTAMP
);

CREATE INDEX idx_fraud_logs_type ON affiliate_fraud_logs(fraud_type);
CREATE INDEX idx_fraud_logs_affiliate ON affiliate_fraud_logs(affiliate_user_id);
CREATE INDEX idx_fraud_logs_detected ON affiliate_fraud_logs(detected_at);
```

---

## 🚀 **DEPLOYMENT STEPS**

1. ✅ **Backend Core** - DONE
2. ⏳ **Integration** - Follow this guide (1-2 hours)
3. ⏳ **Testing** - Test all scenarios (1 hour)
4. ⏳ **Frontend** - Implement UI (2-3 hours)
5. ⏳ **Database Migration** - Run SQL scripts
6. ⏳ **Production Deploy**

---

## 📝 **NOTES**

- **Self-referral**: Blocks commission completely
- **Other fraud types**: Log but don't block (admin review)
- **Reversal**: Always runs in transaction for atomicity
- **Wallet deduction**: Checks sufficient balance before reversal
- **Error handling**: Logs errors but doesn't break order flow

---

## 🎉 **CURRENT STATUS**

```
✅ Backend Core:           100% COMPLETE
⏳ Backend Integration:     0% (follow this guide)
⏳ Frontend:                0% (next phase)

OVERALL: 50% COMPLETE
```

**Next action**: Follow integration steps above to connect fraud detection and commission reversal to order flow.
