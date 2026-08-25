import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ productId: string }>;
  }
) {
  try {
    const { productId } = await params;

    if (!productId) {
      return NextResponse.json(
        {
          error: "Product ID is required.",
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    const threshold = Number(body.threshold);

    if (!Number.isInteger(threshold) || threshold < 0) {
      return NextResponse.json(
        {
          error:
            "Low-stock threshold must be a non-negative integer.",
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          error: "You must be authenticated.",
        },
        { status: 401 }
      );
    }

    const { data, error } = await supabase
      .from("inventory")
      .update({
        low_stock_threshold: threshold,
        updated_at: new Date().toISOString(),
      })
      .eq("product_id", productId)
      .select(
        `
        product_id,
        quantity,
        reserved_quantity,
        low_stock_threshold,
        updated_at
        `
      )
      .single();

    if (error) {
      console.error(
        "UPDATE INVENTORY THRESHOLD ERROR:",
        error
      );

      return NextResponse.json(
        {
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      inventory: data,
    });
  } catch (error) {
    console.error(
      "INVENTORY THRESHOLD API ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Internal server error.",
      },
      { status: 500 }
    );
  }
}