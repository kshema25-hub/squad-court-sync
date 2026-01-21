import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationPayload {
  booking_id: string;
  old_status: string | null;
  new_status: string;
  user_id: string;
}

const getStatusEmoji = (status: string): string => {
  switch (status) {
    case 'approved': return '✅';
    case 'rejected': return '❌';
    case 'cancelled': return '🚫';
    case 'completed': return '🏁';
    case 'pending': return '⏳';
    default: return '📋';
  }
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'approved': return '#22c55e';
    case 'rejected': return '#ef4444';
    case 'cancelled': return '#6b7280';
    case 'completed': return '#3b82f6';
    case 'pending': return '#f59e0b';
    default: return '#6b7280';
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: NotificationPayload = await req.json();
    const { booking_id, old_status, new_status, user_id } = payload;

    console.log("Processing notification for booking:", booking_id);
    console.log("Status change:", old_status, "->", new_status);

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch booking details with related data
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from("bookings")
      .select(`
        *,
        court:courts(*),
        equipment:equipment(*),
        class:classes(*)
      `)
      .eq("id", booking_id)
      .single();

    if (bookingError || !booking) {
      console.error("Error fetching booking:", bookingError);
      throw new Error("Booking not found");
    }

    // Fetch user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("user_id", user_id)
      .single();

    if (profileError || !profile) {
      console.error("Error fetching profile:", profileError);
      throw new Error("User profile not found");
    }

    const resourceName = booking.court?.name || booking.equipment?.name || "Unknown Resource";
    const resourceType = booking.resource_type === 'court' ? 'Court' : 'Equipment';
    const bookingDate = new Date(booking.start_time).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const startTime = new Date(booking.start_time).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    const endTime = new Date(booking.end_time).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    const statusEmoji = getStatusEmoji(new_status);
    const statusColor = getStatusColor(new_status);
    const statusText = new_status.charAt(0).toUpperCase() + new_status.slice(1);

    // Build email content
    let subjectLine = `${statusEmoji} Your booking has been ${new_status}`;
    let messageContent = "";

    switch (new_status) {
      case 'approved':
        messageContent = `Great news! Your booking for <strong>${resourceName}</strong> has been approved. You're all set!`;
        break;
      case 'rejected':
        messageContent = `Unfortunately, your booking for <strong>${resourceName}</strong> has been rejected. Please contact administration for more details or try booking a different time slot.`;
        break;
      case 'cancelled':
        messageContent = `Your booking for <strong>${resourceName}</strong> has been cancelled.`;
        break;
      case 'completed':
        messageContent = `Your booking for <strong>${resourceName}</strong> has been marked as completed. Thank you for using our facilities!`;
        break;
      default:
        messageContent = `The status of your booking for <strong>${resourceName}</strong> has been updated to <strong>${statusText}</strong>.`;
    }

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <!-- Header -->
            <div style="padding: 32px 32px 24px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                SquadSync
              </h1>
              <p style="margin: 8px 0 0; color: #a1a1aa; font-size: 14px;">
                Booking Status Update
              </p>
            </div>
            
            <!-- Status Badge -->
            <div style="padding: 0 32px 24px; text-align: center;">
              <span style="display: inline-block; padding: 8px 24px; background-color: ${statusColor}20; color: ${statusColor}; border-radius: 9999px; font-size: 16px; font-weight: 600; border: 1px solid ${statusColor}40;">
                ${statusEmoji} ${statusText}
              </span>
            </div>
            
            <!-- Content -->
            <div style="background-color: #ffffff; padding: 32px; border-radius: 12px; margin: 0 16px 16px;">
              <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
                Hi ${profile.full_name},
              </p>
              
              <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
                ${messageContent}
              </p>
              
              <!-- Booking Details Card -->
              <div style="background-color: #f9fafb; border-radius: 12px; padding: 20px; margin: 24px 0;">
                <h3 style="margin: 0 0 16px; color: #111827; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">
                  Booking Details
                </h3>
                
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 40%;">
                      ${resourceType}:
                    </td>
                    <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 500;">
                      ${resourceName}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">
                      Date:
                    </td>
                    <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 500;">
                      ${bookingDate}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">
                      Time:
                    </td>
                    <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 500;">
                      ${startTime} - ${endTime}
                    </td>
                  </tr>
                  ${booking.quantity && booking.quantity > 1 ? `
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">
                      Quantity:
                    </td>
                    <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 500;">
                      ${booking.quantity}
                    </td>
                  </tr>
                  ` : ''}
                  ${booking.class ? `
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">
                      Class:
                    </td>
                    <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 500;">
                      ${booking.class.name}
                    </td>
                  </tr>
                  ` : ''}
                </table>
              </div>
              
              <p style="margin: 24px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                If you have any questions, please contact the administration.
              </p>
            </div>
            
            <!-- Footer -->
            <div style="padding: 24px 32px; text-align: center;">
              <p style="margin: 0; color: #71717a; font-size: 12px;">
                This is an automated notification from SquadSync.
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email using Resend REST API
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "SquadSync <onboarding@resend.dev>",
        to: [profile.email],
        subject: subjectLine,
        html: emailHtml,
      }),
    });

    const emailResult = await emailResponse.json();

    console.log("Email sent successfully:", emailResult);

    // Also create an in-app notification
    const notificationTitle = `Booking ${statusText}`;
    const notificationMessage = `Your ${resourceType.toLowerCase()} booking for ${resourceName} on ${bookingDate} has been ${new_status}.`;

    await supabaseAdmin
      .from("notifications")
      .insert({
        user_id: user_id,
        type: new_status === 'approved' ? 'success' : new_status === 'rejected' ? 'error' : 'info',
        title: notificationTitle,
        message: notificationMessage,
      });

    console.log("In-app notification created");

    return new Response(
      JSON.stringify({ success: true, email: emailResult }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-booking-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
