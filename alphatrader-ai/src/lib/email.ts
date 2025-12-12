/**
 * Email service using Resend
 * Documentation: https://resend.com/docs
 *
 * Setup:
 * 1. Sign up at https://resend.com
 * 2. Get API key
 * 3. Add to .env: RESEND_API_KEY=re_xxxxx
 * 4. Verify domain (or use onboarding@resend.dev for testing)
 */

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

export class EmailService {
  private apiKey: string;
  private fromEmail: string;

  constructor() {
    this.apiKey = process.env.RESEND_API_KEY || "";
    this.fromEmail = process.env.EMAIL_FROM || "AlphaTrader AI <noreply@alphatrader.ai>";
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.apiKey) {
      console.warn("⚠️ RESEND_API_KEY not configured. Email not sent.");
      console.log("📧 Would have sent email to:", options.to);
      console.log("📧 Subject:", options.subject);
      return false;
    }

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          from: options.from || this.fromEmail,
          to: Array.isArray(options.to) ? options.to : [options.to],
          subject: options.subject,
          html: options.html,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error("❌ Email sending failed:", error);
        return false;
      }

      const data = await response.json();
      console.log("✅ Email sent successfully:", data.id);
      return true;
    } catch (error) {
      console.error("❌ Email error:", error);
      return false;
    }
  }

  /**
   * Send alert notification email
   */
  async sendAlertNotification(
    userEmail: string,
    userName: string,
    alert: {
      symbol: string;
      alertType: string;
      threshold?: number;
      currentPrice: number;
      message?: string;
    }
  ): Promise<boolean> {
    const subject = `🔔 Alert: ${alert.symbol} ${this.getAlertTypeLabel(alert.alertType)}`;

    const html = this.generateAlertEmail(userName, alert);

    return this.sendEmail({
      to: userEmail,
      subject,
      html,
    });
  }

  /**
   * Send daily portfolio summary email
   */
  async sendPortfolioSummary(
    userEmail: string,
    userName: string,
    summary: {
      totalValue: number;
      dayChange: number;
      dayChangePercent: number;
      totalGain: number;
      totalGainPercent: number;
      topPerformers: Array<{ symbol: string; gainPercent: number }>;
      topLosers: Array<{ symbol: string; gainPercent: number }>;
    }
  ): Promise<boolean> {
    const subject = `📊 Your Daily Portfolio Summary`;

    const html = this.generatePortfolioEmail(userName, summary);

    return this.sendEmail({
      to: userEmail,
      subject,
      html,
    });
  }

  private getAlertTypeLabel(type: string): string {
    switch (type) {
      case "price_above":
        return "Price Above Target";
      case "price_below":
        return "Price Below Target";
      case "percent_change":
        return "Significant Price Movement";
      case "rsi_oversold":
        return "RSI Oversold";
      case "rsi_overbought":
        return "RSI Overbought";
      default:
        return "Alert Triggered";
    }
  }

  private generateAlertEmail(
    userName: string,
    alert: {
      symbol: string;
      alertType: string;
      threshold?: number;
      currentPrice: number;
      message?: string;
    }
  ): string {
    const priceChangeColor = alert.currentPrice > (alert.threshold || 0) ? "#10b981" : "#ef4444";

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Alert Notification</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0f172a; color: #e2e8f0;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #1e293b; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
                      <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700;">🔔 Alert Triggered</h1>
                    </td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <p style="margin: 0 0 20px; font-size: 16px; color: #cbd5e1;">Hi ${userName},</p>

                      <p style="margin: 0 0 30px; font-size: 16px; color: #cbd5e1;">
                        Your alert for <strong style="color: white;">${alert.symbol}</strong> has been triggered!
                      </p>

                      <!-- Alert Details -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #334155; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                        <tr>
                          <td>
                            <table width="100%">
                              <tr>
                                <td style="padding: 10px 0; color: #94a3b8; font-size: 14px;">Alert Type:</td>
                                <td style="padding: 10px 0; color: white; font-size: 14px; text-align: right; font-weight: 600;">
                                  ${this.getAlertTypeLabel(alert.alertType)}
                                </td>
                              </tr>
                              ${alert.threshold ? `
                              <tr>
                                <td style="padding: 10px 0; color: #94a3b8; font-size: 14px;">Threshold:</td>
                                <td style="padding: 10px 0; color: white; font-size: 14px; text-align: right; font-weight: 600;">
                                  $${alert.threshold.toFixed(2)}
                                </td>
                              </tr>
                              ` : ''}
                              <tr>
                                <td style="padding: 10px 0; color: #94a3b8; font-size: 14px;">Current Price:</td>
                                <td style="padding: 10px 0; font-size: 18px; text-align: right; font-weight: 700; color: ${priceChangeColor};">
                                  $${alert.currentPrice.toFixed(2)}
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>

                      ${alert.message ? `
                      <p style="margin: 0 0 30px; font-size: 14px; color: #94a3b8; font-style: italic;">
                        "${alert.message}"
                      </p>
                      ` : ''}

                      <!-- CTA Button -->
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center" style="padding: 20px 0;">
                            <a href="${process.env.NEXTAUTH_URL || 'https://alphatrader.ai'}/stock/${alert.symbol}"
                               style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                              View ${alert.symbol} Details
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="padding: 30px; background-color: #0f172a; text-align: center; border-top: 1px solid #334155;">
                      <p style="margin: 0 0 10px; font-size: 12px; color: #64748b;">
                        You're receiving this email because you have alerts enabled in your AlphaTrader AI account.
                      </p>
                      <p style="margin: 0; font-size: 12px; color: #64748b;">
                        <a href="${process.env.NEXTAUTH_URL || 'https://alphatrader.ai'}/settings" style="color: #10b981; text-decoration: none;">Manage your notification settings</a>
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;
  }

  private generatePortfolioEmail(
    userName: string,
    summary: {
      totalValue: number;
      dayChange: number;
      dayChangePercent: number;
      totalGain: number;
      totalGainPercent: number;
      topPerformers: Array<{ symbol: string; gainPercent: number }>;
      topLosers: Array<{ symbol: string; gainPercent: number }>;
    }
  ): string {
    const dayChangeColor = summary.dayChange >= 0 ? "#10b981" : "#ef4444";
    const dayChangeSign = summary.dayChange >= 0 ? "+" : "";

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Daily Portfolio Summary</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0f172a; color: #e2e8f0;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #1e293b; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
                      <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700;">📊 Portfolio Summary</h1>
                      <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <p style="margin: 0 0 30px; font-size: 16px; color: #cbd5e1;">Hi ${userName},</p>

                      <!-- Portfolio Value -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                        <tr>
                          <td align="center" style="padding: 20px; background-color: #334155; border-radius: 8px;">
                            <p style="margin: 0 0 5px; font-size: 14px; color: #94a3b8;">Total Portfolio Value</p>
                            <p style="margin: 0; font-size: 32px; color: white; font-weight: 700;">
                              $${summary.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                            <p style="margin: 10px 0 0; font-size: 18px; color: ${dayChangeColor}; font-weight: 600;">
                              ${dayChangeSign}$${Math.abs(summary.dayChange).toFixed(2)} (${dayChangeSign}${summary.dayChangePercent.toFixed(2)}%)
                            </p>
                          </td>
                        </tr>
                      </table>

                      <!-- Top Performers -->
                      ${summary.topPerformers.length > 0 ? `
                      <h3 style="margin: 30px 0 15px; font-size: 18px; color: white; font-weight: 600;">🔥 Top Performers</h3>
                      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #334155; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
                        ${summary.topPerformers.map(stock => `
                          <tr>
                            <td style="padding: 8px 0; color: white; font-weight: 600;">${stock.symbol}</td>
                            <td style="padding: 8px 0; color: #10b981; text-align: right; font-weight: 600;">
                              +${stock.gainPercent.toFixed(2)}%
                            </td>
                          </tr>
                        `).join('')}
                      </table>
                      ` : ''}

                      <!-- Top Losers -->
                      ${summary.topLosers.length > 0 ? `
                      <h3 style="margin: 30px 0 15px; font-size: 18px; color: white; font-weight: 600;">📉 Needs Attention</h3>
                      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #334155; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
                        ${summary.topLosers.map(stock => `
                          <tr>
                            <td style="padding: 8px 0; color: white; font-weight: 600;">${stock.symbol}</td>
                            <td style="padding: 8px 0; color: #ef4444; text-align: right; font-weight: 600;">
                              ${stock.gainPercent.toFixed(2)}%
                            </td>
                          </tr>
                        `).join('')}
                      </table>
                      ` : ''}

                      <!-- CTA Button -->
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center" style="padding: 20px 0;">
                            <a href="${process.env.NEXTAUTH_URL || 'https://alphatrader.ai'}/portfolio"
                               style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                              View Full Portfolio
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="padding: 30px; background-color: #0f172a; text-align: center; border-top: 1px solid #334155;">
                      <p style="margin: 0 0 10px; font-size: 12px; color: #64748b;">
                        You're receiving this daily summary because you have portfolio notifications enabled.
                      </p>
                      <p style="margin: 0; font-size: 12px; color: #64748b;">
                        <a href="${process.env.NEXTAUTH_URL || 'https://alphatrader.ai'}/settings" style="color: #10b981; text-decoration: none;">Manage your notification settings</a>
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;
  }
}

// Export singleton instance
export const emailService = new EmailService();
