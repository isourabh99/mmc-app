import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const search = url.search;
  return NextResponse.redirect(new URL(`/booking-success${search}`, request.url));
}

export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  const search = url.search;
  return NextResponse.redirect(new URL(`/booking-success${search}`, request.url));
}
