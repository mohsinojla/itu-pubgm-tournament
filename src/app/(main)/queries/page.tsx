import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db/mongoose";
import Query from "@/lib/db/models/Query";
import PageHero from "@/components/common/PageHero";
import QueryPanel from "@/components/queries/QueryPanel";

export const dynamic = "force-dynamic";

export default async function QueriesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  await connectDB();
  const queries = await Query.find({ userId: session.user.id })
    .sort({ createdAt: -1 })
    .lean();

  return (
    <>
      <PageHero
        title="Queries & Support"
        subtitle="Any questions, concerns, or feedback? Reach out to us here."
      />
      <div className="max-w-2xl mx-auto px-4 py-10">
        <QueryPanel initialQueries={JSON.parse(JSON.stringify(queries))} />
      </div>
    </>
  );
}
