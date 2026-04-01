import { NextResponse } from 'next/server';
import { PLAN_CATALOG, getSalesContact } from '@/lib/subscription';

export async function GET() {
  return NextResponse.json({
    plans: PLAN_CATALOG,
    contactForCustom: getSalesContact(),
  });
}
