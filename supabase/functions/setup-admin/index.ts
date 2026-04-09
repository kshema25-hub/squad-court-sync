import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ADMIN_EMAIL = "admin@gmail.com";
const ADMIN_PASSWORD = "admin@123";

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if admin already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingAdmin = existingUsers?.users?.find(u => u.email === ADMIN_EMAIL);

    if (existingAdmin) {
      const { data: roleData } = await supabaseAdmin
        .from('user_roles')
        .select('role')
        .eq('user_id', existingAdmin.id)
        .maybeSingle();

      if (roleData?.role === 'admin') {
        await supabaseAdmin.auth.admin.updateUserById(existingAdmin.id, {
          password: ADMIN_PASSWORD,
          email_confirm: true,
        });
        return new Response(
          JSON.stringify({ success: true, message: "Admin already exists, password reset", user_id: existingAdmin.id }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Delete any existing roles first, then insert admin role
      await supabaseAdmin
        .from('user_roles')
        .delete()
        .eq('user_id', existingAdmin.id);
      await supabaseAdmin
        .from('user_roles')
        .insert({ user_id: existingAdmin.id, role: 'admin' });
      return new Response(
        JSON.stringify({ success: true, message: "Admin role updated", user_id: existingAdmin.id }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create admin user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: "Admin" },
    });

    if (authError) {
      console.error("Error creating admin user:", authError);
      return new Response(
        JSON.stringify({ error: authError.message }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const userId = authData.user.id;

    await supabaseAdmin
      .from("profiles")
      .upsert({ user_id: userId, full_name: "Admin", email: ADMIN_EMAIL }, { onConflict: 'user_id' });

    await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq('user_id', userId);
    await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId, role: 'admin' });

    return new Response(
      JSON.stringify({ success: true, message: "Admin created successfully", user_id: userId, email: ADMIN_EMAIL }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in setup-admin:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
