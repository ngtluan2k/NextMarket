import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Store } from './store.entity';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { RegisterSellerDto } from './dto/register-seller.dto';
import { User } from '../user/user.entity';
import { Role } from '../role/role.entity';
import { UserRole } from '../user-role/user-role.entity';
import { StoreLevel } from './../store-level/store-level.entity';
import { StoreBankAccount } from '../store-bank-account/store-bank-account.entity';
import { StoreAddress } from '../store-address/store-address.entity';
import { StoreIdentification } from '../store-identification/store-identification.entity';
import { StoreInformation } from '../store-information/store-information.entity';
import { StoreInformationEmail } from '../store-information-email/store-information-email.entity';
import { StoreDocument } from '../store-document/store-document.entity';
import { StoreFollower } from '../store-follower/store-follower.entity';
import { StoreUpgradeRequest } from '../store-upgrade-request/store-upgrade-request.entity';
import { v4 as uuidv4 } from 'uuid';
import { Product } from '../product/product.entity';
import { Category } from '../categories/category.entity';
import { ProductCategory } from '../product_category/product_category.entity';
import { Variant } from '../variant/variant.entity';
import { ProductTag } from '../product_tag/product_tag.entity';
import { Inventory } from '../inventory/inventory.entity';
import { ProductMedia } from '../product_media/product_media.entity';
import { PricingRules } from '../pricing-rule/pricing-rule.entity';
import * as fs from 'fs';
import * as path from 'path';
import { DataSource } from 'typeorm';
import { StoreLevelEnum } from '../store-level/store-level.enum';

