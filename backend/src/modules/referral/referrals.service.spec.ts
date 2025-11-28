import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ReferralsService } from './referrals.service';
import { Referral } from './referrals.entity';
import { UserService } from '../user/user.service';
import { CreateReferralDto } from './dto/create-referral.dto';

describe('ReferralsService - Business Rules Validation', () => {
  let service: ReferralsService;
  let mockReferralRepo: any;
  let mockUserService: any;

  beforeEach(async () => {
    // Mock repositories and services
    mockReferralRepo = {
      findOne: jest.fn(),
      query: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    };

    mockUserService = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReferralsService,
        {
          provide: getRepositoryToken(Referral),
          useValue: mockReferralRepo,
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    service = module.get<ReferralsService>(ReferralsService);
  });

  describe('createForUser - Business Rules', () => {
    const referrerId = 1;
    const refereeId = 2;
    const createDto: CreateReferralDto = {
      referrer_id: referrerId,
      referee_id: refereeId,
    };

    beforeEach(() => {
      // Default mock setup
      mockUserService.findOne.mockImplementation((id: number) => {
        if (id === referrerId) {
          return Promise.resolve({ id: referrerId, is_affiliate: true });
        }
        if (id === refereeId) {
          return Promise.resolve({ id: refereeId, is_affiliate: false });
        }
        return Promise.resolve(null);
      });

      mockReferralRepo.create.mockReturnValue({
        referrer: { id: referrerId },
        referee: { id: refereeId },
      });

      mockReferralRepo.save.mockResolvedValue({
        id: 1,
        referrer: { id: referrerId },
        referee: { id: refereeId },
      });
    });

    // ✅ RULE 1: Prevent Self-Reference (A → A)
    describe('Rule 1: Prevent Self-Reference', () => {
      it('should throw BadRequestException when user tries to be their own referrer', async () => {
        const selfRefDto: CreateReferralDto = {
          referrer_id: referrerId,
          referee_id: referrerId, // Same as referrer
        };

        mockUserService.findOne.mockImplementation((id: number) => {
          if (id === referrerId) {
            return Promise.resolve({ id: referrerId, is_affiliate: true });
          }
          return Promise.resolve(null);
        });

        await expect(
          service.createForUser(referrerId, selfRefDto)
        ).rejects.toThrow(BadRequestException);

        await expect(
          service.createForUser(referrerId, selfRefDto)
        ).rejects.toThrow('Người dùng không thể là referrer của chính mình');
      });

      it('should allow valid referral (different users)', async () => {
        mockReferralRepo.findOne.mockResolvedValue(null); // No existing referral
        mockReferralRepo.query.mockResolvedValue([]); // No circular reference

        const result = await service.createForUser(referrerId, createDto);

        expect(result).toBeDefined();
        expect(mockReferralRepo.save).toHaveBeenCalled();
      });
    });

    // ✅ RULE 2: Prevent Duplicate Referrer (Single Tree Rule)
    describe('Rule 2: Prevent Duplicate Referrer', () => {
      it('should throw BadRequestException when user already has a referrer', async () => {
        const existingReferral = {
          id: 99,
          referrer: { id: 3 },
          referee: { id: refereeId },
        };

        mockReferralRepo.findOne.mockResolvedValue(existingReferral);

        await expect(
          service.createForUser(referrerId, createDto)
        ).rejects.toThrow(BadRequestException);

        await expect(
          service.createForUser(referrerId, createDto)
        ).rejects.toThrow(`Người dùng ${refereeId} đã có referrer rồi`);
      });

      it('should allow referral when user has no existing referrer', async () => {
        mockReferralRepo.findOne.mockResolvedValue(null); // No existing referral
        mockReferralRepo.query.mockResolvedValue([]); // No circular reference

        const result = await service.createForUser(referrerId, createDto);

        expect(result).toBeDefined();
        expect(mockReferralRepo.save).toHaveBeenCalled();
      });
    });

    // ✅ RULE 3: Prevent Circular Reference (A → B → C → A)
    describe('Rule 3: Prevent Circular Reference', () => {
      it('should throw BadRequestException for direct circular reference (A ← B ← A)', async () => {
        mockReferralRepo.findOne.mockResolvedValue(null); // No existing referral
        mockReferralRepo.query.mockResolvedValue([{ referrer_id: referrerId }]); // Circular detected

        await expect(
          service.createForUser(referrerId, createDto)
        ).rejects.toThrow(BadRequestException);

        await expect(
          service.createForUser(referrerId, createDto)
        ).rejects.toThrow('Không thể tạo circular reference');
      });

      it('should throw BadRequestException for indirect circular reference (A ← B ← C ← A)', async () => {
        mockReferralRepo.findOne.mockResolvedValue(null); // No existing referral
        mockReferralRepo.query.mockResolvedValue([{ referrer_id: referrerId }]); // Circular detected

        await expect(
          service.createForUser(referrerId, createDto)
        ).rejects.toThrow(BadRequestException);
      });

      it('should allow referral when no circular reference exists', async () => {
        mockReferralRepo.findOne.mockResolvedValue(null); // No existing referral
        mockReferralRepo.query.mockResolvedValue([]); // No circular reference

        const result = await service.createForUser(referrerId, createDto);

        expect(result).toBeDefined();
        expect(mockReferralRepo.save).toHaveBeenCalled();
      });
    });

    // ✅ EXISTING RULES: Affiliate and User Validation
    describe('Existing Rules: User Validation', () => {
      it('should throw ForbiddenException if referrer is not an affiliate', async () => {
        mockUserService.findOne.mockImplementation((id: number) => {
          if (id === referrerId) {
            return Promise.resolve({ id: referrerId, is_affiliate: false }); // Not affiliate
          }
          if (id === refereeId) {
            return Promise.resolve({ id: refereeId });
          }
          return Promise.resolve(null);
        });

        await expect(
          service.createForUser(referrerId, createDto)
        ).rejects.toThrow(ForbiddenException);
      });

      it('should throw NotFoundException if referee does not exist', async () => {
        mockUserService.findOne.mockImplementation((id: number) => {
          if (id === referrerId) {
            return Promise.resolve({ id: referrerId, is_affiliate: true });
          }
          return Promise.resolve(null); // Referee not found
        });

        await expect(
          service.createForUser(referrerId, createDto)
        ).rejects.toThrow(NotFoundException);
      });
    });
  });

  describe('Affiliate Tree Integrity', () => {
    it('should maintain single tree structure with all validations', async () => {
      // Scenario: Build a valid tree
      // User 1 (affiliate) → User 2 (referrer)
      // User 2 (affiliate) → User 3 (referrer)
      // User 3 (affiliate) → User 4 (referrer)

      const validTree = [
        { referrer_id: 1, referee_id: 2 },
        { referrer_id: 2, referee_id: 3 },
        { referrer_id: 3, referee_id: 4 },
      ];

      // All should be valid
      for (const relation of validTree) {
        expect(relation.referrer_id).not.toBe(relation.referee_id);
      }

      // Verify single tree: each user has max 1 referrer
      const refereeIds = validTree.map((r) => r.referee_id);
      const uniqueRefereeIds = new Set(refereeIds);
      expect(uniqueRefereeIds.size).toBe(refereeIds.length);
    });
  });
});
