/**
 * Order Confirmation Email Template
 *
 * Generates HTML and text versions of order confirmation emails.
 */

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface OrderConfirmationData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  shippingAddress?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  billingAddress?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
}

/**
 * Generate HTML email for order confirmation
 */
export function generateOrderConfirmationEmail(data: OrderConfirmationData): string {
  const itemsHtml = data.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">${item.name}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">$${item.total.toFixed(2)}</td>
      </tr>
    `
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #f9f9f9; padding: 20px; border-radius: 8px;">
    <h1 style="color: #333; margin-bottom: 10px;">Order Confirmed!</h1>
    <p style="color: #666;">Thank you for your order, ${data.customerName}!</p>
    <p style="color: #666;">Your order number is: <strong>#${data.orderNumber}</strong></p>
  </div>

  <div style="margin-top: 30px;">
    <h2 style="color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px;">Order Details</h2>
    <table style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr style="background: #f5f5f5;">
          <th style="padding: 12px; text-align: left;">Item</th>
          <th style="padding: 12px; text-align: center;">Qty</th>
          <th style="padding: 12px; text-align: right;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="2" style="padding: 12px; text-align: right;">Subtotal:</td>
          <td style="padding: 12px; text-align: right;">$${data.subtotal.toFixed(2)}</td>
        </tr>
        <tr>
          <td colspan="2" style="padding: 12px; text-align: right;">Shipping:</td>
          <td style="padding: 12px; text-align: right;">$${data.shipping.toFixed(2)}</td>
        </tr>
        <tr>
          <td colspan="2" style="padding: 12px; text-align: right;">Tax:</td>
          <td style="padding: 12px; text-align: right;">$${data.tax.toFixed(2)}</td>
        </tr>
        <tr style="font-weight: bold; font-size: 1.1em;">
          <td colspan="2" style="padding: 12px; text-align: right; border-top: 2px solid #333;">Total:</td>
          <td style="padding: 12px; text-align: right; border-top: 2px solid #333;">$${data.total.toFixed(2)}</td>
        </tr>
      </tfoot>
    </table>
  </div>

  ${
    data.shippingAddress
      ? `
  <div style="margin-top: 30px;">
    <h2 style="color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px;">Shipping Address</h2>
    <p style="color: #666; margin: 0;">
      ${data.shippingAddress.line1}<br>
      ${data.shippingAddress.line2 ? data.shippingAddress.line2 + '<br>' : ''}
      ${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.postalCode}<br>
      ${data.shippingAddress.country}
    </p>
  </div>
  `
      : ''
  }

  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 0.9em;">
    <p>If you have any questions about your order, please contact us.</p>
  </div>
</body>
</html>
  `;
}

/**
 * Generate plain text email for order confirmation
 */
export function generateOrderConfirmationText(data: OrderConfirmationData): string {
  const itemsText = data.items
    .map((item) => `  - ${item.name} (x${item.quantity}): $${item.total.toFixed(2)}`)
    .join('\n');

  let text = `
ORDER CONFIRMED!

Thank you for your order, ${data.customerName}!
Your order number is: #${data.orderNumber}

ORDER DETAILS
-------------
${itemsText}

Subtotal: $${data.subtotal.toFixed(2)}
Shipping: $${data.shipping.toFixed(2)}
Tax: $${data.tax.toFixed(2)}
Total: $${data.total.toFixed(2)}
`;

  if (data.shippingAddress) {
    text += `
SHIPPING ADDRESS
----------------
${data.shippingAddress.line1}
${data.shippingAddress.line2 ? data.shippingAddress.line2 + '\n' : ''}${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.postalCode}
${data.shippingAddress.country}
`;
  }

  text += `
If you have any questions about your order, please contact us.
`;

  return text.trim();
}
