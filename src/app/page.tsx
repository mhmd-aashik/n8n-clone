import { getQueryClient, trpc } from "@/trpc/server";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import React, { Suspense } from "react";
import Client from "./Client";
import { Spinner } from "@/components/ui/spinner";

const HomePage = async () => {
  // get the query client
  const queryClient = getQueryClient();
  // prefetch the query
  void queryClient.prefetchQuery(trpc.getUsers.queryOptions());
  return (
    <div className="min-h-screen min-w-screen flex items-center justify-center">
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<Spinner />}>
          <Client />
        </Suspense>
      </HydrationBoundary>
    </div>
  );
};

export default HomePage;
