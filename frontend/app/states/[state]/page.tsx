import { notFound } from "next/navigation";
import StateExplorer from "@/components/StateExplorer";
import { stateFromSlug } from "@/lib/counties";

export default async function StatePage({ params }: { params: Promise<{ state: string }> }) {
  const { state: slug } = await params;
  const state = stateFromSlug(slug);
  if (!state) notFound();
  return <StateExplorer stateCode={state.code} />;
}
