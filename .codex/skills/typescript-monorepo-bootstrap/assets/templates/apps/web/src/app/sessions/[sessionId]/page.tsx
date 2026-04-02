import { SessionDetailShell } from "@/features/sessions/session-detail-shell";

type SessionDetailPageProps = {
  params: Promise<{
    sessionId: string;
  }>;
};

export default async function SessionDetailPage({ params }: SessionDetailPageProps) {
  const { sessionId } = await params;

  return <SessionDetailShell sessionId={sessionId} />;
}
