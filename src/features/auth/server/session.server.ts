import "server-only";
import { cookies } from "next/headers";
import { dummySession } from "@/core/mock/dummyData";
import { parseDto } from "@/core/validation/parseDto";
import { SessionDto } from "../dto/Auth.dto";

const sessionCookieName = "next-boilerplate-session";

export async function getServerSession() {
  const cookieStore = await cookies();
  const hasSession = cookieStore.has(sessionCookieName);

  if (!hasSession) {
    return null;
  }

  return parseDto(SessionDto, dummySession);
}

export async function createDemoSession() {
  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName, "demo", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}

export async function clearDemoSession() {
  const cookieStore = await cookies();
  cookieStore.delete(sessionCookieName);
}
