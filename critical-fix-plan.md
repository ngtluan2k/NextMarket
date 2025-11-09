# Plan Implementation - Affiliate System Improvements

Tôi sẽ lên plan chi tiết để implement các chức năng quan trọng, bỏ qua legal và cashout.

## 📋 **IMPLEMENTATION PLAN - AFFILIATE IMPROVEMENTS**

---

## **PHASE 1: REFUND/CANCEL HANDLING** ⭐⭐⭐ (CRITICAL)

### **Mục tiêu:**
Xử lý commission khi order bị refund, cancel, hoặc return

### **A. Backend Changes**

#### **1.1. Update AffiliateCommission Entity**
```typescript
// affiliate-commissions.entity.ts
export class AffiliateCommission {
  // Thêm fields:
  @Column({ type: 'enum', enum: ['PENDING', 'PAID', 'REVERSED', 'VOIDED'] })
  status: string;
  
  @Column({ type: 'decimal', nullable: true })
  reversed_amount: number; // Số tiền đã reverse
  
  @Column({ type: 'timestamp', nullable: true })
  reversed_at: Date;
  
  @Column({ type: 'varchar', nullable: true })
  reversal_reason: string; // REFUND, CANCEL, RETURN
  
  @Column({ type: 'int', nullable: true })
  related_order_id: number; // Order gốc
}
```

#### **1.2. Create Commission Reversal Service**
```typescript
// commission-reversal.service.ts
export class CommissionReversalService {
  
  // Reverse commission khi refund
  async reverseCommissionForOrder(orderId: number, reason: string) {
    // 1. Tìm tất cả commissions của order
    // 2. Update status = 'REVERSED'
    // 3. Trừ balance của affiliates
    // 4. Log reversal history
    // 5. Notify affiliates
  }
  
  // Void commission khi cancel (trước khi paid)
  async voidCommissionForOrder(orderId: number) {
    // 1. Tìm commissions với status = 'PENDING'
    // 2. Update status = 'VOIDED'
    // 3. Không trừ balance (vì chưa paid)
  }
  
  // Partial reversal (refund 1 phần)
  async partialReversalForOrderItem(orderItemId: number, refundAmount: number) {
    // 1. Tính lại commission theo refund amount
    // 2. Reverse phần tương ứng
  }
}
```

#### **1.3. Hook vào Order Status Changes**
```typescript
// orders.service.ts hoặc event listener
async handleOrderStatusChange(orderId: number, newStatus: string) {
  switch(newStatus) {
    case 'CANCELLED':
      await commissionReversalService.voidCommissionForOrder(orderId);
      break;
      
    case 'REFUNDED':
      await commissionReversalService.reverseCommissionForOrder(orderId, 'REFUND');
      break;
      
    case 'RETURNED':
      await commissionReversalService.reverseCommissionForOrder(orderId, 'RETURN');
      break;
  }
}
```

#### **1.4. New APIs**
```typescript
// affiliate-commissions.controller.ts
@Post('reverse/:orderId')
@UseGuards(JwtAuthGuard, RolesGuard)
async reverseCommission(@Param('orderId') orderId: number) {
  // Admin manually reverse commission
}

@Get('reversal-history')
async getReversalHistory(@Request() req) {
  // Affiliate xem lịch sử bị reverse
}
```

### **B. Frontend Changes**

#### **1.5. Update Commission History UI**
```typescript
// affiliateTransaction.tsx
// Thêm hiển thị:
- Status: REVERSED (màu đỏ)
- Reversal reason
- Original amount vs Reversed amount
- Reversal date
```

#### **1.6. Add Reversal Notifications**
```typescript
// Notification khi commission bị reverse
"Hoa hồng từ đơn hàng #12345 đã bị thu hồi do khách hàng hoàn tiền"
```

