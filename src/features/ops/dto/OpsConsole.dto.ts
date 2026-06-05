import { Type } from "class-transformer";
import { IsArray, IsIn, IsNumber, IsString, ValidateNested } from "class-validator";

export class OpsMetricDto {
  @IsString()
  id = "";

  @IsString()
  label = "";

  @IsNumber()
  value = 0;

  @IsString()
  unit = "";

  @IsIn(["good", "watch", "risk"])
  status: "good" | "watch" | "risk" = "good";
}

export class OpsIncidentDto {
  @IsString()
  id = "";

  @IsString()
  service = "";

  @IsString()
  severity = "";

  @IsString()
  message = "";

  @IsString()
  region = "";

  @IsString()
  createdAt = "";
}

export class OpsReleaseDto {
  @IsString()
  id = "";

  @IsString()
  version = "";

  @IsString()
  environment = "";

  @IsString()
  status = "";

  @IsNumber()
  durationMs = 0;
}

export class OpsConsoleDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OpsMetricDto)
  metrics: OpsMetricDto[] = [];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OpsIncidentDto)
  incidents: OpsIncidentDto[] = [];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OpsReleaseDto)
  releases: OpsReleaseDto[] = [];
}
