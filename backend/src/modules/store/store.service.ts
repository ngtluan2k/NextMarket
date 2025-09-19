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
import { StoreRating } from '../store-rating/store-rating.entity';
import { StoreFollower } from '../store-follower/store-follower.entity';
import { StoreUpgradeRequest } from '../store-upgrade-request/store-upgrade-request.entity';
import { v4 as uuidv4 } from 'uuid';


@Injectable()
export class StoreService {
  constructor(
    @InjectRepository(Store) private storeRepo: Repository<Store>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Role) private roleRepo: Repository<Role>,
    @InjectRepository(UserRole) private userRoleRepo: Repository<UserRole>,
    @InjectRepository(StoreLevel) private storeLevelRepo: Repository<StoreLevel>,
    @InjectRepository(StoreBankAccount) private bankAccountRepo: Repository<StoreBankAccount>,
    @InjectRepository(StoreAddress) private storeAddressRepo: Repository<StoreAddress>,
    @InjectRepository(StoreIdentification) private storeIdentificationRepo: Repository<StoreIdentification>,
    @InjectRepository(StoreInformation) private storeInformationRepo: Repository<StoreInformation>,
    @InjectRepository(StoreInformationEmail) private storeEmailRepo: Repository<StoreInformationEmail>,
    @InjectRepository(StoreDocument) private storeDocumentRepo: Repository<StoreDocument>,
    @InjectRepository(StoreRating) private storeRatingRepo: Repository<StoreRating>,
    @InjectRepository(StoreFollower) private storeFollowerRepo: Repository<StoreFollower>,
    @InjectRepository(StoreUpgradeRequest) private storeUpgradeRequestRepo: Repository<StoreUpgradeRequest>,
  ) { }

  async findAll() {
    return this.storeRepo.find({
      order: { created_at: 'DESC' }
    });
  }

  async findOne(id: number) {
    const store = await this.storeRepo.findOne({
      where: { id }
    });
    if (!store) throw new NotFoundException('Store not found');
    return store;
  }

  async findByUserId(userId: number) {
    return this.storeRepo.findOne({
      where: { user_id: userId }
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

  async findStoresByUserId(userId: number): Promise<Store[]> {
    if (!userId || isNaN(userId)) {
      throw new BadRequestException('User ID không hợp lệ');
    }
    const stores = await this.storeRepo.find({
      where: { user_id: userId },
      relations: ['owner'],
    });
    if (!stores.length)
      throw new NotFoundException('Không tìm thấy cửa hàng nào cho user này');
    return stores;
  }

  async create(userId: number, dto: CreateStoreDto) {
    const store = this.storeRepo.create({
      ...dto,
      user_id: userId,
    });
    return this.storeRepo.save(store);
  }

  // Đăng ký làm seller
  async registerSeller(userId: number, dto: RegisterSellerDto) {
    // 1. Kiểm tra user có tồn tại không
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['roles', 'roles.role'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // 2. Kiểm tra user đã có store chưa
    const existingStore = await this.storeRepo.findOne({
      where: { user_id: userId },
    });

    // Nếu đã có store và không phải draft, không cho tạo mới
    if (existingStore && !existingStore.is_draft && !dto.is_draft) {
      throw new BadRequestException('User already has a complete store');

    }
    
    // Nếu đây là update của store draft existing
    if (existingStore && existingStore.is_draft) {
      return await this.updateDraftStore(existingStore.id, dto, userId);
    }

    // Validate required fields khi không phải draft
    if (!dto.is_draft) {
      if (!dto.name) {
        throw new BadRequestException('Tên cửa hàng là bắt buộc khi hoàn tất đăng ký');
      }
    }

    // 3. Tạo slug tự động nếu không được cung cấp và có name
    let slug = dto.slug;
    if (!slug && dto.name) {

      slug = dto.name.toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

      // Kiểm tra slug có trùng không
      const existingSlug = await this.storeRepo.findOne({ where: { slug } });
      if (existingSlug) {
        slug = `${slug}-${Date.now()}`;
      }
    }

    // 4. Tạo store với status theo is_draft
    const store = this.storeRepo.create({
      ...dto,
      slug: slug || `draft-${Date.now()}`, // Tạo slug tạm thời cho draft
      user_id: userId,
      status: dto.is_draft ? 'inactive' : 'active', // Draft = inactive, Final = active
      is_draft: dto.is_draft ?? false, // Sử dụng ?? để handle undefined/false
    });

    const savedStore = await this.storeRepo.save(store);

    // 5. Tạo store level mặc định là 'basic'
    const storeLevel = this.storeLevelRepo.create({
      store_id: savedStore.id,
      level: 'basic',
    });
    await this.storeLevelRepo.save(storeLevel);

    // 6. Gán role "seller" cho user (nếu chưa có)
    const sellerRole = await this.roleRepo.findOne({
      where: { name: 'Store_Owner' },
    });

    if (sellerRole) {
      const hasSellerRole = user.roles?.some(ur => ur.role.name === 'Store_Owner'); 
      console.log("has seller role : " + hasSellerRole)

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

    // 13. Xử lý thông tin comprehensive (nếu có)
    if (dto.store_information || dto.store_identification || dto.bank_account || dto.store_address) {
      await this.handleComprehensiveData(savedStore.id, dto);
    }

    return {
      store: savedStore,
      message: dto.is_draft 
        ? 'Đã lưu nháp thành công! Bạn có thể hoàn tất đăng ký sau.'
        : (dto.store_information 
          ? 'Đăng ký làm người bán hàng thành công! Store đã được kích hoạt với đầy đủ thông tin.'
          : 'Đăng ký làm người bán hàng thành công! Store đã được kích hoạt.')
    };
  }

  // Update draft store với data từ các steps

  async updateDraftStore(storeId: number, dto: RegisterSellerDto, userId: number) {
    const store = await this.storeRepo.findOne({ where: { id: storeId } });
    if (!store) {
      throw new NotFoundException('Store not found');
    }

    // Debug log
    console.log('🔍 UpdateDraftStore - dto.is_draft:', dto.is_draft, 'type:', typeof dto.is_draft);
    console.log('🔍 UpdateDraftStore - dto.email:', dto.email);
    console.log('🔍 UpdateDraftStore - dto:', JSON.stringify(dto, null, 2));

    // Luôn update status và is_draft trước
    const updateData: any = {
      status: dto.is_draft ? 'inactive' : 'active',
      is_draft: dto.is_draft ?? false, // Sử dụng ?? để handle undefined/false
    };

    // Update thông tin cơ bản nếu có (Step 1)
    if (dto.name || dto.description || dto.phone || dto.email) {
      updateData.name = dto.name || store.name;
      updateData.description = dto.description || store.description;
      updateData.phone = dto.phone || store.phone;
      updateData.email = dto.email || store.email; // Thêm email
    }

    // Update store với all data
    console.log('🔍 UpdateData being sent to DB:', updateData);
    await this.storeRepo.update(storeId, updateData);

    // Update comprehensive data nếu có (Step 2, 3)
    if (dto.store_information || dto.store_identification || dto.bank_account || dto.store_address) {
      await this.handleComprehensiveData(storeId, dto);
    }

    const updatedStore = await this.storeRepo.findOne({ where: { id: storeId } });

    return {
      store: updatedStore,
      message: dto.is_draft 
        ? 'Đã cập nhật nháp thành công! Bạn có thể tiếp tục chỉnh sửa sau.'
        : 'Đăng ký làm người bán hàng thành công! Store đã được kích hoạt.'
    };
  }

  // Kiểm tra user có phải seller không
  async isUserSeller(userId: number): Promise<boolean> {
    const store = await this.storeRepo.findOne({
      where: { user_id: userId },
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

  async deleteMyStore(userId: number) {
    const store = await this.findByUserId(userId);
    if (!store) {
      throw new NotFoundException('Bạn chưa có cửa hàng để xóa');
    }
    
    const result = await this.remove(store.id);
    return {
      ...result,
      message: 'Đã xóa cửa hàng của bạn và toàn bộ dữ liệu liên quan thành công'
    };
  }

  async remove(id: number) {
    const store = await this.findOne(id);

    
    // Trước tiên, tìm tất cả store_information để xóa emails và documents
    const storeInformations = await this.storeInformationRepo.find({ where: { store_id: id } });
    // Xóa emails và documents theo store_information_id
    for (const storeInfo of storeInformations) {
      await Promise.all([
        this.storeEmailRepo.delete({ store_information_id: storeInfo.id }),
        this.storeDocumentRepo.delete({ store_information_id: storeInfo.id }),
      ]);
    }
    // Xóa tất cả dữ liệu liên quan còn lại
    const deletedResults = await Promise.all([
      this.storeInformationRepo.delete({ store_id: id }),
      this.storeIdentificationRepo.delete({ store_id: id }),
      this.bankAccountRepo.delete({ store_id: id }),
      this.storeAddressRepo.delete({ stores_id: id }), // Chú ý: stores_id
      this.storeLevelRepo.delete({ store_id: id }),
      this.storeRatingRepo.delete({ store_id: id }),
      this.storeFollowerRepo.delete({ store_id: id }),
      this.storeUpgradeRequestRepo.delete({ store_id: id }),
    ]);
    
    // Cuối cùng xóa store
    await this.storeRepo.remove(store);
    
    const totalDeletedRecords = deletedResults.reduce((sum, result) => sum + (result.affected || 0), 0);
    
    return {
      message: 'Xóa cửa hàng và toàn bộ dữ liệu liên quan thành công',
      deletedStoreId: id,
      deletedRecords: totalDeletedRecords + 1 // +1 for the store itself
    };
  }


  // Helper method để xử lý comprehensive data
  private async handleComprehensiveData(storeId: number, dto: RegisterSellerDto) {
    // 1. Tạo hoặc update store information
    let storeInformation = null;
    if (dto.store_information) {
      // Kiểm tra xem đã có store_information chưa
      const existingStoreInfo = await this.storeInformationRepo.findOne({
        where: { store_id: storeId }
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
          is_draft: dto.is_draft ?? false,
        });
        storeInformation = await this.storeInformationRepo.save(
          storeInformation
        );
      }
    }

    // 2. Tạo hoặc update store information email
    if (dto.store_information_email && storeInformation) {
      const existingEmail = await this.storeEmailRepo.findOne({
        where: { store_information_id: storeInformation.id }
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
      const existingIdentification = await this.storeIdentificationRepo.findOne({
        where: { store_id: storeId }
      });

      if (existingIdentification) {
        // Update existing
        await this.storeIdentificationRepo.update(existingIdentification.id, {
          type: dto.store_identification.type,
          full_name: dto.store_identification.full_name,
          img_front: dto.store_identification.img_front,
          img_back: dto.store_identification.img_back,
          is_draft: dto.is_draft ?? false,
        });
      } else {
        // Create new
        const storeIdentification = this.storeIdentificationRepo.create({
          store_id: storeId,
          type: dto.store_identification.type,
          full_name: dto.store_identification.full_name,
          img_front: dto.store_identification.img_front,
          img_back: dto.store_identification.img_back,
          is_draft: dto.is_draft ?? false,
        });
        await this.storeIdentificationRepo.save(storeIdentification);
      }
    }

    // 4. Tạo hoặc update bank account
    if (dto.bank_account) {
      const existingBankAccount = await this.bankAccountRepo.findOne({
        where: { store_id: storeId }
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
        where: { stores_id: storeId }
      });

      if (existingAddress) {
        // Update existing
        await this.storeAddressRepo.update(existingAddress.id, {
          recipient_name: dto.store_address.recipient_name,
          phone: dto.store_address.phone,
          street: dto.store_address.street,
          city: dto.store_address.city,
          province: dto.store_address.province,
          country: dto.store_address.country,
          postal_code: dto.store_address.postal_code,
          type: dto.store_address.type,
          detail: dto.store_address.detail,
          is_default: dto.store_address.is_default ?? true,
          is_draft: dto.is_draft ?? false,
        });
      } else {
        // Create new
        const storeAddress = this.storeAddressRepo.create({
          stores_id: storeId, // Chú ý: entity này dùng stores_id không phải store_id
          recipient_name: dto.store_address.recipient_name,
          phone: dto.store_address.phone,
          street: dto.store_address.street,
          city: dto.store_address.city,
          province: dto.store_address.province,
          country: dto.store_address.country,
          postal_code: dto.store_address.postal_code,
          type: dto.store_address.type,
          detail: dto.store_address.detail,
          is_default: dto.store_address.is_default ?? true,
          is_draft: dto.is_draft ?? false,
        });
        await this.storeAddressRepo.save(storeAddress);
      }
    }

    // 6. Tạo documents (nếu có) - link với store_information_id
    if (dto.documents && dto.documents.length > 0 && storeInformation) {
      for (const docDto of dto.documents) {
        const document = this.storeDocumentRepo.create({
          store_information_id: storeInformation.id,
          doc_type: docDto.doc_type,
          file_url: docDto.file_url,
          verified: false,
        });
        await this.storeDocumentRepo.save(document);
      }
    }
  }

  // Lấy đầy đủ draft data cho frontend
  async getFullDraftData(storeId: number, userId: number) {
    // Verify ownership
    const store = await this.storeRepo.findOne({
      where: { id: storeId, user_id: userId }
    });
    
    if (!store) {
      throw new NotFoundException('Store not found or access denied');
    }

    // Fetch tất cả related data
    const [storeInformation, storeIdentification, bankAccount, storeAddress] = await Promise.all([
      // Store Information
      this.storeInformationRepo.findOne({
        where: { store_id: storeId }
      }),

      // Store Identification  
      this.storeIdentificationRepo.findOne({
        where: { store_id: storeId }
      }),

      // Bank Account
      this.bankAccountRepo.findOne({
        where: { store_id: storeId }
      }),

      // Store Address
      this.storeAddressRepo.findOne({
        where: { stores_id: storeId } // Chú ý: entity này dùng stores_id
      }),
    ]);

    // Fetch data phụ thuộc vào store_information
    let storeEmail: StoreInformationEmail | null = null;
    let documents: StoreDocument[] = [];
    
    if (storeInformation) {
      [storeEmail, documents] = await Promise.all([
        this.storeEmailRepo.findOne({
          where: { store_information_id: storeInformation.id }
        }),
        this.storeDocumentRepo.find({
          where: { store_information_id: storeInformation.id }
        })
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
      storeInformation: storeInformation ? {
        id: storeInformation.id,
        type: storeInformation.type,
        name: storeInformation.name,
        addresses: storeInformation.addresses,
        tax_code: storeInformation.tax_code,
      } : null,
      storeIdentification: storeIdentification ? {
        id: storeIdentification.id,
        type: storeIdentification.type,
        full_name: storeIdentification.full_name,
        img_front: storeIdentification.img_front,
        img_back: storeIdentification.img_back,
      } : null,
      bankAccount: bankAccount ? {
        id: bankAccount.id,
        bank_name: bankAccount.bank_name,
        account_number: bankAccount.account_number,
        account_holder: bankAccount.account_holder,
        is_default: bankAccount.is_default,
      } : null,
      storeAddress: storeAddress ? {
        id: storeAddress.id,
        recipient_name: storeAddress.recipient_name,
        phone: storeAddress.phone,
        street: storeAddress.street,
        city: storeAddress.city,
        province: storeAddress.province,
        country: storeAddress.country,
        postal_code: storeAddress.postal_code,
        type: storeAddress.type,
        detail: storeAddress.detail,
        is_default: storeAddress.is_default,
      } : null,
      storeEmail: storeEmail ? {
        id: storeEmail.id,
        email: storeEmail.email,
      } : null,
      documents: documents || [],
    };
  }
  
}
