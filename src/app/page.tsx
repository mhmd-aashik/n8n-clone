import prisma from "@/lib/db";
import React from "react";

const HomePage = async () => {
  const users = await prisma.user.findMany();
  console.log(users);
  return (
    <div className="text-3xl text-center font-bold underline">
      {JSON.stringify(users)}
    </div>
  );
};

export default HomePage;
