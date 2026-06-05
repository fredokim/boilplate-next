import "server-only";
import { parseApiEnvelope } from "@/core/api/serverApiClient";
import { createApiSuccess, dummyUsers } from "@/core/mock/dummyData";
import { UserListDto } from "../dto/User.dto";

const userListPayload = {
  ...createApiSuccess({
    items: dummyUsers,
  }),
};

export async function getUsers() {
  return parseApiEnvelope(userListPayload, UserListDto);
}
