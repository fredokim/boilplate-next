import "reflect-metadata";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { getMetadataStorage } from "class-validator";
import { ApiErrorDto } from "@/core/api/ApiEnvelope.dto";
import { AuthUserDto, LoginRequestDto, SessionDto } from "@/features/auth/dto/Auth.dto";
import {
  KpiDataDto,
  SeriesDataDto,
  SeriesPointDto,
  TableColumnDto,
  TableDataDto,
  TableRowDto,
} from "@/features/customizable-dashboard/data/dashboardDataSource.dto";
import { OpsConsoleDto, OpsIncidentDto, OpsMetricDto, OpsReleaseDto } from "@/features/ops/dto/OpsConsole.dto";
import { UserDto, UserListDto } from "@/features/user/dto/User.dto";
import { TopologySnapshotDto } from "@/features/visual-graph/realtime/topologySnapshot.dto";

/**
 * Every DTO this app validates a server response with, against the schema the
 * server publishes for it.
 *
 * The neighbouring `openapiContract.test.ts` asserts *meaning* — that the route
 * handlers cover the endpoints, that the envelope is shared. Those are worth
 * writing by hand. What they could not do is keep up with the DTOs themselves: a
 * field quietly becoming optional on the server reaches a reader as a runtime
 * validation failure, which is this app blaming itself for someone else's change.
 *
 * This reads what class-validator actually enforces rather than what a type
 * says, because that is what decides whether a response is accepted at runtime.
 */

const SPEC_PATH = resolve(__dirname, "../../../contracts/openapi.json");

type Schema = { properties?: Record<string, unknown>; required?: string[] };
type OpenApiDocument = { components: { schemas: Record<string, Schema> } };

function loadSpec(): OpenApiDocument | null {
  if (!existsSync(SPEC_PATH)) return null;

  return JSON.parse(readFileSync(SPEC_PATH, "utf8")) as OpenApiDocument;
}

const spec = loadSpec();
const describeIfSpec = spec ? describe : describe.skip;

type Constructor = new () => object;

/**
 * The declared correspondence. A DTO absent from here is a DTO nothing compares
 * to the server, so the coverage test below fails until it is either mapped or
 * declared as not coming from this API.
 */
const MAPPED: readonly (readonly [Constructor, string])[] = [
  [AuthUserDto, "AuthUserResponseDto"],
  [SessionDto, "SessionResponseDto"],
  [LoginRequestDto, "LoginRequestDto"],
  [KpiDataDto, "KpiDataDto"],
  [SeriesPointDto, "SeriesPointDto"],
  [SeriesDataDto, "SeriesDataDto"],
  [TableColumnDto, "TableColumnDto"],
  [TableRowDto, "TableRowDto"],
  [TableDataDto, "TableDataDto"],
  [UserDto, "UserResponseDto"],
  [UserListDto, "UserListResponseDto"],
  [TopologySnapshotDto, "TopologySnapshotDto"],
];

/**
 * Validated locally rather than received from this API.
 *
 * The ops console is a server-component showcase built on data this app holds
 * itself; it calls no `/api` route, so there is no server schema to agree with.
 * `ApiErrorDto` describes the `error` object *inside* the envelope, which the
 * server publishes inline on `ApiErrorEnvelope` rather than as a named schema.
 */
const NOT_A_RESPONSE_SCHEMA: readonly Constructor[] = [
  ApiErrorDto,
  OpsMetricDto,
  OpsIncidentDto,
  OpsReleaseDto,
  OpsConsoleDto,
];

/** Property names class-validator will enforce on this class. */
function validatedProperties(target: Constructor): Set<string> {
  const metadata = getMetadataStorage().getTargetValidationMetadatas(target, "", false, false);

  return new Set(metadata.map((entry) => entry.propertyName));
}

/**
 * Properties this class accepts as absent.
 *
 * `@IsOptional()` registers as `conditionalValidation`; anything without one is
 * enforced, and a response missing it is rejected before a component sees it.
 */
function optionalProperties(target: Constructor): Set<string> {
  const metadata = getMetadataStorage().getTargetValidationMetadatas(target, "", false, false);

  return new Set(
    metadata.filter((entry) => entry.type === "conditionalValidation").map((entry) => entry.propertyName),
  );
}

describeIfSpec("every mapped DTO matches the schema the server publishes", () => {
  const schemas = spec?.components.schemas ?? {};

  for (const [Dto, schemaName] of MAPPED) {
    describe(`${Dto.name} ↔ ${schemaName}`, () => {
      it("is a schema the server actually publishes", () => {
        expect(Object.keys(schemas)).toContain(schemaName);
      });

      it("validates no field the server does not send", () => {
        const published = new Set(Object.keys(schemas[schemaName]?.properties ?? {}));

        expect([...validatedProperties(Dto)].filter((name) => !published.has(name))).toEqual([]);
      });

      /**
       * The dangerous direction. A field the server may omit but the DTO
       * enforces turns a legitimate response into a validation failure, and the
       * reader is told the page cannot read the answer.
       */
      it("does not require a field the server treats as optional", () => {
        const required = new Set(schemas[schemaName]?.required ?? []);
        const optional = optionalProperties(Dto);

        expect(
          [...validatedProperties(Dto)].filter((name) => !optional.has(name) && !required.has(name)),
        ).toEqual([]);
      });

      /**
       * The quiet direction. A field the server guarantees but the DTO treats as
       * optional pushes an impossible `undefined` into every component that
       * reads it, and nothing fails until one of them does.
       */
      it("does not treat a guaranteed field as optional", () => {
        const validated = validatedProperties(Dto);
        const optional = optionalProperties(Dto);

        expect((schemas[schemaName]?.required ?? []).filter((n) => validated.has(n) && optional.has(n))).toEqual(
          [],
        );
      });
    });
  }
});

describeIfSpec("coverage", () => {
  /** The ratchet. Adding a DTO without deciding what it corresponds to is how gaps start. */
  it("maps or excuses every DTO class in the repository", () => {
    const declared = new Set<string>([
      ...MAPPED.map(([Dto]) => Dto.name),
      ...NOT_A_RESPONSE_SCHEMA.map((Dto) => Dto.name),
    ]);

    const exported = [
      ApiErrorDto,
      AuthUserDto,
      SessionDto,
      LoginRequestDto,
      KpiDataDto,
      SeriesPointDto,
      SeriesDataDto,
      TableColumnDto,
      TableRowDto,
      TableDataDto,
      OpsMetricDto,
      OpsIncidentDto,
      OpsReleaseDto,
      OpsConsoleDto,
      UserDto,
      UserListDto,
      TopologySnapshotDto,
    ].map((Dto) => Dto.name);

    expect(exported.filter((name) => !declared.has(name))).toEqual([]);
  });
});
