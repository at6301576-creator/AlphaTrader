import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, TrendingUp } from "lucide-react";

export default function TermsOfService() {
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
            Terms of Service
          </h1>
          <p className="text-gray-400 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-8 space-y-6 text-gray-300">
              <section>
                <h2 className="text-2xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
                <p>
                  By accessing and using AlphaTrader AI ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these Terms of Service, please do not use the Service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">2. Description of Service</h2>
                <p className="mb-3">
                  AlphaTrader AI provides AI-powered stock analysis tools with a focus on Shariah-compliant investments. The Service includes:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Shariah compliance screening based on AAOIFI standards</li>
                  <li>Technical analysis indicators and charts</li>
                  <li>AI-generated investment insights</li>
                  <li>Portfolio management tools</li>
                  <li>Real-time alerts and notifications</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">3. Investment Disclaimer</h2>
                <p className="mb-3 font-semibold text-yellow-400">
                  IMPORTANT: The information provided by AlphaTrader AI is for informational purposes only and does not constitute financial advice.
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>All investment decisions are made at your own risk</li>
                  <li>Past performance does not guarantee future results</li>
                  <li>You should conduct your own research or consult with a qualified financial advisor</li>
                  <li>AlphaTrader AI is not responsible for any investment losses</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">4. Shariah Compliance</h2>
                <p className="mb-3">
                  While we strive to provide accurate Shariah compliance information based on AAOIFI standards:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Compliance determinations are automated and may not reflect all scholarly opinions</li>
                  <li>Users should verify compliance with their own religious scholars if needed</li>
                  <li>We are not responsible for any religious or ethical decisions made based on our data</li>
                  <li>Different Islamic scholars may have varying opinions on stock compliance</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">5. User Accounts</h2>
                <p className="mb-3">
                  To access certain features of the Service, you must create an account:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>You must provide accurate and complete information</li>
                  <li>You are responsible for maintaining the security of your account</li>
                  <li>You are responsible for all activities under your account</li>
                  <li>Notify us immediately of any unauthorized use</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">6. Subscription and Billing</h2>
                <p className="mb-3">
                  For paid subscriptions:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Subscriptions auto-renew unless canceled</li>
                  <li>Fees are charged in advance on a monthly or annual basis</li>
                  <li>No refunds for partial months or unused features</li>
                  <li>We reserve the right to change pricing with 30 days notice</li>
                  <li>You can cancel your subscription at any time</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">7. Prohibited Uses</h2>
                <p className="mb-3">
                  You agree not to:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Use the Service for any illegal purpose</li>
                  <li>Violate any laws in your jurisdiction</li>
                  <li>Infringe on intellectual property rights</li>
                  <li>Transmit any malicious code or viruses</li>
                  <li>Attempt to gain unauthorized access to the Service</li>
                  <li>Scrape, crawl, or otherwise extract data through automated means</li>
                  <li>Resell or redistribute the Service without permission</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">8. Intellectual Property</h2>
                <p>
                  All content, features, and functionality of the Service are owned by AlphaTrader AI and are protected by international copyright, trademark, and other intellectual property laws. You may not reproduce, distribute, or create derivative works without our express written permission.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">9. Data Accuracy</h2>
                <p>
                  While we strive for accuracy, we do not guarantee that all data provided through the Service is accurate, complete, or up-to-date. Market data, stock prices, and company information may be delayed or contain errors. Always verify critical information through official sources.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">10. Limitation of Liability</h2>
                <p>
                  To the maximum extent permitted by law, AlphaTrader AI shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including lost profits, data, or other intangible losses resulting from your use of the Service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">11. Termination</h2>
                <p className="mb-3">
                  We reserve the right to:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Suspend or terminate your account for violation of these terms</li>
                  <li>Modify or discontinue the Service at any time</li>
                  <li>Refuse service to anyone for any reason</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">12. Changes to Terms</h2>
                <p>
                  We reserve the right to modify these terms at any time. We will notify users of any material changes via email or through the Service. Continued use of the Service after changes constitutes acceptance of the modified terms.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">13. Governing Law</h2>
                <p>
                  These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which AlphaTrader AI operates, without regard to its conflict of law provisions.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">14. Contact Information</h2>
                <p>
                  If you have any questions about these Terms, please contact us at:
                  <br />
                  <a href="mailto:legal@alphatrader.ai" className="text-emerald-400 hover:text-emerald-300">
                    legal@alphatrader.ai
                  </a>
                </p>
              </section>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
