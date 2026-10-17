import { notFound } from "next/navigation";
import CountyReport from "@/components/CountyReport";
import { stateFromSlug } from "@/lib/counties";

export default async function CountyPage({ params }: { params: Promise<{ state: string; fips: string }> }) {
  const { state, fips } = await params;
  if (!stateFromSlug(state) || !/^\d{5}$/.test(fips)) notFound();
  return <CountyReport stateSlug={state} fips={fips} />;
}
