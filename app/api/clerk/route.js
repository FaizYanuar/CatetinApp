import { Webhook } from "svix";
import { NextRequest, NextResponse } from "next/server";
import { db } from '@/utils/dbConfig';
import { users } from '@/utils/schema'; 
import { eq } from "drizzle-orm";

// For verification
const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET || "";

export async function POST(req) {
  const payload = await req.text();
  const headers = Object.fromEntries(req.headers.entries());
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET);

  let evt;
  try {
    evt = wh.verify(payload, headers);
  } catch (e) {
    console.error("Webhook signature mismatch", e);
    return new NextResponse("Invalid signature", { status: 400 });
  }

  if (evt.type === "user.created") {
    const { id, first_name, email_addresses } = evt.data.user;
    try {
      await db
        .insert(users)
        .values({
          id,
          name: first_name || email_addresses[0].email_address,
        })
        .onConflictDoNothing()
        .execute();
    } catch (e) {
      console.error("Failed to insert user", e);
      return new NextResponse("DB error", { status: 500 });
    }
  }

  return new NextResponse("OK", { status: 200 });
}