import {
  describe,
  it,
  expect,
  jest,
  beforeEach,
  afterEach,
} from "@jest/globals";
import {
  NotificationService,
  NotificationPayload,
} from "@/services/notificationService";
import { PushTokenService } from "@/services/pushTokenService";
import { PushToken } from "@/entities/PushToken";
import { Expo, ExpoPushTicket } from "expo-server-sdk";

describe("NotificationService", () => {
  let service: NotificationService;
  let mockPushTokenService: jest.Mocked<
    Pick<
      PushTokenService,
      "getTokensByUser" | "getTokensByUsers" | "deleteTokenByValue"
    >
  >;
  let spyChunk: jest.SpiedFunction<
    typeof Expo.prototype.chunkPushNotifications
  >;
  let spySend: jest.SpiedFunction<
    typeof Expo.prototype.sendPushNotificationsAsync
  >;
  let spyIsExpoToken: jest.SpiedFunction<typeof Expo.isExpoPushToken>;

  const payload: NotificationPayload = {
    title: "Test notification",
    body: "This is a test",
    data: { type: "reservation_created", reservationId: "r1" },
  };

  const makeToken = (token: string): PushToken => ({ token }) as PushToken;

  const validToken = "ExponentPushToken[validToken123]";
  const anotherValidToken = "ExponentPushToken[anotherToken456]";
  const invalidToken = "not-a-real-expo-token";

  beforeEach(() => {
    jest.clearAllMocks();

    mockPushTokenService = {
      getTokensByUser: jest.fn<PushTokenService["getTokensByUser"]>(),
      getTokensByUsers: jest.fn<PushTokenService["getTokensByUsers"]>(),
      deleteTokenByValue: jest
        .fn<PushTokenService["deleteTokenByValue"]>()
        .mockResolvedValue(true),
    };

    spyIsExpoToken = jest
      .spyOn(Expo, "isExpoPushToken")
      .mockImplementation(
        (token): token is string =>
          typeof token === "string" && token.startsWith("ExponentPushToken["),
      );

    spyChunk = jest.spyOn(Expo.prototype, "chunkPushNotifications");
    spySend = jest.spyOn(Expo.prototype, "sendPushNotificationsAsync");

    service = new NotificationService(
      mockPushTokenService as unknown as PushTokenService,
    );
  });

  afterEach(() => {
    spyIsExpoToken.mockRestore();
    spyChunk.mockRestore();
    spySend.mockRestore();
  });

  describe("sendToUser", () => {
    it("sends to all valid tokens for the user", async () => {
      mockPushTokenService.getTokensByUser.mockResolvedValue([
        makeToken(validToken),
      ]);
      spyChunk.mockReturnValue([
        [
          {
            to: validToken,
            sound: "default",
            title: payload.title,
            body: payload.body,
            data: payload.data,
          },
        ],
      ]);
      spySend.mockResolvedValue([
        { status: "ok", id: "ticket-1" } as ExpoPushTicket,
      ]);

      await service.sendToUser("u1", payload);

      expect(mockPushTokenService.getTokensByUser).toHaveBeenCalledWith("u1");
      expect(spyChunk).toHaveBeenCalled();
      expect(spySend).toHaveBeenCalled();
    });

    it("does nothing when user has no tokens", async () => {
      mockPushTokenService.getTokensByUser.mockResolvedValue([]);

      await service.sendToUser("u1", payload);

      expect(spySend).not.toHaveBeenCalled();
    });
  });

  describe("sendToUsers", () => {
    it("sends to all valid tokens for multiple users", async () => {
      mockPushTokenService.getTokensByUsers.mockResolvedValue([
        makeToken(validToken),
        makeToken(anotherValidToken),
      ]);
      spyChunk.mockReturnValue([
        [{ to: validToken }, { to: anotherValidToken }],
      ]);
      spySend.mockResolvedValue([
        { status: "ok", id: "ticket-1" } as ExpoPushTicket,
        { status: "ok", id: "ticket-2" } as ExpoPushTicket,
      ]);

      await service.sendToUsers(["u1", "u2"], payload);

      expect(mockPushTokenService.getTokensByUsers).toHaveBeenCalledWith([
        "u1",
        "u2",
      ]);
      expect(spySend).toHaveBeenCalled();
    });

    it("does nothing when no users have tokens", async () => {
      mockPushTokenService.getTokensByUsers.mockResolvedValue([]);

      await service.sendToUsers(["u1", "u2"], payload);

      expect(spySend).not.toHaveBeenCalled();
    });
  });

  describe("sendMessages - token filtering", () => {
    it("skips invalid (non-Expo) tokens and only sends valid ones", async () => {
      mockPushTokenService.getTokensByUser.mockResolvedValue([
        makeToken(invalidToken),
        makeToken(validToken),
      ]);
      spyChunk.mockReturnValue([[{ to: validToken }]]);
      spySend.mockResolvedValue([
        { status: "ok", id: "ticket-1" } as ExpoPushTicket,
      ]);

      await service.sendToUser("u1", payload);

      const messages = spyChunk.mock.calls[0][0] as Array<{ to: string }>;
      expect(messages).toHaveLength(1);
      expect(messages[0].to).toBe(validToken);
    });

    it("does not call sendPushNotificationsAsync when all tokens are invalid", async () => {
      mockPushTokenService.getTokensByUser.mockResolvedValue([
        makeToken(invalidToken),
      ]);

      await service.sendToUser("u1", payload);

      expect(spyChunk).not.toHaveBeenCalled();
      expect(spySend).not.toHaveBeenCalled();
    });
  });

  describe("sendMessages - chunking", () => {
    it("calls sendPushNotificationsAsync once per chunk", async () => {
      const chunk1 = [{ to: validToken }];
      const chunk2 = [{ to: anotherValidToken }];
      mockPushTokenService.getTokensByUser.mockResolvedValue([
        makeToken(validToken),
        makeToken(anotherValidToken),
      ]);
      spyChunk.mockReturnValue([chunk1, chunk2]);
      spySend
        .mockResolvedValueOnce([{ status: "ok", id: "t1" } as ExpoPushTicket])
        .mockResolvedValueOnce([{ status: "ok", id: "t2" } as ExpoPushTicket]);

      await service.sendToUser("u1", payload);

      expect(spySend).toHaveBeenCalledTimes(2);
    });
  });

  describe("sendMessages - DeviceNotRegistered cleanup", () => {
    it("calls deleteTokenByValue when Expo returns DeviceNotRegistered", async () => {
      mockPushTokenService.getTokensByUser.mockResolvedValue([
        makeToken(validToken),
      ]);
      spyChunk.mockReturnValue([[{ to: validToken }]]);
      spySend.mockResolvedValue([
        {
          status: "error",
          message: "The device is unregistered",
          details: { error: "DeviceNotRegistered" },
        } as unknown as ExpoPushTicket,
      ]);

      await service.sendToUser("u1", payload);

      expect(mockPushTokenService.deleteTokenByValue).toHaveBeenCalledWith(
        validToken,
      );
    });

    it("does NOT call deleteTokenByValue for other Expo errors", async () => {
      mockPushTokenService.getTokensByUser.mockResolvedValue([
        makeToken(validToken),
      ]);
      spyChunk.mockReturnValue([[{ to: validToken }]]);
      spySend.mockResolvedValue([
        {
          status: "error",
          message: "MessageTooBig",
          details: { error: "MessageTooBig" },
        } as unknown as ExpoPushTicket,
      ]);

      await service.sendToUser("u1", payload);

      expect(mockPushTokenService.deleteTokenByValue).not.toHaveBeenCalled();
    });

    it("does not throw when sendPushNotificationsAsync rejects a chunk", async () => {
      mockPushTokenService.getTokensByUser.mockResolvedValue([
        makeToken(validToken),
      ]);
      spyChunk.mockReturnValue([[{ to: validToken }]]);
      spySend.mockRejectedValue(new Error("Network error"));

      await expect(service.sendToUser("u1", payload)).resolves.not.toThrow();
    });
  });
});
