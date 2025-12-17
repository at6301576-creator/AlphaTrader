import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, TrendingUp } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-emerald-950">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-gray-950/80 backdrop-blur-xl border-b border-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
                AlphaTrader AI
              </span>
            </Link>
            <Link href="/">
              <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-gray-800">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Privacy Policy
          </h1>
          <p className="text-gray-400 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-8 space-y-6 text-gray-300">
              <section>
                <h2 className="text-2xl font-bold text-white mb-4">1. Introduction</h2>
                <p>
                  AlphaTrader AI ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">2. Information We Collect</h2>

                <h3 className="text-xl font-semibold text-white mt-4 mb-2">2.1 Personal Information</h3>
                <p className="mb-3">We may collect the following personal information:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Name and email address</li>
                  <li>Account credentials (encrypted passwords)</li>
                  <li>Payment information (processed securely through third-party providers)</li>
                  <li>Profile information you choose to provide</li>
                </ul>

                <h3 className="text-xl font-semibold text-white mt-4 mb-2">2.2 Usage Data</h3>
                <p className="mb-3">We automatically collect certain information:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>IP address and device information</li>
                  <li>Browser type and version</li>
                  <li>Pages visited and time spent on pages</li>
                  <li>Stocks viewed and searched</li>
                  <li>Features used and interactions with the Service</li>
                  <li>Error logs and performance data</li>
                </ul>

                <h3 className="text-xl font-semibold text-white mt-4 mb-2">2.3 Financial Data</h3>
                <p className="mb-3">We may collect and store:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Watchlist stocks and portfolios you create</li>
                  <li>Alert preferences and settings</li>
                  <li>Investment preferences (risk tolerance, goals, etc.)</li>
                  <li>Historical interactions with the platform</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">3. How We Use Your Information</h2>
                <p className="mb-3">We use your information to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Provide and maintain the Service</li>
                  <li>Process transactions and send related information</li>
                  <li>Send you alerts and notifications you've requested</li>
                  <li>Provide customer support</li>
                  <li>Improve and personalize your experience</li>
                  <li>Develop new features and services</li>
                  <li>Detect and prevent fraud or abuse</li>
                  <li>Comply with legal obligations</li>
                  <li>Send marketing communications (with your consent)</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">4. AI and Machine Learning</h2>
                <p className="mb-3">
                  Our AI-powered features analyze your usage patterns and preferences to:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Provide personalized stock recommendations</li>
                  <li>Generate investment insights tailored to your profile</li>
                  <li>Optimize portfolio suggestions</li>
                  <li>Improve alert accuracy and relevance</li>
                </ul>
                <p className="mt-3">
                  All AI processing is done in accordance with this Privacy Policy, and your data is never shared with third parties for their AI training purposes.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">5. Data Sharing and Disclosure</h2>

                <h3 className="text-xl font-semibold text-white mt-4 mb-2">5.1 Third-Party Service Providers</h3>
                <p className="mb-3">We may share your information with:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Payment processors (Stripe, PayPal, etc.)</li>
                  <li>Cloud hosting providers</li>
                  <li>Analytics services (Google Analytics, etc.)</li>
                  <li>Email service providers</li>
                  <li>Customer support tools</li>
                </ul>

                <h3 className="text-xl font-semibold text-white mt-4 mb-2">5.2 Legal Requirements</h3>
                <p>We may disclose your information if required by law, court order, or government regulation, or if we believe disclosure is necessary to protect our rights or the safety of others.</p>

                <h3 className="text-xl font-semibold text-white mt-4 mb-2">5.3 Business Transfers</h3>
                <p>If we are involved in a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction.</p>

                <h3 className="text-xl font-semibold text-white mt-4 mb-2">5.4 What We Don't Share</h3>
                <p className="mb-3 font-semibold text-emerald-400">We will never:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Sell your personal information to third parties</li>
                  <li>Share your portfolio holdings publicly without your consent</li>
                  <li>Use your data for purposes unrelated to the Service</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">6. Data Security</h2>
                <p className="mb-3">We implement industry-standard security measures including:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Encryption of data in transit (SSL/TLS)</li>
                  <li>Encryption of sensitive data at rest</li>
                  <li>Regular security audits and updates</li>
                  <li>Access controls and authentication</li>
                  <li>Monitoring for suspicious activity</li>
                </ul>
                <p className="mt-3">
                  However, no method of transmission over the Internet is 100% secure. While we strive to protect your data, we cannot guarantee absolute security.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">7. Data Retention</h2>
                <p>
                  We retain your personal information for as long as your account is active or as needed to provide services. After account deletion, we may retain certain information for:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4 mt-3">
                  <li>Legal compliance and tax purposes (typically 7 years)</li>
                  <li>Resolving disputes</li>
                  <li>Enforcing our agreements</li>
                  <li>Preventing fraud</li>
                </ul>
                <p className="mt-3">
                  Aggregated, anonymized data may be retained indefinitely for analytics and product improvement.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">8. Your Rights and Choices</h2>
                <p className="mb-3">You have the right to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Access:</strong> Request a copy of your personal data</li>
                  <li><strong>Correction:</strong> Update or correct your information</li>
                  <li><strong>Deletion:</strong> Request deletion of your account and data</li>
                  <li><strong>Portability:</strong> Receive your data in a portable format</li>
                  <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
                  <li><strong>Object:</strong> Object to certain processing of your data</li>
                </ul>
                <p className="mt-3">
                  To exercise these rights, contact us at <a href="mailto:privacy@alphatrader.ai" className="text-emerald-400 hover:text-emerald-300">privacy@alphatrader.ai</a>
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">9. Cookies and Tracking</h2>
                <p className="mb-3">We use cookies and similar technologies to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Keep you logged in</li>
                  <li>Remember your preferences</li>
                  <li>Analyze usage patterns</li>
                  <li>Provide personalized content</li>
                </ul>
                <p className="mt-3">
                  You can control cookies through your browser settings, but disabling cookies may limit functionality.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">10. International Data Transfers</h2>
                <p>
                  Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your data in accordance with this Privacy Policy.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">11. Children's Privacy</h2>
                <p>
                  Our Service is not intended for individuals under 18 years of age. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">12. Changes to This Policy</h2>
                <p>
                  We may update this Privacy Policy from time to time. We will notify you of material changes via email or through a prominent notice on the Service. Your continued use after changes constitutes acceptance of the updated policy.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">13. Contact Us</h2>
                <p className="mb-3">
                  If you have questions or concerns about this Privacy Policy, please contact us:
                </p>
                <div className="bg-gray-950/50 p-4 rounded-lg">
                  <p><strong>Email:</strong> <a href="mailto:privacy@alphatrader.ai" className="text-emerald-400 hover:text-emerald-300">privacy@alphatrader.ai</a></p>
                  <p><strong>Data Protection Officer:</strong> <a href="mailto:dpo@alphatrader.ai" className="text-emerald-400 hover:text-emerald-300">dpo@alphatrader.ai</a></p>
                </div>
              </section>

              <section className="mt-8 p-4 bg-emerald-900/20 border border-emerald-500/30 rounded-lg">
                <p className="text-sm text-emerald-300">
                  <strong>Your Privacy Matters:</strong> We are committed to transparency and protecting your personal information. If you ever have concerns about how your data is being used, please don't hesitate to reach out.
                </p>
              </section>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
