import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { MailService } from '../mail/mail.service';
import { getModelToken } from '@nestjs/mongoose';
import { Restaurant } from '../restaurants/schemas/restaurant.schema';
import { RestaurantGroup } from '../restaurant-groups/schemas/restaurant-group.schema';
import {
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: Partial<Record<keyof UsersService, jest.Mock>>;
  let mailService: Partial<Record<keyof MailService, jest.Mock>>;
  let jwtService: Partial<Record<keyof JwtService, jest.Mock>>;

  const mockRestaurantModel = {
    findById: jest
      .fn()
      .mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }),
    find: jest.fn().mockReturnValue({
      sort: jest
        .fn()
        .mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }),
    }),
  };

  const mockGroupModel = {
    findById: jest
      .fn()
      .mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }),
    findOne: jest
      .fn()
      .mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }),
  };

  beforeEach(async () => {
    usersService = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      findByVerificationToken: jest.fn(),
      findByResetPasswordToken: jest.fn(),
      setVerificationData: jest.fn(),
      markEmailVerified: jest.fn(),
      setResetPasswordData: jest.fn(),
      updatePasswordAndClearReset: jest.fn(),
      findByGoogleId: jest.fn(),
      linkGoogleAccount: jest.fn(),
    };

    mailService = {
      sendVerificationEmail: jest.fn().mockResolvedValue({ delivered: true }),
      sendPasswordResetEmail: jest.fn().mockResolvedValue({ delivered: true }),
      sendInvite: jest.fn().mockResolvedValue({ delivered: true }),
    };

    jwtService = {
      signAsync: jest.fn().mockResolvedValue('mock-jwt-token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: MailService, useValue: mailService },
        { provide: JwtService, useValue: jwtService },
        {
          provide: getModelToken(Restaurant.name),
          useValue: mockRestaurantModel,
        },
        {
          provide: getModelToken(RestaurantGroup.name),
          useValue: mockGroupModel,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('should register a new user with unverified status and send verification email', async () => {
      usersService.findByEmail!.mockResolvedValue(null);
      usersService.create!.mockResolvedValue({
        _id: 'user123',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'customer',
      });

      const result = await service.register({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'customer',
      });

      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'John Doe',
          email: 'john@example.com',
          role: 'customer',
          isEmailVerified: false,
          emailVerificationCode: expect.any(String),
          emailVerificationToken: expect.any(String),
        }),
      );
      expect(mailService.sendVerificationEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'john@example.com',
          name: 'John Doe',
          code: expect.any(String),
          token: expect.any(String),
        }),
      );
      expect(result.requiresVerification).toBe(true);
    });

    it('should throw ConflictException if email is already taken', async () => {
      usersService.findByEmail!.mockResolvedValue({ _id: 'existing' });

      await expect(
        service.register({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
          role: 'customer',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should throw UnauthorizedException if email is not verified', async () => {
      const hash = await bcrypt.hash('password123', 10);
      usersService.findByEmail!.mockResolvedValue({
        _id: 'user123',
        email: 'john@example.com',
        passwordHash: hash,
        isEmailVerified: false,
      });

      await expect(
        service.login({ email: 'john@example.com', password: 'password123' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('verifyEmail', () => {
    it('should verify email with valid code and issue token', async () => {
      const user = {
        _id: 'user123',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'customer',
        emailVerificationCode: '123456',
        emailVerificationExpires: new Date(Date.now() + 60000),
      };
      usersService.findByEmail!.mockResolvedValue(user);
      usersService.markEmailVerified!.mockResolvedValue({
        ...user,
        isEmailVerified: true,
      });

      const result = await service.verifyEmail({
        email: 'john@example.com',
        code: '123456',
      });

      expect(usersService.markEmailVerified).toHaveBeenCalledWith('user123');
      expect(result.token).toBe('mock-jwt-token');
      expect(result.user.email).toBe('john@example.com');
    });

    it('should throw BadRequestException if code is expired', async () => {
      const user = {
        _id: 'user123',
        email: 'john@example.com',
        emailVerificationCode: '123456',
        emailVerificationExpires: new Date(Date.now() - 60000),
      };
      usersService.findByEmail!.mockResolvedValue(user);

      await expect(
        service.verifyEmail({ email: 'john@example.com', code: '123456' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('forgotPassword & resetPassword', () => {
    it('should send password reset email when forgotPassword is called', async () => {
      const user = {
        _id: 'user123',
        name: 'John Doe',
        email: 'john@example.com',
      };
      usersService.findByEmail!.mockResolvedValue(user);
      usersService.setResetPasswordData!.mockResolvedValue(user);

      const result = await service.forgotPassword({
        email: 'john@example.com',
      });

      expect(usersService.setResetPasswordData).toHaveBeenCalledWith(
        'user123',
        expect.objectContaining({
          resetPasswordCode: expect.any(String),
          resetPasswordToken: expect.any(String),
        }),
      );
      expect(mailService.sendPasswordResetEmail).toHaveBeenCalled();
      expect(result.message).toContain(
        'password reset instructions have been sent',
      );
    });

    it('should reset password with valid token and clear reset data', async () => {
      const user = {
        _id: 'user123',
        email: 'john@example.com',
        resetPasswordToken: 'valid-reset-token',
        resetPasswordExpires: new Date(Date.now() + 60000),
      };
      usersService.findByResetPasswordToken!.mockResolvedValue(user);
      usersService.updatePasswordAndClearReset!.mockResolvedValue({
        ...user,
        isEmailVerified: true,
      });

      const result = await service.resetPassword({
        token: 'valid-reset-token',
        newPassword: 'newPassword123',
      });

      expect(usersService.updatePasswordAndClearReset).toHaveBeenCalledWith(
        'user123',
        expect.any(String),
      );
      expect(result.message).toContain('successfully reset');
    });
  });

  describe('googleAuth', () => {
    let fetchSpy: jest.SpyInstance;

    beforeEach(() => {
      fetchSpy = jest.spyOn(global, 'fetch');
    });

    afterEach(() => {
      fetchSpy.mockRestore();
    });

    it('should create new user and issue token if user does not exist', async () => {
      const mockPayload = {
        email: 'googleuser@example.com',
        name: 'Google User',
        sub: 'google-sub-123',
        picture: 'https://avatar.url',
      };

      fetchSpy.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockPayload),
      } as any);

      const token = 'mock-google-id-token';

      usersService.findByEmail!.mockResolvedValue(null);
      usersService.create!.mockResolvedValue({
        _id: 'new-google-user-id',
        name: 'Google User',
        email: 'googleuser@example.com',
        role: 'customer',
        isEmailVerified: true,
      });

      const result = await service.googleAuth({
        credential: token,
        role: 'customer',
      });

      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'googleuser@example.com',
          name: 'Google User',
          googleId: 'google-sub-123',
          isEmailVerified: true,
        }),
      );
      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('user');
    });

    it('should link google account and login existing user', async () => {
      const mockPayload = {
        email: 'existing@example.com',
        name: 'Existing User',
        sub: 'google-sub-456',
      };

      fetchSpy.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockPayload),
      } as any);

      const token = 'mock-google-id-token';

      const existingUser = {
        _id: 'existing-user-id',
        name: 'Existing User',
        email: 'existing@example.com',
        role: 'customer',
        isEmailVerified: false,
        googleId: null,
      };

      usersService.findByEmail!.mockResolvedValue(existingUser);
      usersService.linkGoogleAccount!.mockResolvedValue({
        ...existingUser,
        isEmailVerified: true,
        googleId: 'google-sub-456',
      });
      usersService.findById!.mockResolvedValue({
        ...existingUser,
        isEmailVerified: true,
        googleId: 'google-sub-456',
      });

      const result = await service.googleAuth({
        credential: token,
      });

      expect(usersService.linkGoogleAccount).toHaveBeenCalledWith(
        'existing-user-id',
        'google-sub-456',
        undefined,
      );
      expect(result).toHaveProperty('token');
    });
  });
});
