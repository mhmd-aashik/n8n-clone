"use client";

import React from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { Spinner } from "@/components/ui/spinner";

const Client = () => {
  // get the trpc client
  const trpc = useTRPC();
  // useSuspenseQuery is a hook that fetches data from the server and suspends the component until the data is fetched
  const { data: users } = useSuspenseQuery(trpc.getUsers.queryOptions());
  return <div>{JSON.stringify(users)}</div>;
};

export default Client;
