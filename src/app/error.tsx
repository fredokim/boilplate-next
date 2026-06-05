"use client";

import { ErrorState } from "@/components/states/ErrorState";
import { toFailure } from "@/core/result/failure";

export default function ErrorPage({ error }: { error: Error & { digest?: string } }) {
  return <ErrorState failure={toFailure(error)} title="Route failed" />;
}
