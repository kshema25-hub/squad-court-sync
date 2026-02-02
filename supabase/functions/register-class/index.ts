import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface RegisterClassRequest {
  email: string;
  password: string;
  full_name: string;
  class_name: string;
  class_id_code: string; // like "4AI23CD"
  department: string;
  year: number;
  student_count: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      email, 
      password, 
      full_name, 
      class_name, 
      class_id_code,
      department, 
      year, 
      student_count 
    }: RegisterClassRequest = await req.json();

    console.log("Registering class:", class_name, "for RP:", email);

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Generate unique class code
    const { data: classCode, error: codeError } = await supabaseAdmin
      .rpc('generate_class_code');

    if (codeError) {
      console.error("Error generating class code:", codeError);
      throw new Error("Failed to generate class code");
    }

    console.log("Generated class code:", classCode);

    // Create the user account
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm since we're sending class code
      user_metadata: {
        full_name,
        is_representative: true,
      },
    });

    if (authError) {
      console.error("Error creating user:", authError);
      throw new Error(authError.message);
    }

    const userId = authData.user.id;
    console.log("Created user:", userId);

    // Create the class with the generated code
    const { data: classData, error: classError } = await supabaseAdmin
      .from("classes")
      .insert({
        name: class_name,
        class_id: class_id_code,
        department,
        year,
        student_count,
        class_code: classCode,
        representative_user_id: userId,
        is_active: true,
      })
      .select()
      .single();

    if (classError) {
      console.error("Error creating class:", classError);
      // Rollback user creation
      await supabaseAdmin.auth.admin.deleteUser(userId);
      throw new Error("Failed to create class: " + classError.message);
    }

    console.log("Created class:", classData.id);

    // Update the profile with class_id and representative status
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({
        class_id: classData.id,
        is_representative: true,
      })
      .eq("user_id", userId);

    if (profileError) {
      console.error("Error updating profile:", profileError);
    }

    // Assign student role (representatives are still students)
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .update({ role: 'student' })
      .eq("user_id", userId);

    if (roleError) {
      console.error("Error updating role:", roleError);
    }

    // Send email with class code
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
                🎉 Welcome to SquadSync!
              </h1>
              <p style="margin: 8px 0 0; color: #a1a1aa; font-size: 14px;">
                Class Registration Successful
              </p>
            </div>
            
            <!-- Class Code -->
            <div style="padding: 0 32px 24px; text-align: center;">
              <p style="margin: 0 0 12px; color: #a1a1aa; font-size: 14px;">Your Class Code</p>
              <div style="display: inline-block; padding: 16px 32px; background-color: #22c55e20; border: 2px dashed #22c55e; border-radius: 12px;">
                <span style="font-size: 32px; font-weight: 700; color: #22c55e; letter-spacing: 4px;">
                  ${classCode}
                </span>
              </div>
            </div>
            
            <!-- Content -->
            <div style="background-color: #ffffff; padding: 32px; border-radius: 12px; margin: 0 16px 16px;">
              <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
                Hi ${full_name},
              </p>
              
              <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
                Congratulations! You've been registered as the Class Representative for <strong>${class_name}</strong>.
              </p>
              
              <!-- Info Card -->
              <div style="background-color: #f9fafb; border-radius: 12px; padding: 20px; margin: 24px 0;">
                <h3 style="margin: 0 0 16px; color: #111827; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">
                  📋 Class Details
                </h3>
                
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 40%;">Class:</td>
                    <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 500;">${class_name}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Class ID:</td>
                    <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 500;">${class_id_code}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Department:</td>
                    <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 500;">${department}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Year:</td>
                    <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 500;">${year}</td>
                  </tr>
                </table>
              </div>
              
              <!-- Important Notice -->
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0; border-radius: 0 8px 8px 0;">
                <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                  <strong>⚠️ Important:</strong> Keep your class code safe! You'll need it every time you log in along with your email and password.
                </p>
              </div>
              
              <p style="margin: 24px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                You can now book courts and equipment on behalf of your entire class.
              </p>
            </div>
            
            <!-- Footer -->
            <div style="padding: 24px 32px; text-align: center;">
              <p style="margin: 0; color: #71717a; font-size: 12px;">
                This is an automated email from SquadSync.
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "SquadSync <onboarding@resend.dev>",
        to: [email],
        subject: `🎉 Welcome to SquadSync - Your Class Code: ${classCode}`,
        html: emailHtml,
      }),
    });

    const emailResult = await emailResponse.json();
    console.log("Email sent:", emailResult);

    return new Response(
      JSON.stringify({ 
        success: true, 
        class_code: classCode,
        class_id: classData.id,
        user_id: userId,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in register-class:", error);
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