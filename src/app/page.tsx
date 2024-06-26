import * as React from "react";
import type { SearchParams } from "~/types";
import { getTasks } from "./_lib/queries";
import { searchParamsSchema } from "./_lib/validations";
import { db } from "~/server/db";
import { Button } from "~/components/ui/button";
import Link from "next/link";
export const dynamic = "force-dynamic";

export interface IndexPageProps {
  searchParams: SearchParams;
}
export default async function HomePage({ searchParams }: IndexPageProps) {
  const search = searchParamsSchema.parse(searchParams);
  const tasksPromise = getTasks(search);
  const users = await db.query.users.findMany();
  console.log(users);
  return (
    <div className="flex items-center justify-center">
      <Link href={"/dashboard/tasks"}>
        <Button>Login to View Tasks</Button>
      </Link>
    </div>
  );
}
