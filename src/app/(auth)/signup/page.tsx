import { RegisterForm } from "@/features/auth/components/register-form";
import { requireUnauth } from "@/lib/auth-utils";
import React from "react";

const Signup = async () => {
  await requireUnauth();
  return <RegisterForm />;
};

export default Signup;
