import { notFound, redirect } from "next/navigation";
import { buildResult, getGame } from "@/lib/games";
import ResultClient from "./result-client";

export const dynamic = "force-dynamic";

export default async function ResultPage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const { gameId } = await params;

  const game = await getGame(gameId);
  if (!game) notFound();
  if (game.status !== "done") redirect(`/play/${gameId}`);

  const result = await buildResult(game);
  return <ResultClient result={result} />;
}
