import { Button } from "@/components/ui/button";
import { requireAuth } from "@/lib/auth-utils";
import { caller } from "@/trpc/server";
import React from "react";
import Logout from "./Logout";

const HomePage = async () => {
  await requireAuth();

  const data = await caller.getUsers();
  return (
    <div className="min-h-screen min-w-screen flex items-center justify-center">
      Protected Server Components
      <div>{JSON.stringify(data, null, 2)}</div>
      <Logout />
    </div>
  );
};

export default HomePage;
