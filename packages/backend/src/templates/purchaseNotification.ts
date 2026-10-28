/**
 * Internal "new sale" notification sent to the business owner whenever a
 * purchase completes. Mirrors the branding of the customer-facing emails so
 * the whole inbox looks consistent.
 */

interface PurchaseNotificationItem {
  productName: string;
  productCode: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface PurchaseNotificationData {
  orderNumber: string;
  orderId: string;
  customerName: string;
  customerEmail: string;
  items: PurchaseNotificationItem[];
  subtotal: number;
  discount: number;
  taxAmount: number;
  total: number;
  currency: string;
  paymentIntentId: string;
  receiptUrl?: string | null;
  licenseKeys: string[];
  paidAt: string;
}

const money = (value: number) => `$${(value ?? 0).toFixed(2)}`;

export function purchaseNotification(data: PurchaseNotificationData): string {
  const itemRows = data.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 10px 12px; border-bottom: 1px solid #1e2a45; color: #e5e7eb; font-size: 13px;">
          ${item.productName}<br>
          <span style="color: #6b7280; font-size: 11px;">${item.productCode}</span>
        </td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #1e2a45; color: #b0c4de; font-size: 13px; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #1e2a45; color: #b0c4de; font-size: 13px; text-align: right;">${money(item.unitPrice)}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #1e2a45; color: #ffffff; font-size: 13px; text-align: right;">${money(item.totalPrice)}</td>
      </tr>`
    )
    .join('');

  const licenseRows = data.licenseKeys.length
    ? data.licenseKeys
        .map(
          (key) => `
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #1e2a45; color: #22d3ee; font-size: 12px; font-family: ui-monospace, Menlo, Consolas, monospace;">${key}</td>
      </tr>`
        )
        .join('')
    : `<tr><td style="padding: 8px 12px; color: #f59e0b; font-size: 12px;">No license keys issued yet - check the order in the admin portal.</td></tr>`;

  const receiptRow = data.receiptUrl
    ? `<tr>
         <td style="color: #8899aa; font-size: 13px;">Stripe receipt</td>
         <td style="text-align: right; font-size: 13px;"><a href="${data.receiptUrl}" style="color: #22d3ee; text-decoration: none;">View receipt</a></td>
       </tr>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>New Sale</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0f1e; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0f1e; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #0d1428; border-radius: 12px; border: 1px solid #1e2a45;">
          <tr>
            <td style="padding: 28px 30px; border-bottom: 2px solid #22d3ee;">
              <h1 style="color: #ffffff; font-size: 22px; margin: 0;">New Sale Completed</h1>
              <p style="color: #22d3ee; font-size: 13px; margin: 6px 0 0 0; letter-spacing: 1px; text-transform: uppercase;">
                ${money(data.total)} ${data.currency}
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding: 20px 30px 8px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="color: #8899aa; font-size: 13px;">Order</td>
                  <td style="color: #00d4ff; font-size: 13px; text-align: right; font-weight: bold;">#${data.orderNumber}</td>
                </tr>
                <tr>
                  <td style="color: #8899aa; font-size: 13px; padding-top: 6px;">Customer</td>
                  <td style="color: #e5e7eb; font-size: 13px; text-align: right; padding-top: 6px;">
                    ${data.customerName}<br>
                    <a href="mailto:${data.customerEmail}" style="color: #22d3ee; text-decoration: none; font-size: 12px;">${data.customerEmail}</a>
                  </td>
                </tr>
                <tr>
                  <td style="color: #8899aa; font-size: 13px; padding-top: 6px;">Paid</td>
                  <td style="color: #b0c4de; font-size: 13px; text-align: right; padding-top: 6px;">${data.paidAt}</td>
                </tr>
                <tr>
                  <td style="color: #8899aa; font-size: 13px; padding-top: 6px;">Payment Intent</td>
                  <td style="color: #b0c4de; font-size: 12px; text-align: right; padding-top: 6px; font-family: ui-monospace, Menlo, Consolas, monospace;">${data.paymentIntentId}</td>
                </tr>
                ${receiptRow}
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding: 12px 30px 0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr style="background-color: #131d35;">
                  <th style="padding: 10px 12px; color: #8899aa; font-size: 11px; text-transform: uppercase; text-align: left;">Product</th>
                  <th style="padding: 10px 12px; color: #8899aa; font-size: 11px; text-transform: uppercase; text-align: center;">Qty</th>
                  <th style="padding: 10px 12px; color: #8899aa; font-size: 11px; text-transform: uppercase; text-align: right;">Unit</th>
                  <th style="padding: 10px 12px; color: #8899aa; font-size: 11px; text-transform: uppercase; text-align: right;">Total</th>
                </tr>
                ${itemRows}
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding: 14px 30px 0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="color: #8899aa; font-size: 13px;">Subtotal</td>
                  <td style="color: #b0c4de; font-size: 13px; text-align: right;">${money(data.subtotal)}</td>
                </tr>
                <tr>
                  <td style="color: #8899aa; font-size: 13px; padding-top: 4px;">Discount</td>
                  <td style="color: #34d399; font-size: 13px; text-align: right; padding-top: 4px;">-${money(data.discount)}</td>
                </tr>
                <tr>
                  <td style="color: #8899aa; font-size: 13px; padding-top: 4px;">Tax</td>
                  <td style="color: #b0c4de; font-size: 13px; text-align: right; padding-top: 4px;">${money(data.taxAmount)}</td>
                </tr>
                <tr>
                  <td style="color: #ffffff; font-size: 15px; font-weight: bold; padding-top: 10px; border-top: 1px solid #1e2a45;">Total paid</td>
                  <td style="color: #00d4ff; font-size: 18px; font-weight: bold; text-align: right; padding-top: 10px; border-top: 1px solid #1e2a45;">${money(data.total)}</td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding: 24px 30px 8px;">
              <h2 style="color: #ffffff; font-size: 14px; margin: 0 0 10px 0;">Licenses issued</h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #131d35; border-radius: 8px;">
                ${licenseRows}
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding: 16px 30px 28px;">
              <p style="color: #6b7280; font-size: 11px; margin: 0; text-align: center;">
                Internal notification &middot; Order ID ${data.orderId}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
