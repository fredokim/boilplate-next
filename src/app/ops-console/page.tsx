import { getOpsConsole } from "@/features/ops/server/opsConsole.server";
import { OpsConsoleView } from "@/features/ops/views/OpsConsoleView";

export default async function OpsConsolePage() {
  const data = await getOpsConsole();
  const serializableData = JSON.parse(JSON.stringify(data));

  return <OpsConsoleView data={serializableData} />;
}
