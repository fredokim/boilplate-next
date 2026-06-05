import { Type } from "class-transformer";
import { IsArray, IsEmail, IsString, ValidateNested } from "class-validator";

export class UserDto {
  @IsString()
  id = "";

  @IsEmail()
  email = "";

  @IsString()
  name = "";

  @IsString()
  role = "";
}

export class UserListDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UserDto)
  items: UserDto[] = [];
}
