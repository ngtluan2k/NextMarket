# 🚀 QUICK REFERENCE - Affiliate System Phase 1 & 2

## 📦 **WHAT'S BEEN BUILT**

### **✅ Phase 1: Commission Reversal System**
- Full reversal (refund entire order)
- Void (cancel pending commissions)
- Partial reversal (refund specific items)
- Transaction atomicity with wallet deduction
- Reversal history for affiliates

### **✅ Phase 2: Fraud Detection System**
- Self-referral blocking
- Duplicate order detection
- Suspicious IP detection
- Fraud logging with admin review
- 5 fraud types tracked

---

## 🔌 **API ENDPOINTS**

### **Commission Reversal:**
```bash
# Full reversal
POST /affiliate-commissions/reverse/:orderId
Body: { "reason": "Customer refund" }
Auth: Admin + manage_affiliate permission

# Void pending
POST /affiliate-commissions/void/:orderId
Auth: Admin + manage_affiliate permission

# Partial reversal
POST /affiliate-commissions/partial-reverse/:orderItemId
Body: { "refundAmount": 50000 }
Auth: Admin + manage_affiliate permission

# View history (affiliate)
GET /affiliate-commissions/reversal-history?page=1&limit=20
Auth: JwtAuthGuard
```

### **Fraud Detection:**
```bash
# View fraud logs
GET /affiliate-fraud/logs?page=1&limit=20
Auth: Admin + manage_affiliate permission

# Review fraud
POST /affiliate-fraud/review/:id
Body: { 
  "action": "IGNORE" | "BAN_USER" | "SUSPEND_AFFILIATE",
  "notes": "False positive"
}
Auth: Admin + manage_affiliate permission
```

---

## 💻 **CODE SNIPPETS**

### **Check for fraud before commission:**
```typescript
// In commission-calc.service.ts
const fraudCheck = await this.fraudService.runFraudChecks({
  user_id: order.user.id,
  affiliate_user_id: order.affiliate_user_id,
  ip_address: order.ip_address,
});

if (fraudCheck.checks.selfReferral) {
  return { blocked: true, reason: 'Self-referral' };
}
```

### **Auto-reverse on order cancel:**
```typescript
// In orders.service.ts
if (newStatus === 'CANCELLED') {
  await this.reversalService.voidCommissionForOrder(orderId);
}
```

### **Auto-reverse on refund:**
```typescript
// In orders.service.ts
if (newStatus === 'REFUNDED') {
  await this.reversalService.reverseCommissionForOrder(
    orderId,
    'Order refunded'
  );
}
```

---

## 📁 **KEY FILES**

### **Backend:**
```
backend/src/modules/
├── affiliate-commissions/
│   ├── service/
│   │   ├── commision-revesal.service.ts       ✅ Reversal logic
│   │   └── affiliate-commissions.service.ts   ✅ Added findReversedByUser()
│   └── controller/
│       └── affiliate-commissions.controller.ts ✅ 4 new endpoints
│
├── affiliate-fraud/                            ✅ NEW MODULE
│   ├── entity/
│   │   └── affiliate-fraud-log.entity.ts      ✅ Fraud log entity
│   ├── service/
│   │   └── fraud-detection.service.ts         ✅ 5 fraud checks
│   ├── controller/
│   │   └── fraud-detection.controller.ts      ✅ Admin APIs
│   └── affiliate-fraud.module.ts              ✅ Module config
│
└── wallet/
    └── wallet.service.ts                       ✅ Updated for transactions
```

### **Documentation:**
```
/
├── IMPLEMENTATION_SUMMARY.md    ✅ Full implementation details
├── INTEGRATION_GUIDE.md         ✅ Step-by-step integration
├── QUICK_REFERENCE.md           ✅ This file
└── critical-fix-plan.md         📋 Original plan
```

---

## 🎯 **NEXT STEPS**

### **1. Backend Integration (1-2 hours)**
Follow `INTEGRATION_GUIDE.md`:
- Integrate fraud checks into commission calculation
- Hook reversal into order status changes
- Add module dependencies

### **2. Frontend (2-3 hours)**
- Update `affiliateTransaction.tsx` to show REVERSED status
- Create `FraudDetectionDashboard.tsx` for admin
- Add routes and navigation

### **3. Testing (1 hour)**
- Test self-referral blocking
- Test commission reversal flow
- Test fraud log review
- Test partial refunds

---

## 🔍 **TESTING COMMANDS**

### **Test Self-Referral:**
```bash
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "affiliate_user_id": 1,
    "items": [...]
  }'
# Expected: Blocked with fraud log
```

### **Test Commission Reversal:**
```bash
# Cancel order
curl -X POST http://localhost:3000/affiliate-commissions/void/123 \
  -H "Authorization: Bearer <admin_token>"
# Expected: Pending commissions voided

# Refund order
curl -X POST http://localhost:3000/affiliate-commissions/reverse/123 \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Customer refund"}'
# Expected: Paid commissions reversed, wallet deducted
```

### **Test Fraud Logs:**
```bash
# View logs
curl -X GET http://localhost:3000/affiliate-fraud/logs?page=1 \
  -H "Authorization: Bearer <admin_token>"

# Review log
curl -X POST http://localhost:3000/affiliate-fraud/review/1 \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"action": "IGNORE", "notes": "False positive"}'
```

---

## 📊 **STATUS**

```
✅ Backend Core:        100% COMPLETE
⏳ Integration:          0% (see INTEGRATION_GUIDE.md)
⏳ Frontend:             0% (next phase)
⏳ Testing:              0% (after integration)

OVERALL: 50% COMPLETE
```

---

## 🆘 **TROUBLESHOOTING**

### **Issue: TypeScript errors**
✅ **FIXED** - All import paths and field names corrected

### **Issue: Transaction not rolling back**
✅ **FIXED** - Using EntityManager for atomicity

### **Issue: Wallet balance not updating**
✅ **FIXED** - WalletService accepts manager parameter

### **Issue: Module not found**
✅ **FIXED** - AffiliateFraudModule registered in app.module.ts

---

## 📞 **SUPPORT**

- **Implementation Details**: See `IMPLEMENTATION_SUMMARY.md`
- **Integration Steps**: See `INTEGRATION_GUIDE.md`
- **Original Plan**: See `critical-fix-plan.md`

---

**Last Updated**: Phase 1 & 2 Backend Core Complete ✅
