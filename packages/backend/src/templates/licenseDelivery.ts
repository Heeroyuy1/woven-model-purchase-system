/**
 * License Delivery Email Template
 * Sent to customers once their license key(s) are ready.
 * Supports single-product and multi-product deliveries.
 * Brand: Dark navy/cyan theme matching Woven Model website.
 */

interface LicenseEntry {
  productName: string;
  licenseKey: string;
}

interface LicenseDeliveryData {
  customerName: string;
  productName: string;
  licenseKey: string;
  productVersion: string;
  downloadUrl: string;
  installationUrl: string;
  portalUrl: string;
  documentationUrl: string;
  multipleItems: boolean;
  licenses: LicenseEntry[];
}

export function licenseDelivery(data: LicenseDeliveryData): string {
  // Build the license content — code box for single, table for multiple
  let licenseContent: string;

  if (data.multipleItems && data.licenses && data.licenses.length > 0) {
    // Table for multiple products
    const licenseRows = data.licenses
      .map(
        (lic) => `
        <tr>
          <td style="padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,0.08); color: #ffffff; font-size: 14px;">${lic.productName}</td>
          <td style="padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,0.08); font-size: 13px; font-family: 'JetBrains Mono', 'Fira Code', monospace; color: #22d3ee; letter-spacing: 0.5px; word-break: break-all;">${lic.licenseKey}</td>
        </tr>`
      )
      .join('');

    licenseContent = `
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #1c2d56; border-radius: 12px; border: 1px solid rgba(34, 211, 238, 0.15); overflow: hidden;">
        <thead>
          <tr style="background-color: rgba(34, 211, 238, 0.06);">
            <th style="padding: 12px 16px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #9ca3af; font-weight: 500; border-bottom: 2px solid #22d3ee;">Product</th>
            <th style="padding: 12px 16px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #9ca3af; font-weight: 500; border-bottom: 2px solid #22d3ee;">License Key</th>
          </tr>
        </thead>
        <tbody>
          ${licenseRows}
        </tbody>
      </table>`;
  } else {
    // Single product: prominent code box
    licenseContent = `
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #1c2d56; border-radius: 12px; border: 2px solid #22d3ee; box-shadow: 0 4px 16px rgba(6,182,212,0.35);">
        <tr>
          <td style="padding: 4px 20px 0;">
            <p style="margin: 0; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #22d3ee; font-weight: 500; text-align: center;">License Key</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 24px 20px; text-align: center;">
            <span style="display: inline-block; font-family: 'JetBrains Mono', 'Fira Code', monospace; font-size: 18px; font-weight: 600; color: #22d3ee; letter-spacing: 2px; word-break: break-all; line-height: 1.5; background-color: rgba(34,211,238,0.06); padding: 12px 20px; border-radius: 8px;">${data.licenseKey}</span>
          </td>
        </tr>
      </table>`;
  }

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <title>Your License is Ready</title>
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

                <!-- KEY ICON -->
                <tr>
                  <td align="center" style="padding-bottom: 20px;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="width: 64px; height: 64px; background-color: rgba(34, 211, 238, 0.12); border-radius: 50%;">
                      <tr>
                        <td align="center" valign="middle" style="font-size: 28px; line-height: 64px; color: #22d3ee;">🔑</td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- HEADING -->
                <tr>
                  <td align="center" style="padding-bottom: 8px;">
                    <h2 style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">Your License is Ready</h2>
                  </td>
                </tr>

                <!-- GREETING -->
                <tr>
                  <td style="padding-bottom: 28px;">
                    <p style="margin: 0; font-size: 16px; color: #d1d5db; line-height: 1.6; text-align: center;">Hi ${data.customerName},</p>
                    <p style="margin: 8px 0 0; font-size: 15px; color: #9ca3af; line-height: 1.6; text-align: center;">Your license${data.multipleItems ? 's' : ''} for <strong style="color: #ffffff;">${data.productName}${data.multipleItems ? '' : ''}</strong> ${data.multipleItems ? 'are' : 'is'} now available. Please find your activation details below.</p>
                  </td>
                </tr>

                <!-- PRODUCT VERSION -->
                <tr>
                  <td style="padding-bottom: 20px;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #1c2d56; border-radius: 12px; border: 1px solid rgba(34, 211, 238, 0.15);">
                      <tr>
                        <td style="padding: 16px 24px;">
                          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                              <td style="width: 50%;">
                                <span style="font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; font-weight: 500;">Product</span>
                                <span style="display: block; margin-top: 4px; font-size: 15px; color: #ffffff; font-weight: 600;">${data.productName}</span>
                              </td>
                              <td style="width: 50%; text-align: right;">
                                <span style="font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; font-weight: 500;">Version</span>
                                <span style="display: block; margin-top: 4px; font-size: 15px; color: #22d3ee; font-weight: 600;">${data.productVersion}</span>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- LICENSE KEY(S) -->
                <tr>
                  <td style="padding-bottom: 28px;">
                    <h3 style="margin: 0 0 12px; font-size: 16px; font-weight: 600; color: #ffffff;">Activation Details</h3>
                    ${licenseContent}
                  </td>
                </tr>

                <!-- DOWNLOAD & INSTALLATION INSTRUCTIONS -->
                <tr>
                  <td style="padding-bottom: 24px;">
                    <h3 style="margin: 0 0 12px; font-size: 16px; font-weight: 600; color: #ffffff;">Getting Started</h3>
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #1c2d56; border-radius: 12px; border: 1px solid rgba(34, 211, 238, 0.15);">
                      <tr>
                        <td style="padding: 20px 24px;">
                          <div style="font-size: 14px; color: #d1d5db; line-height: 1.7;">
                            <p style="margin: 0 0 12px;"><strong style="color: #ffffff;">1. Download</strong> — Download the software package from the link below.</p>
                            <p style="margin: 0 0 12px;"><strong style="color: #ffffff;">2. Install</strong> — Run the installer and follow the on-screen instructions.</p>
                            <p style="margin: 0 0 12px;"><strong style="color: #ffffff;">3. Activate</strong> — Enter your license key when prompted during activation.</p>
                            <p style="margin: 0;"><strong style="color: #ffffff;">4. Verify</strong> — Confirm activation in your Woven Model Portal.</p>
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- LINKS -->
                <tr>
                  <td style="padding-bottom: 28px;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="padding: 0 4px 8px 0; width: 33.33%;">
                          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                              <td align="center" style="background-color: rgba(34, 211, 238, 0.1); border: 1px solid rgba(34, 211, 238, 0.25); border-radius: 8px; padding: 12px 8px;">
                                <a href="${data.downloadUrl}" style="color: #22d3ee; font-size: 13px; font-weight: 600; text-decoration: none; display: block;">⬇ Download</a>
                              </td>
                            </tr>
                          </table>
                        </td>
                        <td style="padding: 0 4px 8px; width: 33.33%;">
                          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                              <td align="center" style="background-color: rgba(34, 211, 238, 0.1); border: 1px solid rgba(34, 211, 238, 0.25); border-radius: 8px; padding: 12px 8px;">
                                <a href="${data.portalUrl}" style="color: #22d3ee; font-size: 13px; font-weight: 600; text-decoration: none; display: block;">🔗 Portal</a>
                              </td>
                            </tr>
                          </table>
                        </td>
                        <td style="padding: 0 0 8px 4px; width: 33.33%;">
                          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                              <td align="center" style="background-color: rgba(34, 211, 238, 0.1); border: 1px solid rgba(34, 211, 238, 0.25); border-radius: 8px; padding: 12px 8px;">
                                <a href="${data.documentationUrl}" style="color: #22d3ee; font-size: 13px; font-weight: 600; text-decoration: none; display: block;">📄 Docs</a>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- ACTIVATION INSTRUCTIONS SECTION -->
                <tr>
                  <td style="padding-bottom: 8px;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background: linear-gradient(135deg, rgba(34, 211, 238, 0.08), rgba(6, 182, 212, 0.04)); border: 1px solid rgba(34, 211, 238, 0.2); border-radius: 12px;">
                      <tr>
                        <td style="padding: 20px 24px;">
                          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                              <td valign="middle" style="width: 28px; font-size: 18px; color: #22d3ee; line-height: 1;">ℹ</td>
                              <td style="padding-left: 12px;">
                                <h4 style="margin: 0 0 4px; font-size: 15px; font-weight: 600; color: #ffffff;">Need Help Activating?</h4>
                                <p style="margin: 0; font-size: 13px; color: #9ca3af; line-height: 1.5;">Visit our <a href="${data.installationUrl}" style="color: #22d3ee; text-decoration: underline;">installation guide</a> for step-by-step instructions. If you run into any issues, our support team is here to help.</p>
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

          <!-- FOOTER -->
          <tr>
            <td style="background-color: #0a0f1e; padding: 24px 40px; border-top: 1px solid rgba(255,255,255,0.06);">
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
                      Support: <a href="mailto:support@wovenmodel.com" style="color: #22d3ee; text-decoration: none;">support@wovenmodel.com</a>
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