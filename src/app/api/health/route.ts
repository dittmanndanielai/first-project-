import { connection, NextResponse } from "next/server";

// Minimaler, öffentlicher Status ohne Konfigurationsdetails.
export async function GET() {
  await connection(); // bei jedem Aufruf neu, nicht prerendern
  return NextResponse.json({ ok: true, time: new Date().toISOString() });
}
