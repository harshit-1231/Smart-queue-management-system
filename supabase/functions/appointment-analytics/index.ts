import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    const { data: appointments, error } = await supabase
      .from("appointments")
      .select("*, services(*)");

    if (error) throw error;

    const today = new Date().toISOString().split("T")[0];
    const stats = {
      total: appointments?.length || 0,
      today: appointments?.filter((a) => a.appointment_date === today).length || 0,
      served: appointments?.filter((a) => a.status === "served").length || 0,
      cancelled: appointments?.filter((a) => a.status === "cancelled").length || 0,
      waiting: appointments?.filter((a) => a.status === "waiting").length || 0,
    };

    const timeSlotDistribution: Record<string, number> = {};
    appointments?.forEach((apt) => {
      const hour = apt.appointment_time?.split(":")[0];
      if (hour) {
        timeSlotDistribution[`${hour}:00`] =
          (timeSlotDistribution[`${hour}:00`] || 0) + 1;
      }
    });

    const busiestSlots = Object.entries(timeSlotDistribution)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([time, count]) => ({ time, count }));

    return new Response(
      JSON.stringify({
        stats,
        busiestSlots,
        serviceBreakdown: appointments
          ?.reduce(
            (acc, apt) => {
              const serviceName = apt.services?.name || "Unknown";
              acc[serviceName] = (acc[serviceName] || 0) + 1;
              return acc;
            },
            {} as Record<string, number>
          ),
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Analytics error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch analytics" }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
