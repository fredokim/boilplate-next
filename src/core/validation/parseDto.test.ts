import { describe, expect, it } from "vitest";
import { parseApiEnvelope } from "@/core/api/serverApiClient";
import { apiScenarios } from "@/test/apiScenarios";
import { parseDto } from "./parseDto";
import { UserDto, UserListDto } from "@/features/user/dto/User.dto";

describe("parseDto", () => {
  it("returns typed dto when payload matches", async () => {
    const result = await parseDto(UserDto, {
      id: "u-1",
      email: "demo@example.com",
      name: "Demo Maker",
      role: "admin",
    });

    expect(result.email).toBe("demo@example.com");
  });

  it("throws frontend contract failure when payload mismatches", async () => {
    await expect(
      parseDto(UserDto, {
        id: "u-1",
        email: "not-email",
        name: "Demo Maker",
        role: "admin",
      }),
    ).rejects.toMatchObject({
      failure: {
        origin: "frontend-contract",
        kind: "validation",
      },
    });
  });

  it("throws frontend contract failure when API envelope data breaks DTO contract", async () => {
    await expect(parseApiEnvelope(apiScenarios.usersInvalidDto, UserListDto)).rejects.toMatchObject({
      failure: {
        origin: "frontend-contract",
        kind: "validation",
      },
    });
  });

  it("throws backend failure when API envelope is unsuccessful", async () => {
    await expect(parseApiEnvelope(apiScenarios.usersBackendError, UserListDto)).rejects.toMatchObject({
      failure: {
        origin: "backend",
        kind: "unknown",
        message: "Users are unavailable.",
      },
    });
  });
});