### **Thời gian:** 2-3 ngày
### **Files cần tạo/sửa:**
- commission-reversal.service.ts (new)
- affiliate-commissions.entity.ts (update)
- [affiliate-commissions.controller.ts](cci:7://file:///home/rio/Documents/CODE/new/NextMarket/backend/src/modules/affiliate-commissions/affiliate-commissions.controller.ts:0:0-0:0) (update)
- orders.service.ts (update - hook status change)
- [affiliateTransaction.tsx](cci:7://file:///home/rio/Documents/CODE/new/NextMarket/frontend/src/app/page/affiliate/user/dashboard/tab/affiliateTransaction.tsx:0:0-0:0) (update UI)

---

## **PHASE 2: SELF-REFERRAL PREVENTION** ⭐⭐⭐ (CRITICAL)

### **Mục tiêu:**
Chặn affiliate tự mua qua link của mình để nhận commission

### **A. Backend Changes**

#### **2.1. Add Validation in Commission Calculation**
```typescript
// commission-calc.service.ts
async handleOrderPaid(orderId: number) {
  const order = await this.ordersRepo.findOne({
    where: { id: orderId },
    relations: ['user'] // buyer
  });
  
  // 🚫 CHECK: Buyer có phải là affiliate không?
  if (order.affiliate_user_id && order.user_id === order.affiliate_user_id) {
    console.log('⚠️ Self-referral detected - blocking commission');
    
    // Log fraud attempt
    await this.logFraudAttempt({
      type: 'SELF_REFERRAL',
      affiliate_user_id: order.affiliate_user_id,
      order_id: orderId,
      detected_at: new Date()
    });
    
    // Không tính commission
    return { blocked: true, reason: 'Self-referral not allowed' };
  }
  
  // 🚫 CHECK: Buyer có trong cây affiliate không? (tránh circular)
  const isInAffiliateTree = await this.checkIfInAffiliateTree(
    order.user_id, 
    order.affiliate_user_id
  );
  
  if (isInAffiliateTree) {
    console.log('⚠️ Circular referral detected');
    return { blocked: true, reason: 'Circular referral not allowed' };
  }
  
  // Continue normal calculation...
}
```

#### **2.2. Create Fraud Detection Entity**
```typescript
// fraud-detection.entity.ts
@Entity('affiliate_fraud_logs')
export class AffiliateFraudLog {
  @PrimaryGeneratedColumn()
  id: number;
  
  @Column({ type: 'enum', enum: ['SELF_REFERRAL', 'DUPLICATE_ORDER', 'SUSPICIOUS_PATTERN'] })
  fraud_type: string;
  
  @Column()
  affiliate_user_id: number;
  
  @Column({ nullable: true })
  order_id: number;
  
  @Column({ type: 'json', nullable: true })
  details: any; // Chi tiết fraud
  
  @Column({ type: 'varchar', nullable: true })
  ip_address: string;
  
  @CreateDateColumn()
  detected_at: Date;
  
  @Column({ default: false })
  is_reviewed: boolean; // Admin đã review chưa
}
```

#### **2.3. Admin API để xem fraud logs**
```typescript
// fraud-detection.controller.ts
@Controller('affiliate-fraud')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class FraudDetectionController {
  
  @Get('logs')
  @RequirePermissions('manage_affiliate')
  async getFraudLogs(
    @Query('page') page: number,
    @Query('limit') limit: number
  ) {
    // Lấy danh sách fraud attempts
  }
  
  @Post('review/:id')
  @RequirePermissions('manage_affiliate')
  async reviewFraudLog(
    @Param('id') id: number,
    @Body() body: { action: 'IGNORE' | 'BAN_USER' | 'SUSPEND_AFFILIATE' }
  ) {
    // Admin xử lý fraud case
  }
}
```

### **B. Frontend Changes**

#### **2.4. Admin Fraud Detection Dashboard**
```typescript
// FraudDetectionDashboard.tsx (new)
- Bảng hiển thị fraud attempts
- Filter by type, date, user
- Actions: Review, ban user, suspend affiliate
- Stats: Total attempts, by type
```

### **Thời gian:** 1-2 ngày
### **Files cần tạo/sửa:**
- fraud-detection.entity.ts (new)
- fraud-detection.service.ts (new)
- fraud-detection.controller.ts (new)
- commission-calc.service.ts (update)
- FraudDetectionDashboard.tsx (new)

---

## **PHASE 3: ATTRIBUTION WINDOW - COOKIE TRACKING** ⭐⭐⭐ (CRITICAL)

### **Mục tiêu:**
Thay sessionStorage bằng cookie với expiry 30-90 ngày

### **A. Frontend Changes**

#### **3.1. Update Tracking Utils**
```typescript
// affiliate-tracking.ts
import Cookies from 'js-cookie';

const ATTRIBUTION_WINDOW_DAYS = 30; // Configurable

export interface AffiliateTrackingData {
  affiliateCode: string;
  productId?: number;
  variantId?: number;
  timestamp: number;
  clickId?: string; // Unique click ID
  source?: string; // utm_source
}

// Store in cookie instead of sessionStorage
export function storeAffiliateData(data: AffiliateTrackingData) {
  const trackingData = {
    ...data,
    clickId: generateClickId(), // UUID
    timestamp: Date.now()
  };
  
  // Set cookie with 30 days expiry
  Cookies.set('affiliate_tracking', JSON.stringify(trackingData), {
    expires: ATTRIBUTION_WINDOW_DAYS,
    sameSite: 'lax',
    secure: true // HTTPS only
  });
  
  // Also track click event to backend
  trackAffiliateClick(trackingData);
}

export function getAffiliateData(): AffiliateTrackingData | null {
  const data = Cookies.get('affiliate_tracking');
  if (!data) return null;
  
  try {
    const parsed = JSON.parse(data);
    
    // Check if expired (30 days)
    const daysSinceClick = (Date.now() - parsed.timestamp) / (1000 * 60 * 60 * 24);
    if (daysSinceClick > ATTRIBUTION_WINDOW_DAYS) {
      clearAffiliateData();
      return null;
    }
    
    return parsed;
  } catch {
    return null;
  }
}

export function clearAffiliateData() {
  Cookies.remove('affiliate_tracking');
}

// Track click to backend
async function trackAffiliateClick(data: AffiliateTrackingData) {
  await fetch('/api/affiliate-links/track-click', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
}
```

#### **3.2. Update AffiliateLinkResolver**
```typescript
// AffiliateLinkResolver.tsx
useEffect(() => {
  const aff = searchParams.get('aff');
  
  if (aff) {
    const trackingData: AffiliateTrackingData = {
      affiliateCode: aff,
      productId: id ? parseInt(id, 10) : undefined,
      variantId: variant ? parseInt(variant, 10) : undefined,
      timestamp: Date.now(),
      source: searchParams.get('utm_source') || undefined
    };
    
    // Store in cookie (30 days)
    storeAffiliateData(trackingData);
  }
}, [searchParams]);
```

### **B. Backend Changes**

#### **3.3. Create Click Tracking Entity**
```typescript
// affiliate-clicks.entity.ts
@Entity('affiliate_clicks')
export class AffiliateClick {
  @PrimaryGeneratedColumn()
  id: number;
  
  @Column({ type: 'uuid' })
  click_id: string; // From frontend
  
  @Column()
  affiliate_link_id: number;
  
  @Column()
  affiliate_code: string;
  
  @Column({ nullable: true })
  product_id: number;
  
  @Column({ nullable: true })
  ip_address: string;
  
  @Column({ nullable: true })
  user_agent: string;
  
  @Column({ nullable: true })
  referrer: string;
  
  @Column({ type: 'json', nullable: true })
  utm_params: any; // utm_source, utm_medium, etc.
  
  @CreateDateColumn()
  clicked_at: Date;
  
  @Column({ default: false })
  converted: boolean; // Có order không?
  
  @Column({ nullable: true })
  order_id: number; // Nếu converted
}
```

#### **3.4. Click Tracking API**
```typescript
// affiliate-links.controller.ts
@Post('track-click')
async trackClick(
  @Body() body: AffiliateTrackingData,
  @Request() req
) {
  const ipAddress = req.ip;
  const userAgent = req.headers['user-agent'];
  const referrer = req.headers['referer'];
  
  // Save click to database
  await this.service.trackClick({
    ...body,
    ipAddress,
    userAgent,
    referrer
  });
  
  // Update link stats
  await this.service.incrementClickCount(body.affiliateCode);
  
  return { success: true };
}
```

#### **3.5. Update Commission Calculation**
```typescript
// commission-calc.service.ts
async handleOrderPaid(orderId: number) {
  // ...existing code...
  
  // Mark click as converted
  if (order.affiliate_code) {
    await this.clicksRepo.update(
      { 
        affiliate_code: order.affiliate_code,
        converted: false 
      },
      { 
        converted: true,
        order_id: orderId 
      }
    );
  }
}
```

### **C. Analytics Enhancement**

#### **3.6. Click-to-Conversion Tracking**
```typescript
// affiliate-links.service.ts
async getClickAnalytics(userId: number) {
  const clicks = await this.clicksRepo.find({
    where: { affiliate_link: { user_id: userId } },
    relations: ['affiliate_link']
  });
  
  const totalClicks = clicks.length;
  const conversions = clicks.filter(c => c.converted).length;
  const conversionRate = (conversions / totalClicks) * 100;
  
  return {
    totalClicks,
    conversions,
    conversionRate,
    avgTimeToConversion: calculateAvgTime(clicks)
  };
}
```

### **Thời gian:** 2-3 ngày
### **Files cần tạo/sửa:**
- [affiliate-tracking.ts](cci:7://file:///home/rio/Documents/CODE/new/NextMarket/frontend/src/home/rio/Documents/CODE/new/NextMarket/frontend/src/utils/affiliate-tracking.ts:0:0-0:0) (update - cookie logic)
- affiliate-clicks.entity.ts (new)
- [affiliate-links.controller.ts](cci:7://file:///home/rio/Documents/CODE/new/NextMarket/backend/src/modules/affiliate-links/affiliate-links.controller.ts:0:0-0:0) (update - track-click API)
- commission-calc.service.ts (update - mark converted)
- [AffiliateLinkResolver.tsx](cci:7://file:///home/rio/Documents/CODE/new/NextMarket/frontend/src/home/rio/Documents/CODE/new/NextMarket/frontend/src/app/page/AffiliateLinkResolver.tsx:0:0-0:0) (update)
- Install: js-cookie package

---

## **PHASE 4: FRAUD DETECTION BASICS** ⭐⭐ (HIGH)

### **Mục tiêu:**
Phát hiện các pattern gian lận cơ bản

### **A. Backend Changes**

#### **4.1. Fraud Detection Service**
```typescript
// fraud-detection.service.ts
export class FraudDetectionService {
  
  // Check duplicate orders
  async checkDuplicateOrder(userId: number, orderData: any): Promise<boolean> {
    const recentOrders = await this.ordersRepo.find({
      where: {
        user_id: userId,
        created_at: MoreThan(new Date(Date.now() - 24 * 60 * 60 * 1000)) // Last 24h
      }
    });
    
    // Check if same products
    const isDuplicate = recentOrders.some(order => 
      this.isSameProducts(order.items, orderData.items)
    );
    
    if (isDuplicate) {
      await this.logFraud({
        type: 'DUPLICATE_ORDER',
        user_id: userId,
        details: { recentOrders, newOrder: orderData }
      });
      return true;
    }
    
    return false;
  }
  
  // Check suspicious IP
  async checkSuspiciousIP(ipAddress: string): Promise<boolean> {
    const ordersFromIP = await this.ordersRepo.count({
      where: {
        ip_address: ipAddress,
        created_at: MoreThan(new Date(Date.now() - 24 * 60 * 60 * 1000))
      }
    });
    
    // More than 10 orders from same IP in 24h = suspicious
    if (ordersFromIP > 10) {
      await this.logFraud({
        type: 'SUSPICIOUS_IP',
        details: { ipAddress, orderCount: ordersFromIP }
      });
      return true;
    }
    
    return false;
  }
  
  // Check conversion rate
  async checkAbnormalConversionRate(affiliateUserId: number): Promise<boolean> {
    const stats = await this.getAffiliateStats(affiliateUserId);
    
    // Conversion rate > 50% is suspicious
    if (stats.conversionRate > 50) {
      await this.logFraud({
        type: 'ABNORMAL_CONVERSION_RATE',
        affiliate_user_id: affiliateUserId,
        details: { conversionRate: stats.conversionRate }
      });
      return true;
    }
    
    return false;
  }
  
  // Check rapid purchase (click -> buy < 1 minute)
  async checkRapidPurchase(clickId: string, orderTime: Date): Promise<boolean> {
    const click = await this.clicksRepo.findOne({ where: { click_id: clickId } });
    
    if (click) {
      const timeDiff = (orderTime.getTime() - click.clicked_at.getTime()) / 1000; // seconds
      
      // Less than 60 seconds = suspicious
      if (timeDiff < 60) {
        await this.logFraud({
          type: 'RAPID_PURCHASE',
          details: { clickId, timeDiff }
        });
        return true;
      }
    }
    
    return false;
  }
  
  // Run all checks
  async runFraudChecks(order: any): Promise<FraudCheckResult> {
    const checks = await Promise.all([
      this.checkDuplicateOrder(order.user_id, order),
      this.checkSuspiciousIP(order.ip_address),
      this.checkAbnormalConversionRate(order.affiliate_user_id),
      this.checkRapidPurchase(order.click_id, order.created_at)
    ]);
    
    const fraudDetected = checks.some(check => check === true);
    
    return {
      fraudDetected,
      checks: {
        duplicateOrder: checks[0],
        suspiciousIP: checks[1],
        abnormalConversionRate: checks[2],
        rapidPurchase: checks[3]
      }
    };
  }
}
```

#### **4.2. Integrate with Order Creation**
```typescript
// orders.service.ts
async createOrder(userId: number, orderData: any) {
  // Run fraud checks
  const fraudCheck = await this.fraudDetectionService.runFraudChecks({
    user_id: userId,
    ...orderData
  });
  
  if (fraudCheck.fraudDetected) {
    // Option 1: Block order
    throw new BadRequestException('Order blocked due to fraud detection');
    
    // Option 2: Flag for review
    orderData.requires_review = true;
    orderData.fraud_flags = fraudCheck.checks;
  }
  
  // Continue creating order...
}
```

#### **4.3. Rate Limiting for Clicks**
```typescript
// affiliate-links.controller.ts
import { Throttle } from '@nestjs/throttler';

@Post('track-click')
@Throttle(10, 60) // Max 10 clicks per minute per IP
async trackClick(@Body() body: AffiliateTrackingData) {
  // ...
}
```

### **B. Frontend Changes**

#### **4.4. Admin Fraud Dashboard**
```typescript
// FraudDetectionDashboard.tsx
- Real-time fraud alerts
- Fraud statistics by type
- Suspicious affiliates list
- Actions: Review, suspend, ban
```

### **Thời gian:** 2-3 ngày
### **Files cần tạo/sửa:**
- fraud-detection.service.ts (enhance)
- orders.service.ts (integrate fraud checks)
- [affiliate-links.controller.ts](cci:7://file:///home/rio/Documents/CODE/new/NextMarket/backend/src/modules/affiliate-links/affiliate-links.controller.ts:0:0-0:0) (rate limiting)
- FraudDetectionDashboard.tsx (new)
- Install: @nestjs/throttler package

---

## **PHASE 5: COMMISSION CAPS & BUDGET CONTROL** ⭐⭐ (HIGH)

### **Mục tiêu:**
Kiểm soát ngân sách chương trình, auto-pause khi hết budget

### **A. Backend Changes**

#### **5.1. Add Budget Tracking to Program**
```typescript
// affiliate-program.entity.ts
export class AffiliateProgram {
  // Existing fields...
  
  @Column({ type: 'decimal', default: 0 })
  total_budget_amount: number; // Tổng ngân sách (VND)
  
  @Column({ type: 'decimal', default: 0 })
  spent_budget: number; // Đã chi
  
  @Column({ type: 'decimal', default: 0 })
  pending_budget: number; // Đang pending
  
  @Column({ type: 'decimal', nullable: true })
  monthly_budget_cap: number; // Cap theo tháng
  
  @Column({ type: 'decimal', nullable: true })
  daily_budget_cap: number; // Cap theo ngày
  
  @Column({ default: false })
  auto_pause_on_budget_limit: boolean;
}
```

#### **5.2. Budget Tracking Service**
```typescript
// budget-tracking.service.ts
export class BudgetTrackingService {
  
  async checkBudgetAvailable(programId: number, amount: number): Promise<boolean> {
    const program = await this.programRepo.findOne({ where: { id: programId } });
    
    // Check total budget
    if (program.total_budget_amount > 0) {
      const available = program.total_budget_amount - program.spent_budget - program.pending_budget;
      if (available < amount) {
        return false;
      }
    }
    
    // Check monthly cap
    if (program.monthly_budget_cap > 0) {
      const monthlySpent = await this.getMonthlySpent(programId);
      if (monthlySpent + amount > program.monthly_budget_cap) {
        return false;
      }
    }
    
    // Check daily cap
    if (program.daily_budget_cap > 0) {
      const dailySpent = await this.getDailySpent(programId);
      if (dailySpent + amount > program.daily_budget_cap) {
        return false;
      }
    }
    
    return true;
  }
  
  async reserveBudget(programId: number, amount: number) {
    // Tăng pending_budget khi tạo commission PENDING
    await this.programRepo.increment(
      { id: programId },
      'pending_budget',
      amount
    );
  }
  
  async commitBudget(programId: number, amount: number) {
    // Khi commission PAID: pending -> spent
    await this.programRepo.decrement({ id: programId }, 'pending_budget', amount);
    await this.programRepo.increment({ id: programId }, 'spent_budget', amount);
    
    // Check if should auto-pause
    const program = await this.programRepo.findOne({ where: { id: programId } });
    if (program.auto_pause_on_budget_limit) {
      const remaining = program.total_budget_amount - program.spent_budget;
      if (remaining <= 0) {
        await this.pauseProgram(programId);
      }
    }
  }
  
  async releaseBudget(programId: number, amount: number) {
    // Khi commission REVERSED: trả lại budget
    await this.programRepo.decrement({ id: programId }, 'spent_budget', amount);
  }
  
  async pauseProgram(programId: number) {
    await this.programRepo.update(
      { id: programId },
      { is_active: false, paused_reason: 'Budget limit reached' }
    );
    
    // Send notification to admin
    await this.notificationService.notifyAdmins({
      type: 'PROGRAM_AUTO_PAUSED',
      programId,
      reason: 'Budget limit reached'
    });
  }
}
```

#### **5.3. Integrate with Commission Calculation**
```typescript
// commission-calc.service.ts
async handleOrderPaid(orderId: number) {
  // ...existing code...
  
  // Check budget before creating commissions
  const totalCommissionAmount = this.calculateTotalCommission(order);
  const budgetAvailable = await this.budgetTrackingService.checkBudgetAvailable(
    programId,
    totalCommissionAmount
  );
  
  if (!budgetAvailable) {
    console.log('⚠️ Budget limit reached - commission blocked');
    await this.logEvent({
      type: 'COMMISSION_BLOCKED_BUDGET',
      order_id: orderId,
      program_id: programId
    });
    return { blocked: true, reason: 'Budget limit reached' };
  }
  
  // Reserve budget
  await this.budgetTrackingService.reserveBudget(programId, totalCommissionAmount);
  
  // Create commissions...
  
  // When commission PAID:
  await this.budgetTrackingService.commitBudget(programId, totalCommissionAmount);
}
```

#### **5.4. Budget Monitoring APIs**
```typescript
// affiliate-programs.controller.ts
@Get(':id/budget-status')
async getBudgetStatus(@Param('id') id: number) {
  const program = await this.service.findOne(id);
  
  return {
    total_budget: program.total_budget_amount,
    spent: program.spent_budget,
    pending: program.pending_budget,
    available: program.total_budget_amount - program.spent_budget - program.pending_budget,
    percentage_used: (program.spent_budget / program.total_budget_amount) * 100,
    monthly_spent: await this.budgetService.getMonthlySpent(id),
    daily_spent: await this.budgetService.getDailySpent(id)
  };
}

@Get('budget-alerts')
@RequirePermissions('manage_affiliate')
async getBudgetAlerts() {
  // Programs với budget < 20%
  return this.service.getProgramsNearBudgetLimit();
}
```

### **B. Frontend Changes**

#### **5.5. Budget Dashboard**
```typescript
// BudgetMonitoringDashboard.tsx
- Budget usage charts per program
- Alerts for programs near limit
- Daily/monthly spending trends
- Auto-pause status
```

#### **5.6. Update Program Form**
```typescript
// CreateProgramForm.tsx
- Add total_budget_amount field
- Add monthly_budget_cap field
- Add daily_budget_cap field
- Add auto_pause_on_budget_limit toggle
```

### **Thời gian:** 2-3 ngày
### **Files cần tạo/sửa:**
- budget-tracking.service.ts (new)
- affiliate-program.entity.ts (update)
- commission-calc.service.ts (integrate budget checks)
- affiliate-programs.controller.ts (budget APIs)
- BudgetMonitoringDashboard.tsx (new)

---

## **PHASE 6: EMAIL NOTIFICATIONS** ⭐ (MEDIUM)

### **Mục tiêu:**
Gửi email thông báo cho affiliates về các sự kiện quan trọng

### **A. Backend Setup**

#### **6.1. Install Email Service**
```bash
npm install @nestjs-modules/mailer nodemailer
npm install --save-dev @types/nodemailer
```

#### **6.2. Email Templates**
```typescript
// email-templates/
├── commission-earned.hbs
├── commission-reversed.hbs
├── program-paused.hbs
├── fraud-detected.hbs
└── monthly-summary.hbs
```

#### **6.3. Notification Service**
```typescript
// affiliate-notifications.service.ts
export class AffiliateNotificationsService {
  
  async notifyCommissionEarned(commission: AffiliateCommission) {
    const affiliate = await this.getUserEmail(commission.affiliate_user_id);
    
    await this.mailerService.sendMail({
      to: affiliate.email,
      subject: 'Bạn vừa nhận được hoa hồng mới!',
      template: 'commission-earned',
      context: {
        amount: commission.amount,
        orderNumber: commission.order.order_number,
        productName: commission.product.name,
        level: commission.level
      }
    });
  }
  
  async notifyCommissionReversed(commission: AffiliateCommission) {
    // Email thông báo commission bị thu hồi
  }
  
  async sendMonthlySummary(userId: number) {
    const summary = await this.getMonthlyStats(userId);
    
    await this.mailerService.sendMail({
      to: summary.email,
      subject: 'Báo cáo hoa hồng tháng này',
      template: 'monthly-summary',
      context: summary
    });
  }
}
```

#### **6.4. Integrate with Events**
```typescript
// commission-calc.service.ts
async createCommission(data: any) {
  const commission = await this.commissionsRepo.save(data);
  
  // Send notification
  await this.notificationService.notifyCommissionEarned(commission);
  
  return commission;
}
```

### **B. Notification Preferences**

#### **6.5. User Preferences Entity**
```typescript
// affiliate-notification-preferences.entity.ts
@Entity('affiliate_notification_preferences')
export class AffiliateNotificationPreferences {
  @PrimaryGeneratedColumn()
  id: number;
  
  @Column()
  user_id: number;
  
  @Column({ default: true })
  email_on_commission_earned: boolean;
  
  @Column({ default: true })
  email_on_commission_reversed: boolean;
  
  @Column({ default: true })
  email_monthly_summary: boolean;
  
  @Column({ default: false })
  email_on_program_updates: boolean;
}
```

### **Thời gian:** 2 ngày
### **

# Plan Implementation - Affiliate System Improvements

## 📋 **TỔNG QUAN PLAN**

### **Ưu tiên thực hiện:**
```
🔴 CRITICAL (2-3 tuần):
├─ Phase 1: Refund/Cancel Handling
├─ Phase 2: Self-Referral Prevention  
└─ Phase 3: Attribution Window (Cookie)

🟠 HIGH (1-2 tuần):
├─ Phase 4: Fraud Detection Basics
└─ Phase 5: Budget Control

🟡 MEDIUM (1 tuần):
└─ Phase 6: Email Notifications
```

---

## **PHASE 1: REFUND/CANCEL HANDLING** (2-3 ngày)

### **Backend:**
1. **Update Entity**: Thêm status: REVERSED/VOIDED, reversed_amount, reversal_reason 
2. **Service**: CommissionReversalService - reverse/void commissions
3. **Hook**: Listen order status → trigger reversal
4. **APIs**: POST /reverse/:orderId, GET /reversal-history 

### **Frontend:**
- Update [affiliateTransaction.tsx](cci:7://file:///home/rio/Documents/CODE/new/NextMarket/frontend/src/app/page/affiliate/user/dashboard/tab/affiliateTransaction.tsx:0:0-0:0) hiển thị REVERSED status (màu đỏ)
- Notification khi bị reverse

### **Files:**
- commission-reversal.service.ts (new)
- affiliate-commissions.entity.ts (update)
- orders.service.ts (hook status change)

---

## **PHASE 2: SELF-REFERRAL PREVENTION** (1-2 ngày)

### **Backend:**
1. **Validation**: Check buyer_id === affiliate_user_id → block
2. **Fraud Log**: Entity AffiliateFraudLog track attempts
3. **Admin API**: View fraud logs, ban users

### **Frontend:**
- FraudDetectionDashboard.tsx - admin xem fraud attempts

### **Files:**
- fraud-detection.entity.ts (new)
- commission-calc.service.ts (add validation)
- fraud-detection.controller.ts (new)

---

## **PHASE 3: ATTRIBUTION WINDOW** (2-3 ngày)

### **Frontend:**
- Replace sessionStorage → Cookies (30 days expiry)
- Track clicks to backend với click_id 

### **Backend:**
- Entity AffiliateClick track clicks
- API POST /track-click 
- Mark click as converted when order paid

### **Files:**
- [affiliate-tracking.ts](cci:7://file:///home/rio/Documents/CODE/new/NextMarket/frontend/src/home/rio/Documents/CODE/new/NextMarket/frontend/src/utils/affiliate-tracking.ts:0:0-0:0) (use js-cookie)
- affiliate-clicks.entity.ts (new)
- Install: js-cookie 

---

## **PHASE 4: FRAUD DETECTION** (2-3 ngày)

### **Checks:**
- Duplicate orders (same user, same products, 24h)
- Suspicious IP (>10 orders/24h)
- High conversion rate (>50%)
- Rapid purchase (click → buy < 60s)

### **Implementation:**
- FraudDetectionService với các check methods
- Integrate vào orders.service.ts 
- Rate limiting: @Throttle(10, 60) cho track-click

---

## **PHASE 5: BUDGET CONTROL** (2-3 ngày)

### **Features:**
- Track spent_budget, pending_budget per program
- Check budget before creating commission
- Auto-pause program khi hết budget
- Monthly/daily caps

### **Files:**
- budget-tracking.service.ts (new)
- affiliate-program.entity.ts (add budget fields)
- BudgetMonitoringDashboard.tsx (new)

---

## **PHASE 6: EMAIL NOTIFICATIONS** (2 ngày)

### **Setup:**
- Install @nestjs-modules/mailer 
- Templates: commission-earned, reversed, monthly-summary
- Notification preferences per user

### **Events:**
- Commission earned
- Commission reversed
- Monthly summary
- Budget alerts

---

## **TỔNG THỜI GIAN: 3-4 TUẦN**

### **Tuần 1-2:** Phase 1, 2, 3 (Critical)
### **Tuần 3:** Phase 4, 5 (High)  
### **Tuần 4:** Phase 6, Testing, Polish

Bạn muốn bắt đầu implement phase nào trước?