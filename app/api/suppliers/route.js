// app/api/suppliers/route.js
import { NextResponse } from 'next/server';
import { db } from '@/utils/dbConfig'; // Ensure this path is correct
import { suppliers } from '@/utils/schema';   // Ensure this path is correct
import { eq, and, asc, or, isNull } from 'drizzle-orm'; // Added 'or' and 'isNull'
import { getAuth } from '@clerk/nextjs/server';

// GET all suppliers for the logged-in user OR global suppliers
export async function GET(req) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      // If no user is logged in, perhaps only show global suppliers or return an error.
      // For now, let's assume if no userId, we might still want global ones,
      // or you could return an error/empty array.
      // Let's adjust to only fetch if userId is present, or only fetch global if no userId.
      // For this use case (dropdown in a form for a logged-in user), userId should be present.
      return NextResponse.json({ error: 'Unauthorized - User not authenticated' }, { status: 401 });
    }

    const result = await db
      .select()
      .from(suppliers)
      .where(
        or(
          eq(suppliers.user_id, userId), // Suppliers belonging to the current user
          isNull(suppliers.user_id)      // Global suppliers (user_id IS NULL)
        )
      )
      .orderBy(asc(suppliers.name)); // Order by name for easier display in dropdowns

    return NextResponse.json(result, { status: 200 });

  } catch (error) {
    console.error("API GET Suppliers Error:", error);
    return NextResponse.json({ error: 'Failed to fetch suppliers.', details: error.message }, { status: 500 });
  }
}

// POST a new supplier for the logged-in user
export async function POST(req) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized - User not authenticated' }, { status: 401 });
    }

    const body = await req.json();
    const { name, city, phone, email, address, notes } = body;

    if (!name) {
      return NextResponse.json({ error: 'Supplier name is required' }, { status: 400 });
    }

    // Optional: Add more validation for other fields (e.g., email format)

    const [newSupplier] = await db
      .insert(suppliers)
      .values({
        user_id: userId, // New suppliers are always tied to the current user
        name,
        city,
        phone,
        email,
        address,
        notes,
      })
      .returning(); // Return the newly created supplier

    return NextResponse.json(newSupplier, { status: 201 });

  } catch (error) {
    console.error("API POST Supplier Error:", error);
    // Check for unique constraint errors or other specific DB errors if needed
    return NextResponse.json({ error: 'Failed to create supplier.', details: error.message }, { status: 500 });
  }
}
