import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin/auth";
import { getAdminProductSuggestions } from "@/lib/admin/products/queries";

const noStoreHeaders = {
  "Cache-Control": "private, no-store",
};

export async function GET(request: Request) {
  try {
    const admin = await getAdminUser();

    if (!admin) {
      return NextResponse.json(
        { error: "You must be an administrator." },
        { status: 401, headers: noStoreHeaders }
      );
    }

    const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";

    if (query.length < 2 || query.length > 100) {
      return NextResponse.json(
        { products: [] },
        { headers: noStoreHeaders }
      );
    }

    const products = await getAdminProductSuggestions(query);

    return NextResponse.json(
      { products },
      { headers: noStoreHeaders }
    );
  } catch (error) {
    console.error("ADMIN PRODUCT SUGGESTIONS ERROR:", error);

    return NextResponse.json(
      { error: "Unable to load product suggestions." },
      { status: 500, headers: noStoreHeaders }
    );
  }
}