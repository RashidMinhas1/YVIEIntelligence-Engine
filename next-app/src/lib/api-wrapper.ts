import { NextRequest, NextResponse } from "next/server";

export function withErrorHandling(handler: (req: NextRequest | any, ...args: any[]) => Promise<NextResponse | any>) {
  return async (req: NextRequest | any, ...args: any[]) => {
    try {
      return await handler(req, ...args);
    } catch (error: any) {
      console.error(`[API Error] ${req.url}:`, error);
      
      const message = error.message || String(error);
      let userFriendlyMessage = "An unexpected error occurred. Please try again later.";
      let status = 500;
      
      if (message.includes("quota") || message.includes("QUOTA_EXHAUSTED") || message.includes("429") || message.includes("credit") || message.includes("Billing")) {
         userFriendlyMessage = "API quota exceeded or rate limited. Please try again later.";
         status = 429;
      } else if (message.includes("Could not fetch live data") || message.includes("channel") || message.includes("Invalid")) {
         userFriendlyMessage = message;
         status = 400;
      } else if (message.includes("network") || message.includes("fetch") || message.includes("ECONNREFUSED")) {
         userFriendlyMessage = "Network unavailable. Please check your connection.";
         status = 503;
      }
      
      return NextResponse.json({ error: userFriendlyMessage }, { status });
    }
  };
}
