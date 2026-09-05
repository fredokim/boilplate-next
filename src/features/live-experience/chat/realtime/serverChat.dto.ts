import { IsBoolean, IsInt, IsString } from "class-validator";

/**
 * The chat message as the server publishes it, validated.
 *
 * This app had no DTO for it at all. React and Vue at least check the same
 * object on the history endpoint; here chat arrives only over the socket, and
 * the socket cast whatever it received straight into the store. It was the one
 * domain object in this repository that nothing validated anywhere.
 *
 * Every field is required, matching `ChatMessageDto` in the server's OpenAPI
 * document. `dtoConformance.test.ts` holds that correspondence.
 *
 * Declared with definite assignment rather than initialisers, deliberately. An
 * initialiser makes `plainToInstance` fill a default before validation runs, so
 * an absent field validates as an empty one — which is how React's copy of this
 * DTO accepts a message the server says cannot exist. Vue declares its fields
 * this way and rejects it. There is no reason for a new DTO to start on the
 * weaker side of that.
 */
export class ChatMessageResponseDto {
  @IsString()
  id!: string;

  /** The sender's own id for the message, echoed back so it can be de-duplicated. */
  @IsString()
  clientMessageId!: string;

  @IsString()
  broadcastId!: string;

  /** The room's ordering. Distinct from `clientMessageId`, which orders nothing. */
  @IsInt()
  sequence!: number;

  @IsString()
  authorId!: string;

  @IsString()
  displayName!: string;

  /** Empty for a deleted message. The server retains the row for audit. */
  @IsString()
  body!: string;

  /** Server clock. The client's own timestamp is neither sent nor trusted. */
  @IsString()
  sentAt!: string;

  @IsBoolean()
  deleted!: boolean;
}
