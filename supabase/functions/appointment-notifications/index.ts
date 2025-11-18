import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface AppointmentData {
  appointmentId: string;
  customerName: string;
  customerEmail?: string;
  serviceName: string;
  appointmentDate: string;
  appointmentTime: string;
  queueNumber: string;
  eventType: 'booked' | 'served' | 'cancelled' | 'reminder';
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const data: AppointmentData = await req.json();

    const message = {
      booked: `Your appointment for ${data.serviceName} has been confirmed! Queue Number: ${data.queueNumber}`,
      served: `Your appointment for ${data.serviceName} has been completed!`,
      cancelled: `Your appointment for ${data.serviceName} has been cancelled.`,
      reminder: `Reminder: Your appointment for ${data.serviceName} is scheduled for ${data.appointmentDate} at ${data.appointmentTime}`,
    };

    console.log(`Notification: ${data.customerName} - ${message[data.eventType]}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Notification sent for event: ${data.eventType}`,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error processing notification:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to process notification",
      }),
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