@Injectable()
export class StoreService {
  constructor(
    @InjectRepository(Store) private storeRepo: Repository<Store>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Role) private roleRepo: Repository<Role>,
    @InjectRepository(UserRole) private userRoleRepo: Repository<UserRole>,
    @InjectRepository(StoreLevel)
    private storeLevelRepo: Repository<StoreLevel>,
    private readonly dataSource: DataSource,
    @InjectRepository(StoreBankAccount)
    private bankAccountRepo: Repository<StoreBankAccount>,
    @InjectRepository(StoreAddress)
    private storeAddressRepo: Repository<StoreAddress>,
    @InjectRepository(StoreIdentification)
    private storeIdentificationRepo: Repository<StoreIdentification>,
    @InjectRepository(StoreInformation)
    private storeInformationRepo: Repository<StoreInformation>,
    @InjectRepository(StoreInformationEmail)
    private storeEmailRepo: Repository<StoreInformationEmail>,
    @InjectRepository(StoreDocument)
    private storeDocumentRepo: Repository<StoreDocument>,
    @InjectRepository(StoreFollower)
    private storeFollowerRepo: Repository<StoreFollower>,
    @InjectRepository(StoreUpgradeRequest)
    private storeUpgradeRequestRepo: Repository<StoreUpgradeRequest>,
    @InjectRepository(Product) private productRepo: Repository<Product>,
    @InjectRepository(Inventory) private inventoryRepo: Repository<Inventory>,
    @InjectRepository(Variant) private variantRepo: Repository<Variant>,
    @InjectRepository(ProductMedia)
    private productMediaRepo: Repository<ProductMedia>,
    @InjectRepository(PricingRules)
    private pricingRulesRepo: Repository<PricingRules>,
    @InjectRepository(ProductCategory)
    private productCategoryRepo: Repository<ProductCategory>,
    @InjectRepository(ProductTag) private productTagRepo: Repository<ProductTag>
  ) {}

  async findAll(includeDeleted = false) {
    const where: any = {};
    if (!includeDeleted) where.is_deleted = false;
    return this.storeRepo.find({
      where,
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: number) {
    const store = await this.storeRepo.findOne({
      where: { id, is_deleted: false },
    });
    if (!store) throw new NotFoundException('Store not found');
    return store;
  }

  async findByUserId(userId: number, includeDeleted = false) {
    return this.storeRepo.findOne({
      where: includeDeleted
        ? { user_id: userId }
        : { user_id: userId, is_deleted: false },
         relations: ['storeLevels'],
    });
  }

  // async findByUserId(userId: number) {
  //   const store = await this.storeRepo.findOne({
  //     where: { user_id: userId },
  //     // relations: ['owner'],
  //   });
  //   if (!store)
  //     throw new NotFoundException('Store not found or not owned by user');
  //   return store;
  // }

  // async findStoresByUserId(userId: number): Promise<Store[]> {
  //   if (!userId || isNaN(userId)) {
  //     throw new BadRequestException('User ID không hợp lệ');
  //   }
  //   const stores = await this.storeRepo.find({
  //     where: { user_id: userId },
  //     relations: ['owner'],
  //   });
  //   if (!stores.length)
  //     throw new NotFoundException('Không tìm thấy cửa hàng nào cho user này');
  //   return stores;
  // }

  async create(userId: number, dto: CreateStoreDto) {
    const store = this.storeRepo.create({
      ...dto,
      user_id: userId,
    });
    return this.storeRepo.save(store);
  }

  // Đăng ký làm seller
  async registerSeller(userId: number, dto: RegisterSellerDto) {
    // 0) Nếu FE gửi store_id → luôn UPDATE đúng record đó
    if (dto.store_id) {
      const target = await this.storeRepo.findOne({
        where: { id: Number(dto.store_id), user_id: userId },
      });
      if (!target) {
        throw new BadRequestException(
          'Store không tồn tại hoặc không thuộc user'
        );
      }
      if (target.is_deleted) {
        throw new BadRequestException(
          'Store này đã bị xóa . Vui lòng liên hệ admin để khôi phục hoặc đợi 30 ngày.'
        );
      }
      return await this.updateDraftStore(target.id, dto, userId);
    }

    // 1) Không có store_id: kiểm tra store hiện có theo user
    const existing = await this.storeRepo.findOne({
      where: { user_id: userId, is_deleted: false },
    });

    // 1.a) Đã có store (draft/final) → luôn UPDATE record đó (đảm bảo 1 user chỉ có 1 store)
    if (existing) {
      return await this.updateDraftStore(existing.id, dto, userId);
    }

    // 1.b) Đã có store bị xóa mềm → chặn tạo lại trong 30 ngày
    const existingDeleted = await this.storeRepo.findOne({
      where: { user_id: userId, is_deleted: true },
    });
    if (existingDeleted) {
      if (existingDeleted.deleted_at) {
        const msSinceDelete =
          Date.now() - new Date(existingDeleted.deleted_at).getTime();
        const daysSinceDelete = Math.floor(
          msSinceDelete / (1000 * 60 * 60 * 24)
        );
        const waitDays = 30 - daysSinceDelete;
        if (waitDays > 0) {
          throw new BadRequestException(
            `Bạn đã xóa cửa hàng trước đó. Vui lòng đợi thêm ${waitDays} ngày để tạo lại.`
          );
        }
        // quá 30 ngày → cho phép tạo mới (không đụng record cũ)
      } else {
        // không có mốc thời gian xóa → an toàn: chặn tạo mới
        throw new BadRequestException(
          'Bạn đã xóa cửa hàng trước đó. Vui lòng liên hệ admin hoặc chờ đủ thời gian để tạo lại.'
        );
      }
    }

    // 2) Chưa có store nào → tạo mới (đây là trường hợp duy nhất INSERT)
    // Validate bắt buộc khi final
    if (!dto.is_draft && !dto.name) {
      throw new BadRequestException(
        'Tên cửa hàng là bắt buộc khi hoàn tất đăng ký'
      );
    }

    // Tạo slug nếu chưa có
    let slug = dto.slug;
    if (!slug && dto.name) {
      slug = dto.name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      const dup = await this.storeRepo.findOne({ where: { slug } });
      if (dup) slug = `${slug}-${Date.now()}`;
    }

    const store = this.storeRepo.create({
      ...dto,
      slug: slug || `draft-${Date.now()}`,
      user_id: userId,
      status: dto.is_draft ? 'inactive' : 'active',
      is_draft: dto.is_draft ?? false,
      is_deleted: false, // đảm bảo store mới không ở trạng thái xóa mềm
      deleted_at: null, // yêu cầu đã có cột deleted_at
    });

    try {
      const savedStore = await this.storeRepo.save(store);

      // Tạo/Update dữ liệu liên quan nếu có
      if (
        dto.store_information ||
        dto.store_identification ||
        dto.bank_account ||
        dto.store_address ||
        dto.store_information_email ||
        dto.documents
      ) {
        await this.handleComprehensiveData(savedStore.id, dto);
      }

      // Gán role nếu submit final
      if (!dto.is_draft) {
        await this.assignSellerRole(userId);
        await this.storeLevelRepo.upsert(
          {
            store_id: savedStore.id,
            level: StoreLevelEnum.BASIC,
            upgraded_at: new Date(),
          },
          ['store_id'] // unique theo store_id
        );
      }

      return {
        store: savedStore,
        message: dto.is_draft
          ? 'Đã lưu nháp thành công!'
          : 'Đăng ký thành công!',
      };
    } catch (e: any) {
      // Chặn race condition với UNIQUE user_id: fallback sang UPDATE
      if (e?.code === 'ER_DUP_ENTRY' || e?.code === '23505') {
        const ex = await this.storeRepo.findOne({ where: { user_id: userId } });
        if (ex) {
          return await this.updateDraftStore(ex.id, dto, userId);
        }
      }
      throw e;
    }
  }

  // ✅ Thêm method assignSellerRole
  private async assignSellerRole(userId: number) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['roles', 'roles.role'],
    });

    if (!user) return;

    // 6. Gán role "seller" cho user (nếu chưa có)
    const sellerRole = await this.roleRepo.findOne({
      where: { name: 'Seller' },
    });

    if (sellerRole) {
      const hasSellerRole = user.roles?.some((ur) => ur.role.name === 'Seller');
      console.log('has seller role : ' + hasSellerRole);

      if (!hasSellerRole) {
        const userRole = this.userRoleRepo.create({
          uuid: uuidv4(),
          user: user,
          role: sellerRole,
          assigned_at: new Date(),
        });
        await this.userRoleRepo.save(userRole);
      }
    }
  }

  // Update draft store với data từ các steps

  async updateDraftStore(
    storeId: number,
    dto: RegisterSellerDto,
    userId: number
  ) {
    const store = await this.storeRepo.findOne({ where: { id: storeId } });
    if (!store) {
      throw new NotFoundException('Store not found');
    }

    // Luôn update status và is_draft trước
    const updateData: any = {
      status: dto.is_draft ? 'inactive' : 'active',
      is_draft: dto.is_draft ?? false,
    };

    // Update thông tin cơ bản nếu có (Step 1)
    if (dto.name || dto.description || dto.phone || dto.email) {
      updateData.name = dto.name || store.name;
      updateData.description = dto.description || store.description;
      updateData.phone = dto.phone || store.phone;
      updateData.email = dto.email || store.email;
    }

    // Update store với all data
    await this.storeRepo.update(storeId, updateData);

    // Update comprehensive data nếu có (Step 2, 3)
    if (
      dto.store_information ||
      dto.store_identification ||
      dto.bank_account ||
      dto.store_address
    ) {
      await this.handleComprehensiveData(storeId, dto);
    }

    // Gán role seller nếu submit final
    if (!dto.is_draft) {
      await this.assignSellerRole(userId);
      await this.storeLevelRepo.upsert(
        {
          store_id: storeId,
          level: StoreLevelEnum.BASIC,
          upgraded_at: new Date(),
        },
        ['store_id']
      );
    }

    const updatedStore = await this.storeRepo.findOne({
      where: { id: storeId },
    });

    return {
      store: updatedStore,
      message: dto.is_draft
        ? 'Đã cập nhật nháp thành công! Bạn có thể tiếp tục chỉnh sửa sau.'
        : 'Đăng ký làm người bán hàng thành công! Store đã được kích hoạt.',
    };
  }

  // Kiểm tra user có phải seller không
  async isUserSeller(userId: number): Promise<boolean> {
    const store = await this.storeRepo.findOne({
      where: { user_id: userId, is_deleted: false },
    });
    return !!store;
  }

  // Lấy thống kê store
  async getStoreStats(storeId: number) {
    // Sẽ implement sau khi có các modules khác
    return {
      followers: 0,
      ratings: 0,
      average_rating: 0,
      total_products: 0,
    };
  }

  async update(id: number, dto: UpdateStoreDto) {
    const store = await this.findOne(id);
    Object.assign(store, dto);
    return this.storeRepo.save(store);
  }

  private async fineOneIncludedDeleted(id: number) {
    const store = await this.storeRepo.findOne({ where: { id } });
    if (!store) throw new NotFoundException('Store not found');
    return store;
  }

  async deleteMyStore(userId: number) {
    const store = await this.findByUserId(userId);
    if (!store) {
      throw new NotFoundException('Bạn chưa có cửa hàng để xóa');
    }

    store.is_deleted = true;
    store.status = 'closed';
    store.deleted_at = new Date(); // <-- set mốc xóa mềm
    await this.storeRepo.save(store);

    return {
      message: 'Đã xóa mềm cửa hàng thành công',
      deletedStoreId: store.id,
      deletedRecords: 0,
    };
  }

  private async orderItemsHardDeleteByProductIds(ids: number[]) {
    await this.storeRepo.manager
      .createQueryBuilder()
      .delete()
      .from('order_items')
      .where('product_id IN (:...ids)', { ids })
      .execute();
  }

  async remove(id: number) {
    const store = await this.fineOneIncludedDeleted(id);

    // Lấy tất cả product_id thuộc store
    const products = await this.productRepo.find({
      where: { store: { id } },
      select: ['id'],
    });
    const productIds = products.map((p) => p.id);

    // Xóa dữ liệu con theo product_id (tránh lỗi FK)
    if (productIds.length > 0) {
      // order_items
      await this.orderItemsHardDeleteByProductIds(productIds);
      // inventory
      await this.inventoryRepo
        .createQueryBuilder()
        .delete()
        .from('inventory')
        .where('product_id IN (:...ids)', { ids: productIds })
        .execute();
      // product_media
      await this.productMediaRepo
        .createQueryBuilder()
        .delete()
        .from('product_media')
        .where('product_id IN (:...ids)', { ids: productIds })
        .execute();
      // pricing_rules
      await this.pricingRulesRepo
        .createQueryBuilder()
        .delete()
        .from('pricing_rules')
        .where('product_id IN (:...ids)', { ids: productIds })
        .execute();
      // product_category
      await this.productCategoryRepo
        .createQueryBuilder()
        .delete()
        .from('product_category')
        .where('product_id IN (:...ids)', { ids: productIds })
        .execute();
      // product_tag
      await this.productTagRepo
        .createQueryBuilder()
        .delete()
        .from('product_tag')
        .where('product_id IN (:...ids)', { ids: productIds })
        .execute();
      // variants (đặt sau inventory/order_items)
      await this.variantRepo
        .createQueryBuilder()
        .delete()
        .from('variants')
        .where('product_id IN (:...ids)', { ids: productIds })
        .execute();
    }
    // Xóa tất cả products của store
    await this.productRepo
      .createQueryBuilder()
      .delete()
      .from('products')
      .where('store_id = :id', { id })
      .execute();

    // Xóa bảng phụ thuộc store_information (emails, documents) trước
    const storeInformations = await this.storeInformationRepo.find({
      where: { store_id: id },
    });
    for (const storeInfo of storeInformations) {
      await Promise.all([
        this.storeEmailRepo.delete({ store_information_id: storeInfo.id }),
        this.storeDocumentRepo.delete({ store_information_id: storeInfo.id }),
      ]);
    }

    // Xóa các dữ liệu liên quan khác theo store_id
    const deletedResults = await Promise.all([
      this.storeInformationRepo.delete({ store_id: id }),
      this.storeIdentificationRepo.delete({ store_id: id }),
      this.bankAccountRepo.delete({ store_id: id }),
      this.storeAddressRepo.delete({ stores_id: id }),
      this.storeLevelRepo.delete({ store_id: id }),
      this.storeFollowerRepo.delete({ store_id: id }),
      this.storeUpgradeRequestRepo.delete({ store_id: id }),
    ]);

    // Xóa store
    await this.storeRepo.remove(store);

    const totalDeletedRecords = deletedResults.reduce(
      (sum, r) => sum + (r.affected || 0),
      0
    );
    return {
      message: 'Xóa cửa hàng và toàn bộ dữ liệu liên quan thành công',
      deletedStoreId: id,
      deletedRecords: totalDeletedRecords + 1,
    };
  }
  async restore(id: number) {
    // Chỉ khôi phục các store đang bị soft-delete
    const store = await this.storeRepo.findOne({
      where: { id, is_deleted: true },
    });
    if (!store) {
      throw new NotFoundException('Store không tồn tại hoặc không bị xóa mềm');
    }

    store.is_deleted = false;
    store.deleted_at = null;
    // Tùy chính sách: đưa về 'inactive' để admin/seller kích hoạt lại
    if (store.status === 'closed') {
      store.status = 'active';
    }

    await this.storeRepo.save(store);

    return {
      message: 'Khôi phục cửa hàng thành công',
      restoredStoreId: id,
    };
  }

  // Helper method để xử lý comprehensive data
  private async handleComprehensiveData(
    storeId: number,
    dto: RegisterSellerDto
  ) {
    // 1. Tạo hoặc update store information
    let storeInformation = null;
    if (dto.store_information) {
      // Kiểm tra xem đã có store_information chưa
      const existingStoreInfo = await this.storeInformationRepo.findOne({
        where: { store_id: storeId },
      });

      if (existingStoreInfo) {
        // Update existing
        await this.storeInformationRepo.update(existingStoreInfo.id, {
          type: dto.store_information.type,
          name: dto.store_information.name,
          addresses: dto.store_information.addresses,
          tax_code: dto.store_information.tax_code,
        });
        storeInformation = await this.storeInformationRepo.findOne({
          where: { id: existingStoreInfo.id },
        });
      } else {
        // Create new
        storeInformation = this.storeInformationRepo.create({
          store_id: storeId,
          type: dto.store_information.type,
          name: dto.store_information.name,
          addresses: dto.store_information.addresses,
          tax_code: dto.store_information.tax_code,
        });
        storeInformation = await this.storeInformationRepo.save(
          storeInformation
        );
      }
    }

    // 2. Tạo hoặc update store information email
    if (dto.store_information_email && storeInformation) {
      const existingEmail = await this.storeEmailRepo.findOne({
        where: { store_information_id: storeInformation.id },
      });

      if (existingEmail) {
        // Update existing
        await this.storeEmailRepo.update(existingEmail.id, {
          email: dto.store_information_email.email,
        });
      } else {
        // Create new
        const storeEmailInfo = this.storeEmailRepo.create({
          email: dto.store_information_email.email,
          store_information_id: storeInformation.id,
        });
        await this.storeEmailRepo.save(storeEmailInfo);
      }
    }

    // 3. Tạo hoặc update store identification
    if (dto.store_identification) {
      const existingIdentification = await this.storeIdentificationRepo.findOne(
        {
          where: { store_id: storeId },
        }
      );

      if (existingIdentification) {
        // Update existing
        await this.storeIdentificationRepo.update(existingIdentification.id, {
          type: dto.store_identification.type,
          full_name: dto.store_identification.full_name,
          img_front: dto.store_identification.img_front,
          img_back: dto.store_identification.img_back,
        });
      } else {
        // Create new
        const storeIdentification = this.storeIdentificationRepo.create({
          store_id: storeId,
          type: dto.store_identification.type,
          full_name: dto.store_identification.full_name,
          img_front: dto.store_identification.img_front,
          img_back: dto.store_identification.img_back,
        });
        await this.storeIdentificationRepo.save(storeIdentification);
      }
    }

    // 3.5. Tạo hoặc update store documents (nếu truyền qua DTO)
    if (
      dto.documents &&
      Array.isArray(dto.documents) &&
      dto.documents.length > 0 &&
      storeInformation
    ) {
      for (const doc of dto.documents) {
        // Chiến lược: nếu đã có document cùng doc_type cho store_information_id thì update file_url, ngược lại tạo mới
        const existingDoc = await this.storeDocumentRepo.findOne({
          where: {
            store_information_id: storeInformation.id,
            doc_type: doc.doc_type,
          },
        });

        if (existingDoc) {
          await this.storeDocumentRepo.update(existingDoc.id, {
            file_url: doc.file_url,

            verified: false,
            verified_at: null,
          });
        } else {
          const newDoc = this.storeDocumentRepo.create({
            store_information_id: storeInformation.id,
            doc_type: doc.doc_type,
            file_url: doc.file_url,

            verified: false,
            verified_at: null,
          });
          await this.storeDocumentRepo.save(newDoc);
        }
      }
    }

    // 4. Tạo hoặc update bank account
    if (dto.bank_account) {
      const existingBankAccount = await this.bankAccountRepo.findOne({
        where: { store_id: storeId },
      });

      if (existingBankAccount) {
        // Update existing
        await this.bankAccountRepo.update(existingBankAccount.id, {
          bank_name: dto.bank_account.bank_name,
          account_number: dto.bank_account.account_number,
          account_holder: dto.bank_account.account_holder,
          is_default: dto.bank_account.is_default ?? true,
        });
      } else {
        // Create new
        const bankAccount = this.bankAccountRepo.create({
          store_id: storeId,
          bank_name: dto.bank_account.bank_name,
          account_number: dto.bank_account.account_number,
          account_holder: dto.bank_account.account_holder,
          is_default: dto.bank_account.is_default ?? true,
        });
        await this.bankAccountRepo.save(bankAccount);
      }
    }

    // 5. Tạo hoặc update store address
    if (dto.store_address) {
      const existingAddress = await this.storeAddressRepo.findOne({
        where: { stores_id: storeId },
      });

      if (existingAddress) {
        // Update existing
        await this.storeAddressRepo.update(existingAddress.id, {
          recipient_name: dto.store_address.recipient_name,
          phone: dto.store_address.phone,
          street: dto.store_address.street,
          district: dto.store_address.district,
          ward: (dto.store_address as any).ward,
          province: dto.store_address.province,
          country: dto.store_address.country,
          postal_code: dto.store_address.postal_code,
          type: dto.store_address.type,
          detail: dto.store_address.detail,
          is_default: dto.store_address.is_default ?? true,
        });
      } else {
        // Create new
        const storeAddress = this.storeAddressRepo.create({
          stores_id: storeId, // Chú ý: entity này dùng stores_id không phải store_id
          recipient_name: dto.store_address.recipient_name,
          phone: dto.store_address.phone,
          street: dto.store_address.street,
          district: dto.store_address.district,
          ward: (dto.store_address as any).ward,
          province: dto.store_address.province,
          country: dto.store_address.country,
          postal_code: dto.store_address.postal_code,
          type: dto.store_address.type,
          detail: dto.store_address.detail,
          is_default: dto.store_address.is_default ?? true,
        });
        await this.storeAddressRepo.save(storeAddress);
      }
    }

    // 6. Documents đã được xử lý ở bước 3.5 (upsert kèm is_draft). Không xử lý lại tại đây để tránh tạo bản ghi thiếu is_draft.
  }

  // Lấy đầy đủ draft data cho frontend
  async getFullDraftData(storeId: number, userId: number) {
    // Verify ownership
    const store = await this.storeRepo.findOne({
      where: { id: storeId, user_id: userId, is_deleted: false },
    });

    if (!store) {
      throw new NotFoundException('Store not found or access denied');
    }

    // Fetch tất cả related data
    const [storeInformation, storeIdentification, bankAccount, storeAddress] =
      await Promise.all([
        // Store Information
        this.storeInformationRepo.findOne({
          where: { store_id: storeId },
        }),

        // Store Identification
        this.storeIdentificationRepo.findOne({
          where: { store_id: storeId },
        }),

        // Bank Account
        this.bankAccountRepo.findOne({
          where: { store_id: storeId },
        }),

        // Store Address
        this.storeAddressRepo.findOne({
          where: { stores_id: storeId }, // Chú ý: entity này dùng stores_id
        }),
      ]);

    // Fetch data phụ thuộc vào store_information
    let storeEmail: StoreInformationEmail | null = null;
    let documents: StoreDocument[] = [];

    if (storeInformation) {
      [storeEmail, documents] = await Promise.all([
        this.storeEmailRepo.findOne({
          where: { store_information_id: storeInformation.id },
        }),
        this.storeDocumentRepo.find({
          where: { store_information_id: storeInformation.id },
        }),
      ]);
    }

    // Return structured data
    return {
      store: {
        id: store.id,
        name: store.name,
        description: store.description,
        email: store.email,
        phone: store.phone,
        status: store.status,
        is_draft: store.is_draft,
      },
      storeInformation: storeInformation
        ? {
            id: storeInformation.id,
            type: storeInformation.type,
            name: storeInformation.name,
            addresses: storeInformation.addresses,
            tax_code: storeInformation.tax_code,
          }
        : null,
      storeIdentification: storeIdentification
        ? {
            id: storeIdentification.id,
            type: storeIdentification.type,
            full_name: storeIdentification.full_name,
            img_front: storeIdentification.img_front,
            img_back: storeIdentification.img_back,
          }
        : null,
      bankAccount: bankAccount
        ? {
            id: bankAccount.id,
            bank_name: bankAccount.bank_name,
            account_number: bankAccount.account_number,
            account_holder: bankAccount.account_holder,
            is_default: bankAccount.is_default,
          }
        : null,
      storeAddress: storeAddress
        ? {
            id: storeAddress.id,
            recipient_name: storeAddress.recipient_name,
            phone: storeAddress.phone,
            street: storeAddress.street,
            district: storeAddress.district,
            province: storeAddress.province,
            country: storeAddress.country,
            postal_code: storeAddress.postal_code,
            type: storeAddress.type,
            detail: storeAddress.detail,
            is_default: storeAddress.is_default,
          }
        : null,
      storeEmail: storeEmail
        ? {
            id: storeEmail.id,
            email: storeEmail.email,
          }
        : null,
      documents: documents || [],
    };
  }
  //lấy full thông tin cửa hàng

  async getFullData(storeId: number) {
    const store = await this.storeRepo.findOne({
      where: { id: storeId, is_deleted: false },
      relations: {
        storeInformation: { emails: true, documents: true },
        storeIdentification: true,
        storeLevels: true,
        bankAccount: true,
        address: true,
        followers: true,
      },
    });
    if (!store) throw new NotFoundException('Store not found');

    const info = store.storeInformation?.[0] ?? null;
    const identification = store.storeIdentification?.[0] ?? null;
    const level = store.storeLevels?.[0] ?? null;
    const bank = store.bankAccount?.[0] ?? null;
    const address = store.address?.[0] ?? null;
    const followers = store.followers?.length ?? 0;

    return {
      store,
      storeInformation: info,
      storeIdentification: identification,
      storeLevel: level,
      bankAccount: bank,
      storeAddress: address,
      storeEmail: info?.emails?.[0] ?? null,
      documents: info?.documents?.[0] ?? null,
      followers,
    };
  }

  async findBySlug(slug: string): Promise<Store | null> {
    if (!slug) {
      throw new BadRequestException('Slug không hợp lệ');
    }

    const store = await this.storeRepo.findOne({
      where: { slug, is_deleted: false },
      relations: [
        'products',
        'products.media',
        'followers',
      ],
    });

    if (!store) return null;
    return store;
  }

  async findProductsBySlug(
    slug: string,
    categorySlug?: string
  ): Promise<Store | null> {
    if (!slug) throw new BadRequestException('Slug không hợp lệ');

    const store = await this.storeRepo.findOne({
      where: { slug, is_deleted: false },
      relations: [
        'products',
        'products.media',
        'products.categories',
        'products.categories.category',
      ],
    });

    if (!store) return null;

    if (categorySlug) {
      store.products = store.products.filter((p) =>
        p.categories.some((pc) => pc.category.slug === categorySlug)
      );
    }

    return store;
  }

  async findCategoriesByStoreWithCount(
    storeId: number
  ): Promise<{ id: number; name: string; slug: string; count: number }[]> {
    const products = await this.productRepo.find({
      where: { store: { id: storeId } },
      relations: ['categories', 'categories.category'],
    });

    const countMap = new Map<number, { category: Category; count: number }>();

    for (const product of products) {
      for (const pc of product.categories) {
        if (pc.category) {
          const entry = countMap.get(pc.category.id);
          if (entry) {
            entry.count += 1;
          } else {
            countMap.set(pc.category.id, { category: pc.category, count: 1 });
          }
        }
      }
    }

    return Array.from(countMap.values()).map(({ category, count }) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      count,
    }));
  }

  // Upload logo
  async uploadLogo(
    storeId: number,
    file: Express.Multer.File,
    userId: number
  ): Promise<{ logo_url: string }> {
    const store = await this.storeRepo.findOne({ where: { id: storeId } });
    if (!store) throw new NotFoundException('Store not found');
    if (store.user_id !== userId) {
      throw new BadRequestException('You do not own this store');
    }

    // Validate image only
    const allowed = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowed.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Only JPG/PNG allowed');
    }
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      throw new BadRequestException('File size must be <= 5MB');
    }

    // Ensure upload dir
    const uploadDir = path.join(process.cwd(), 'uploads', 'logo');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Generate filename
    const ext = path.extname(file.originalname) || '.jpg';
    const filename = `store_${storeId}_${uuidv4()}${ext}`;
    const fullPath = path.join(uploadDir, filename);

    // Save
    fs.writeFileSync(fullPath, file.buffer);

    // Relative URL to serve via /uploads
    const logoUrl = `/uploads/logo/${filename}`;

    // Persist on store
    store.logo_url = logoUrl;
    await this.storeRepo.save(store);

    return { logo_url: logoUrl };
  }
}
