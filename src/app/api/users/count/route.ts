import { NextResponse } from "next/server";
import { getUsers } from "@/features/user/server/users.server";

export async function GET() {
  const users = await getUsers();

  return NextResponse.json({
    success: true,
    data: {
      count: users.items.length,
    },
  });
}
