import "reflect-metadata";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { TypedAppError } from "@/core/result/failure";

export async function parseDto<T extends object>(Dto: new () => T, payload: unknown): Promise<T> {
  const instance = plainToInstance(Dto, payload);
  const errors = await validate(instance, {
    forbidUnknownValues: true,
    whitelist: true,
  });

  if (errors.length > 0) {
    throw new TypedAppError({
      origin: "frontend-contract",
      kind: "validation",
      message: "Response did not match the frontend DTO contract.",
      details: errors,
    });
  }

  return instance;
}
