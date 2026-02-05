 import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
 import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers":
     "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
 };
 
 const DEMO_ADMIN_EMAIL = "admin@squadsync.demo";
 const DEMO_ADMIN_PASSWORD = "admin123";
 
 const handler = async (req: Request): Promise<Response> => {
   if (req.method === "OPTIONS") {
     return new Response(null, { headers: corsHeaders });
   }
 
   try {
     // Create Supabase admin client
     const supabaseAdmin = createClient(
       Deno.env.get("SUPABASE_URL")!,
       Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
     );
 
     // Check if admin already exists
     const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
     const existingAdmin = existingUsers?.users?.find(u => u.email === DEMO_ADMIN_EMAIL);
 
     if (existingAdmin) {
       // Check if they have admin role
       const { data: roleData } = await supabaseAdmin
         .from('user_roles')
         .select('role')
         .eq('user_id', existingAdmin.id)
         .maybeSingle();
 
       if (roleData?.role === 'admin') {
         return new Response(
           JSON.stringify({ success: true, message: "Admin already exists", user_id: existingAdmin.id }),
           { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
         );
       }
 
       // Update role to admin
       await supabaseAdmin
         .from('user_roles')
         .upsert({ user_id: existingAdmin.id, role: 'admin' }, { onConflict: 'user_id' });
 
       return new Response(
         JSON.stringify({ success: true, message: "Admin role updated", user_id: existingAdmin.id }),
         { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
       );
     }
 
     // Create admin user
     const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
       email: DEMO_ADMIN_EMAIL,
       password: DEMO_ADMIN_PASSWORD,
       email_confirm: true,
       user_metadata: {
         full_name: "Demo Admin",
       },
     });
 
     if (authError) {
       console.error("Error creating admin user:", authError);
       return new Response(
         JSON.stringify({ error: authError.message }),
         { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
       );
     }
 
     const userId = authData.user.id;
     console.log("Created admin user:", userId);
 
     // Update profile
     await supabaseAdmin
       .from("profiles")
       .upsert({
         user_id: userId,
         full_name: "Demo Admin",
         email: DEMO_ADMIN_EMAIL,
       }, { onConflict: 'user_id' });
 
     // Set admin role
     await supabaseAdmin
       .from("user_roles")
       .upsert({ user_id: userId, role: 'admin' }, { onConflict: 'user_id' });
 
     console.log("Admin setup complete for user:", userId);
 
     return new Response(
       JSON.stringify({ 
         success: true, 
         message: "Admin created successfully",
         user_id: userId,
         email: DEMO_ADMIN_EMAIL,
       }),
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