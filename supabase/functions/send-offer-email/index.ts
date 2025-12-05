import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendOfferRequest {
  offerSendId: string;
  to: string;
  subject: string;
  message: string;
  projectName: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    if (!resendApiKey) {
      console.error("RESEND_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "Email service is not configured. Please add RESEND_API_KEY." }),
        { 
          status: 500, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }

    const { to, subject, message, projectName }: SendOfferRequest = await req.json();

    console.log(`Sending offer email to: ${to}, subject: ${subject}`);

    // Format HTML email
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #1a1a1a;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #2563eb, #1d4ed8);
              color: white;
              padding: 30px;
              border-radius: 8px;
              text-align: center;
              margin-bottom: 30px;
            }
            .content {
              background: #f9fafb;
              padding: 25px;
              border-radius: 8px;
              white-space: pre-wrap;
            }
            .footer {
              text-align: center;
              color: #6b7280;
              font-size: 12px;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
            }
            .project-badge {
              display: inline-block;
              background: #dbeafe;
              color: #1d4ed8;
              padding: 4px 12px;
              border-radius: 20px;
              font-size: 14px;
              margin-top: 10px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 style="margin: 0;">Majster.AI</h1>
            <span class="project-badge">${projectName}</span>
          </div>
          <div class="content">
            ${message.replace(/\n/g, '<br>')}
          </div>
          <div class="footer">
            <p>Ta wiadomość została wysłana przez Majster.AI</p>
          </div>
        </body>
      </html>
    `;

    // Send email via Resend API
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Majster.AI <onboarding@resend.dev>",
        to: [to],
        subject: subject,
        html: htmlContent,
      }),
    });

    const responseData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error("Resend API error:", responseData);
      throw new Error(responseData.message || "Failed to send email");
    }

    console.log("Email sent successfully:", responseData);

    return new Response(
      JSON.stringify({ success: true, id: responseData.id }),
      { 
        status: 200, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );
  } catch (error: any) {
    console.error("Error in send-offer-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );
  }
};

serve(handler);
