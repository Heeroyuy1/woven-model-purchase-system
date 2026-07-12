interface Product {
  name: string;
  quantity: number;
  price: number;
}

interface OrderConfirmationData {
  name: string;
  orderNumber: string;
  date: string;
  products: Product[];
  total: number;
}

export function orderConfirmationHtml(data: OrderConfirmationData): string {
  const productRows = data.products
    .map(
      (p) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #1e2a45; color: #b0c4de;">${p.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #1e2a45; color: #b0c4de; text-align: center;">${p.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #1e2a45; color: #b0c4de; text-align: right;">$${p.price.toFixed(2)}</td>
      </tr>`
    )
    .join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin: 0; padding: 0; background-color: #0a0f1e; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0f1e; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #0d1428; border-radius: 12px; border: 1px solid #1e2a45;">
          <tr>
            <td style="padding: 30px 30px 0 30px;">
              <h1 style="color: #00d4ff; font-size: 24px; margin: 0;">Order Confirmed ✓</h1>
              <p style="color: #8899aa; font-size: 14px; margin: 8px 0 0 0;">Thank you for your purchase, ${data.name}.</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="color: #8899aa; font-size: 13px;">Order Number</td>
                  <td style="color: #00d4ff; font-size: 13px; text-align: right; font-weight: bold;">#${data.orderNumber}</td>
                </tr>
                <tr>
                  <td style="color: #8899aa; font-size: 13px; padding-top: 6px;">Date</td>
                  <td style="color: #b0c4de; font-size: 13px; text-align: right; padding-top: 6px;">${data.date}</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 30px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr style="background-color: #131d35;">
                  <th style="padding: 10px; color: #8899aa; font-size: 12px; text-transform: uppercase; text-align: left;">Product</th>
                  <th style="padding: 10px; color: #8899aa; font-size: 12px; text-transform: uppercase; text-align: center;">Qty</th>
                  <th style="padding: 10px; color: #8899aa; font-size: 12px; text-transform: uppercase; text-align: right;">Price</th>
                </tr>
                ${productRows}
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 15px 30px 30px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="color: #8899aa; font-size: 16px;">Total</td>
                  <td style="color: #00d4ff; font-size: 20px; text-align: right; font-weight: bold;">$${data.total.toFixed(2)}</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 30px; background-color: #0a0f1e; border-radius: 0 0 12px 12px;">
              <p style="color: #8899aa; font-size: 12px; margin: 0; text-align: center;">
                You will receive your license keys shortly. If you have any questions, contact
                <a href="mailto:support@wovenmodel.com" style="color: #00d4ff; text-decoration: none;">support@wovenmodel.com</a>
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