"use server";

import { redirect } from "next/navigation";
import { startSession } from "@/lib/auth";
import { env, loginSecret } from "@/lib/env";
import { log } from "@/lib/log";
import { verifyLogin } from "@/lib/password";

export type LoginState = { error?: string };

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const password = String(formData.get("password") ?? "");
  const ok = password.length > 0 && password.length <= 256 && (await verifyLogin(password, loginSecret(env())));
  if (!ok) {
    // Bremst Durchprobieren; zusammen mit einem langen Zufallspasswort ausreichend für einen Nutzer.
    await new Promise((r) => setTimeout(r, 600));
    log("login.failed");
    return { error: "Wrong password." };
  }
  await startSession();
  log("login.ok");
  redirect("/");
}
