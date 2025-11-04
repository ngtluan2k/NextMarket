import { CategoryModule } from './modules/categories/category.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ProductModule } from './modules/product/product.module';
import { UserModule } from './modules/user/user.module';
import { StoreModule } from './modules/store/store.module';
import { BrandModule } from './modules/brands/brands.module';
import { RoleModule } from './modules/role/role.module';
import { PermissionModule } from './modules/permission/permission.module';
import { RolePermissionModule } from './modules/role-permission/role-permission.module';
import { UserRoleModule } from './modules/user-role/user-role.module';
import { CartModule } from './modules/cart/cart.module';
import { join } from 'path';
import { StoreDocumentModule } from './modules/store-document/store-document.module';
import { ProductCategoryModule } from './modules/product_category/product_category.module';
import { ProductMediaModule } from './modules/product_media/product_media.module';
import { VariantModule } from './modules/variant/variant.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { PricingRuleModule } from './modules/pricing-rule/pricing-rule.module';
import { AuthModule } from './common/auth/auth.module';

import { VouchersModule } from './modules/vouchers/vouchers.module';
import { VoucherUsageModule } from './modules/voucher-usage/voucher-usage.module';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { ServeStaticModule } from '@nestjs/serve-static';
import { UserAddressModule } from './modules/user_address/user_address.module';
import { StoreIdentificationModule } from './modules/store-identification/store-identification.module';
import { OrdersModule } from './modules/orders/orders.module';
import { OrderItemsModule } from './modules/order-items/order-items.module';
import { OrderStatusHistoryModule } from './modules/order-status-history/order-status-history.module';
import { OrderInvoicesModule } from './modules/order-invoices/order-invoices.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { RefundsModule } from './modules/refunds/refunds.module';
import { ReturnsModule } from './modules/returns/returns.module';
import { CancellationsModule } from './modules/cancellations/cancellations.module';
import { OrderShipmentsModule } from './modules/order-shipments/order-shipments.module';
import { ShippingLabelsModule } from './modules/shipping-labels/shipping-labels.module';
import { ShipmentsModule } from './modules/shipments/shipments.module';
import { AffiliateCommissionsModule } from './modules/affiliate-commissions/affiliate-commissions.module';
import { ProvincesModule } from './provinces/provinces.module';
import { PaymentMethodsModule } from './modules/payment-methods/payment-methods.module';
import { PaymentTransactionsModule } from './modules/payment-transactions/payment-transactions.module';
import { ProductReviewsModule } from './modules/product_reviews/product_reviews.module';
import { FilesModule } from './common/files/files.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { WalletTransactionModule } from './modules/wallet_transaction/wallet_transaction.module';
import { StoreFollowersModule } from './modules/store-follower/store-followers.module';
import { SubscriptionModule } from './modules/subscription/subscription.module';
import { SubscriptionUsagesModule } from './modules/subscription_usages/subscription_usages.module';
import { AffiliateLinksModule } from './modules/affiliate-links/affiliate-links.module';
import { AffiliateRegistrationModule } from './modules/affiliate-registration/affiliate-registration.module';
import { AffiliatePlatformModule } from './modules/affiliate-platform/affiliate-platform.module';
import { AffiliateRegistrationPlatformModule } from './modules/affiliate-registration-platform/affiliate-registration-platform.module';
import { InventoryTransactionModule } from './modules/inventory-transactions/inventory-transactions.module';
import { ScheduleModule } from '@nestjs/schedule';
import { GroupOrdersModule } from './modules/group_orders/group_orders.module';
import { AdminModule } from './modules/admin/admin.module';
import { VoucherCollectionModule } from './modules/voucher-collection/voucher-collection.module';
import { CampaignsModule } from './modules/campaigns/campaigns.module';
import { FlashSaleSchedulesModule } from './modules/flash_sale_schedules/flash_sale_schedules.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    // Đọc file .env
    ConfigModule.forRoot({
      isGlobal: true, // để tất cả module khác đều dùng được
      envFilePath: join(process.cwd(), 'backend', 'src', 'config', '.env'),
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'src', 'assets'),
      serveRoot: '/assets',
    }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),

    // Cấu hình DB dùng ConfigService
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get('DB_HOST'),
        port: +config.get('DB_PORT'),
        username: config.get('DB_USERNAME'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_NAME'),

        autoLoadEntities: true,
        synchronize: false,
        logging: true,
      }),
    }),

    ProductModule,
    UserModule,
    CategoryModule,
    StoreModule,
    BrandModule,
    RoleModule,
    PermissionModule,
    RolePermissionModule,
    UserRoleModule,
    StoreDocumentModule,
    CartModule,
    ProductCategoryModule,
    ProductMediaModule,
    VariantModule,
    InventoryModule,
    PricingRuleModule,
    VouchersModule,
    VoucherUsageModule,
    UserAddressModule,
    StoreIdentificationModule,
    OrdersModule,
    OrderItemsModule,
    OrderStatusHistoryModule,
    OrderInvoicesModule,
    PaymentsModule,
    RefundsModule,
    ReturnsModule,
    CancellationsModule,
    OrderShipmentsModule,
    ShippingLabelsModule,
    ShipmentsModule,
    AffiliateCommissionsModule,
    ProvincesModule,
    AuthModule,
    PaymentMethodsModule,
    PaymentTransactionsModule,
    ProductReviewsModule,
    FilesModule,
    WalletModule,
    WalletTransactionModule,
    StoreFollowersModule,
    SubscriptionModule,
    SubscriptionUsagesModule,
    AffiliateLinksModule,
    AffiliateRegistrationModule,
    AffiliatePlatformModule,
    AffiliateRegistrationPlatformModule,
    InventoryTransactionModule,
    GroupOrdersModule,
    AdminModule,
    VoucherCollectionModule,
  ],
  providers: [],
})
export class AppModule {}
