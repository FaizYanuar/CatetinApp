import { Webhook } from "svix";
import { NextRequest, NextResponse } from "next/server";
import { db } from '@/utils/dbConfig';
import { users } from '@/utils/schema'; 
import { eq } from "drizzle-orm";
import { verifyWebhook } from '@clerk/nextjs/webhooks'

// For verification
const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET || "";

export async function POST(req) {
  try {
    const payload = await req.text();
    const headers = Object.fromEntries(req.headers.entries());

    const wh = new Webhook(WEBHOOK_SECRET);
    const evt = wh.verify(payload, headers);

    console.log("Verified event:", evt);

    if (evt.type === "user.created") {
      const { id, first_name, email_addresses } = evt.data;

      await db.insert(users).values({
        id,
        name: first_name || email_addresses[0].email_address,
      }).onConflictDoNothing().execute();
    }

    return new NextResponse("OK", { status: 200 });

  } catch (error) {
    console.error("Webhook Error:", error);
    return new NextResponse("Webhook Error", { status: 500 });
  }
}
