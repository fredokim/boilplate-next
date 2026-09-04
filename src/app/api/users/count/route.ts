import { NextResponse } from "next/server";
import { getUsers } from "@/features/user/server/users.server";

/**
 * Mock only. The shared backend does not publish this endpoint, so there is
 * nothing to forward to — it stays dummy data rather than becoming a call that
 * would 404. That is a gap in the backend, not an oversight here.
 */
export async function GET() {
  const users = await getUsers();

  return NextResponse.json({
    success: true,
    data: {
      count: users.items.length,
    },
  });
}
