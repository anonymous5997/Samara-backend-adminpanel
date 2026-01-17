import { cookies } from "next/headers";

export async function getCurrentRegion(): Promise<'IN' | 'US' | 'CA' | 'AE' | 'GB' | 'EU'> {
  const store = await cookies();
  return (store.get("region")?.value as any) || "IN";
}
