/**
 * Thank You Email Template
 * Sent to customers after purchase as a warm follow-up.
 * Provides quick-start resources, documentation links, and support info.
 * Brand: Dark navy/cyan theme matching Woven Model website.
 */

interface ThankYouData {
  customerName: string;
}

export function thankYou(data: ThankYouData): string {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <title>Thank You</title>
  <!--[if mso]>
  <style>
    table {border-collapse: collapse;}
    td {font-family: 'Inter', Arial, sans-serif;}
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #0a0f1e; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0a0f1e;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <!--[if mso]>
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600"><tr><td>
        <![endif]-->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #0d1428; border-radius: 16px; overflow: hidden; box-shadow: 0 12px 40px rgba(0,0,0,0.5);">

          <!-- HEADER -->
          <tr>
            <td style="background: linear-gradient(135deg, #0d1428 0%, #111b36 100%); padding: 32px 40px 24px; border-bottom: 2px solid #22d3ee;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="text-align: center;">
                    <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px; line-height: 1.2;">
                      <span style="color: #22d3ee;">✦</span> Woven Model
                    </h1>
                    <p style="margin: 4px 0 0; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: #22d3ee; font-weight: 500;">Enterprise Software</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- MAIN CONTENT -->
          <tr>
            <td style="padding: 40px 40px 32px;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">

                <!-- HEART ICON -->
                <tr>
                  <td align="center" style="padding-bottom: 20px;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="width: 64px; height: 64px; background-color: rgba(34, 211, 238, 0.12); border-radius: 50%;">
                      <tr>
                        <td align="center" valign="middle" style="font-size: 28px; line-height: 64px; color: #22d3ee;">♥</td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- HEADING -->
                <tr>
                  <td align="center" style="padding-bottom: 8px;">
                    <h2 style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">Thank You for Choosing Woven Model</h2>
                  </td>
                </tr>

                <!-- GREETING -->
                <tr>
                  <td style="padding-bottom: 28px;">
                    <p style="margin: 0; font-size: 16px; color: #d1d5db; line-height: 1.7; text-align: center;">Hi ${data.customerName},</p>
                    <p style="margin: 12px 0 0; font-size: 15px; color: #9ca3af; line-height: 1.7; text-align: center;">
                      We just wanted to say <strong style="color: #ffffff;">thank you</strong> for choosing Woven Model. Your trust in our software means the world to us, and we're committed to helping you succeed.
                    </p>
                    <p style="margin: 12px 0 0; font-size: 15px; color: #9ca3af; line-height: 1.7; text-align: center;">
                      You're now part of a growing community of professionals who rely on Woven Model to deliver their best work every day. We're excited to see what you'll build.
                    </p>
                  </td>
                </tr>

                <!-- QUICK-START RESOURCES -->
                <tr>
                  <td style="padding-bottom: 24px;">
                    <h3 style="margin: 0 0 12px; font-size: 16px; font-weight: 600; color: #ffffff;">Quick-Start Resources</h3>
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="padding: 0 0 8px;">
                          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #1c2d56; border-radius: 8px; border: 1px solid rgba(34, 211, 238, 0.12);">
                            <tr>
                              <td style="padding: 14px 20px;">
                                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                                  <tr>
                                    <td style="width: 32px; font-size: 18px; color: #22d3ee; line-height: 1;" valign="middle">📘</td>
                                    <td style="padding-left: 12px;" valign="middle">
                                      <a href="#" style="color: #22d3ee; font-size: 14px; font-weight: 600; text-decoration: none;">Getting Started Guide</a>
                                      <span style="display: block; margin-top: 2px; font-size: 12px; color: #6b7280;">Learn the basics in 10 minutes</span>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 0 0 8px;">
                          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #1c2d56; border-radius: 8px; border: 1px solid rgba(34, 211, 238, 0.12);">
                            <tr>
                              <td style="padding: 14px 20px;">
                                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                                  <tr>
                                    <td style="width: 32px; font-size: 18px; color: #22d3ee; line-height: 1;" valign="middle">🎓</td>
                                    <td style="padding-left: 12px;" valign="middle">
                                      <a href="#" style="color: #22d3ee; font-size: 14px; font-weight: 600; text-decoration: none;">Video Tutorials</a>
                                      <span style="display: block; margin-top: 2px; font-size: 12px; color: #6b7280;">Watch step-by-step walkthroughs</span>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 0 0 8px;">
                          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #1c2d56; border-radius: 8px; border: 1px solid rgba(34, 211, 238, 0.12);">
                            <tr>
                              <td style="padding: 14px 20px;">
                                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                                  <tr>
                                    <td style="width: 32px; font-size: 18px; color: #22d3ee; line-height: 1;" valign="middle">🚀</td>
                                    <td style="padding-left: 12px;" valign="middle">
                                      <a href="#" style="color: #22d3ee; font-size: 14px; font-weight: 600; text-decoration: none;">Best Practices</a>
                                      <span style="display: block; margin-top: 2px; font-size: 12px; color: #6b7280;">Pro tips from our engineering team</span>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- DOCUMENTATION & TUTORIAL LINKS -->
                <tr>
                  <td style="padding-bottom: 24px;">
                    <h3 style="margin: 0 0 12px; font-size: 16px; font-weight: 600; color: #ffffff;">Documentation & Tutorials</h3>
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #1c2d56; border-radius: 12px; border: 1px solid rgba(34, 211, 238, 0.15);">
                      <tr>
                        <td style="padding: 20px 24px;">
                          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                              <td style="padding: 6px 0;">
                                <a href="#" style="color: #22d3ee; font-size: 14px; text-decoration: none; display: block; padding: 6px 0;">📖 Full Documentation →</a>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 6px 0; border-top: 1px solid rgba(255,255,255,0.06);">
                                <a href="#" style="color: #22d3ee; font-size: 14px; text-decoration: none; display: block; padding: 6px 0;">📹 Video Library →</a>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 6px 0; border-top: 1px solid rgba(255,255,255,0.06);">
                                <a href="#" style="color: #22d3ee; font-size: 14px; text-decoration: none; display: block; padding: 6px 0;">💬 Community Forum →</a>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 6px 0; border-top: 1px solid rgba(255,255,255,0.06);">
                                <a href="#" style="color: #22d3ee; font-size: 14px; text-decoration: none; display: block; padding: 6px 0;">📚 API Reference →</a>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- SUPPORT CONTACT -->
                <tr>
                  <td style="padding-bottom: 20px;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background: linear-gradient(135deg, rgba(34, 211, 238, 0.08), rgba(6, 182, 212, 0.04)); border: 1px solid rgba(34, 211, 238, 0.2); border-radius: 12px;">
                      <tr>
                        <td style="padding: 20px 24px;">
                          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                              <td valign="middle" style="width: 28px; font-size: 18px; color: #22d3ee; line-height: 1;">🛟</td>
                              <td style="padding-left: 12px;">
                                <h4 style="margin: 0 0 4px; font-size: 15px; font-weight: 600; color: #ffffff;">We're Here to Help</h4>
                                <p style="margin: 0; font-size: 13px; color: #9ca3af; line-height: 1.6;">
                                  Have a question? Our support team is available during business hours at<br>
                                  <a href="mailto:support@wovenmodel.com" style="color: #22d3ee; text-decoration: underline; font-weight: 500;">support@wovenmodel.com</a>
                                </p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- FEEDBACK INVITATION -->
                <tr>
                  <td style="padding-bottom: 20px;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #1c2d56; border-radius: 12px; border: 1px solid rgba(34, 211, 238, 0.12);">
                      <tr>
                        <td style="padding: 20px 24px;">
                          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                              <td valign="middle" style="width: 28px; font-size: 18px; color: #22d3ee; line-height: 1;">💡</td>
                              <td style="padding-left: 12px;">
                                <h4 style="margin: 0 0 4px; font-size: 15px; font-weight: 600; color: #ffffff;">Your Feedback Matters</h4>
                                <p style="margin: 0; font-size: 13px; color: #9ca3af; line-height: 1.6;">
                                  We're constantly improving Woven Model. If you have suggestions, feature requests, or ideas, we'd love to hear from you.
                                </p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- FUTURE UPDATES -->
                <tr>
                  <td style="padding-bottom: 8px;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #1c2d56; border-radius: 12px; border: 1px solid rgba(34, 211, 238, 0.12);">
                      <tr>
                        <td style="padding: 20px 24px;">
                          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                              <td valign="middle" style="width: 28px; font-size: 18px; color: #22d3ee; line-height: 1;">🔔</td>
                              <td style="padding-left: 12px;">
                                <h4 style="margin: 0 0 4px; font-size: 15px; font-weight: 600; color: #ffffff;">Stay in the Loop</h4>
                                <p style="margin: 0; font-size: 13px; color: #9ca3af; line-height: 1.6;">
                                  You'll receive notifications about product updates, new features, and tips to help you get the most out of Woven Model. We respect your inbox — only meaningful updates.
                                </p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- SOCIAL LINKS PLACEHOLDER -->
          <tr>
            <td style="background-color: #0a0f1e; padding: 24px 40px 8px; border-top: 1px solid rgba(255,255,255,0.06);">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding-bottom: 12px;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="display: inline-block;">
                      <tr>
                        <td style="padding: 0 8px;">
                          <a href="#" style="display: inline-block; width: 36px; height: 36px; background-color: rgba(34, 211, 238, 0.08); border-radius: 50%; text-align: center; line-height: 36px; font-size: 16px; color: #22d3ee; text-decoration: none;">𝕏</a>
                        </td>
                        <td style="padding: 0 8px;">
                          <a href="#" style="display: inline-block; width: 36px; height: 36px; background-color: rgba(34, 211, 238, 0.08); border-radius: 50%; text-align: center; line-height: 36px; font-size: 16px; color: #22d3ee; text-decoration: none;">in</a>
                        </td>
                        <td style="padding: 0 8px;">
                          <a href="#" style="display: inline-block; width: 36px; height: 36px; background-color: rgba(34, 211, 238, 0.08); border-radius: 50%; text-align: center; line-height: 36px; font-size: 16px; color: #22d3ee; text-decoration: none;">GH</a>
                        </td>
                        <td style="padding: 0 8px;">
                          <a href="#" style="display: inline-block; width: 36px; height: 36px; background-color: rgba(34, 211, 238, 0.08); border-radius: 50%; text-align: center; line-height: 36px; font-size: 16px; color: #22d3ee; text-decoration: none;">YT</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background-color: #0a0f1e; padding: 8px 40px 24px;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding-bottom: 12px;">
                    <p style="margin: 0; font-size: 13px; color: #9ca3af; line-height: 1.5;">
                      <strong style="color: #ffffff;">Woven Model</strong> — Enterprise Software Solutions
                    </p>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-bottom: 8px;">
                    <p style="margin: 0; font-size: 12px; color: #6b7280; line-height: 1.5;">
                      <a href="mailto:support@wovenmodel.com" style="color: #22d3ee; text-decoration: none;">support@wovenmodel.com</a> — Business Hours: Mon–Fri, 9 AM – 6 PM EST
                    </p>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <p style="margin: 0; font-size: 11px; color: #4b5563; line-height: 1.5;">
                      &copy; ${new Date().getFullYear()} Woven Model. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
        <!--[if mso]>
        </td></tr></table>
        <![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>`;
}