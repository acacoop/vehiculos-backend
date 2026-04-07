import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { PushTokenService } from "@/services/pushTokenService";
import { IPushTokenRepository } from "@/repositories/interfaces/IPushTokenRepository";
import { Repository } from "typeorm";
import { User } from "@/entities/User";
import { PushToken } from "@/entities/PushToken";
import { AppError } from "@/middleware/errorHandler";

describe("PushTokenService", () => {
  let service: PushTokenService;
  let mockTokenRepo: jest.Mocked<IPushTokenRepository>;
  let mockUserRepo: jest.Mocked<Repository<User>>;

  beforeEach(() => {
    mockTokenRepo = {
      findByToken: jest.fn(),
      findByUser: jest.fn(),
      findByUsers: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      deleteByToken: jest.fn(),
      deleteByUser: jest.fn(),
    } as unknown as jest.Mocked<IPushTokenRepository>;

    mockUserRepo = {
      findOne: jest.fn(),
    } as unknown as jest.Mocked<Repository<User>>;

    service = new PushTokenService(mockTokenRepo, mockUserRepo);
  });

  const mockUser = {
    id: "u1",
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
  } as User;

  const mockToken = {
    id: "t1",
    token: "ExponentPushToken[abc123]",
    platform: "ios",
    user: mockUser,
  } as PushToken;

  describe("registerToken", () => {
    it("should create a new token for a valid user", async () => {
      const newToken = { ...mockToken, id: "t2" };
      mockUserRepo.findOne.mockResolvedValue(mockUser);
      mockTokenRepo.findByToken.mockResolvedValue(null);
      mockTokenRepo.create.mockReturnValue(newToken);
      mockTokenRepo.save.mockResolvedValue(newToken);

      const result = await service.registerToken(
        "u1",
        "ExponentPushToken[abc123]",
        "ios",
      );

      expect(result.token).toBe("ExponentPushToken[abc123]");
      expect(mockTokenRepo.create).toHaveBeenCalledWith({
        user: mockUser,
        token: "ExponentPushToken[abc123]",
        platform: "ios",
      });
    });

    it("should throw 404 AppError if user not found", async () => {
      mockUserRepo.findOne.mockResolvedValue(null);

      await expect(
        service.registerToken(
          "unknown-user",
          "ExponentPushToken[abc123]",
          "ios",
        ),
      ).rejects.toThrow(AppError);

      try {
        await service.registerToken(
          "unknown-user",
          "ExponentPushToken[abc123]",
          "ios",
        );
      } catch (error) {
        expect((error as AppError).statusCode).toBe(404);
      }
    });

    it("should update platform when token exists and belongs to same user", async () => {
      mockUserRepo.findOne.mockResolvedValue(mockUser);
      mockTokenRepo.findByToken.mockResolvedValue(mockToken);
      mockTokenRepo.save.mockResolvedValue({
        ...mockToken,
        platform: "android",
      });

      const result = await service.registerToken(
        "u1",
        "ExponentPushToken[abc123]",
        "android",
      );

      expect(result.platform).toBe("android");
      expect(mockTokenRepo.save).toHaveBeenCalled();
    });

    it("should throw 409 AppError if token belongs to different user", async () => {
      const otherUser = { ...mockUser, id: "u2" };
      const tokenOtherUser = { ...mockToken, user: otherUser };

      mockUserRepo.findOne.mockResolvedValue(mockUser);
      mockTokenRepo.findByToken.mockResolvedValue(tokenOtherUser);

      await expect(
        service.registerToken("u1", "ExponentPushToken[abc123]", "ios"),
      ).rejects.toThrow(AppError);

      try {
        await service.registerToken("u1", "ExponentPushToken[abc123]", "ios");
      } catch (error) {
        expect((error as AppError).statusCode).toBe(409);
        expect((error as AppError).message).toContain(
          "This token is registered to another user",
        );
      }
    });
  });

  describe("unregisterToken", () => {
    it("should delete token when it belongs to the requesting user", async () => {
      mockTokenRepo.findByToken.mockResolvedValue(mockToken);
      mockTokenRepo.deleteByToken.mockResolvedValue({
        affected: 1,
        raw: {},
      });

      const result = await service.unregisterToken(
        "ExponentPushToken[abc123]",
        "u1",
      );

      expect(result).toBe(true);
      expect(mockTokenRepo.deleteByToken).toHaveBeenCalledWith(
        "ExponentPushToken[abc123]",
      );
    });

    it("should return false if token does not exist", async () => {
      mockTokenRepo.findByToken.mockResolvedValue(null);

      const result = await service.unregisterToken("nonexistent-token", "u1");

      expect(result).toBe(false);
      expect(mockTokenRepo.deleteByToken).not.toHaveBeenCalled();
    });

    it("should throw 403 AppError if token belongs to different user", async () => {
      const otherUser = { ...mockUser, id: "u2" };
      const tokenOtherUser = { ...mockToken, user: otherUser };

      mockTokenRepo.findByToken.mockResolvedValue(tokenOtherUser);

      await expect(
        service.unregisterToken("ExponentPushToken[abc123]", "u1"),
      ).rejects.toThrow(AppError);

      try {
        await service.unregisterToken("ExponentPushToken[abc123]", "u1");
      } catch (error) {
        expect((error as AppError).statusCode).toBe(403);
        expect((error as AppError).message).toContain(
          "Cannot unregister a token that does not belong to you",
        );
      }
    });

    it("should return false if delete affects no rows", async () => {
      mockTokenRepo.findByToken.mockResolvedValue(mockToken);
      mockTokenRepo.deleteByToken.mockResolvedValue({
        affected: 0,
        raw: {},
      });

      const result = await service.unregisterToken(
        "ExponentPushToken[abc123]",
        "u1",
      );

      expect(result).toBe(false);
    });
  });

  describe("getTokensByUser", () => {
    it("should return tokens for user", async () => {
      const tokens = [mockToken];
      mockTokenRepo.findByUser.mockResolvedValue(tokens);

      const result = await service.getTokensByUser("u1");

      expect(result).toEqual(tokens);
      expect(mockTokenRepo.findByUser).toHaveBeenCalledWith("u1");
    });
  });

  describe("getTokensByUsers", () => {
    it("should return empty array if no user ids provided", async () => {
      const result = await service.getTokensByUsers([]);

      expect(result).toEqual([]);
      expect(mockTokenRepo.findByUsers).not.toHaveBeenCalled();
    });

    it("should return tokens for multiple users", async () => {
      const tokens = [mockToken];
      mockTokenRepo.findByUsers.mockResolvedValue(tokens);

      const result = await service.getTokensByUsers(["u1", "u2"]);

      expect(result).toEqual(tokens);
      expect(mockTokenRepo.findByUsers).toHaveBeenCalledWith(["u1", "u2"]);
    });
  });

  describe("deleteByUser", () => {
    it("should delete all tokens for a user", async () => {
      mockTokenRepo.deleteByUser.mockResolvedValue({
        affected: 2,
        raw: {},
      });

      const result = await service.deleteByUser("u1");

      expect(result).toBe(true);
      expect(mockTokenRepo.deleteByUser).toHaveBeenCalledWith("u1");
    });

    it("should return false if no tokens were deleted", async () => {
      mockTokenRepo.deleteByUser.mockResolvedValue({
        affected: 0,
        raw: {},
      });

      const result = await service.deleteByUser("u1");

      expect(result).toBe(false);
    });
  });
});
