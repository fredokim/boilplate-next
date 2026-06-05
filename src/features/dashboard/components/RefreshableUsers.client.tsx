"use client";

import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/Card";

type UsersResponse = {
  success: boolean;
  data: {
    count: number;
  };
};

async function fetchUsersCount() {
  const response = await fetch("/api/users/count");
  const payload = (await response.json()) as UsersResponse;
  return payload.data.count;
}

export function RefreshableUsersClient({ initialCount }: { initialCount: number }) {
  const usersCount = useQuery({
    queryKey: ["users", "count"],
    queryFn: fetchUsersCount,
    initialData: initialCount,
  });

  return (
    <Card title="Client boundary sample" description="TanStack Query is used only for interactive client updates.">
      <p>Current user count: {usersCount.data}</p>
    </Card>
  );
}
