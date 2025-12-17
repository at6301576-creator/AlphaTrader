import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  TrendingUp,
  Brain,
  ShieldCheck,
  LineChart,
  Sparkles,
  Bell,
  BarChart3,
  Zap,
  CheckCircle2,
  ArrowRight,
  Github,
  Twitter,
  Linkedin,
} from "lucide-react";

export default async function LandingPage() {
  // If user is already logged in, redirect to dashboard
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-emerald-950">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-gray-950/80 backdrop-blur-xl border-b border-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
                AlphaTrader AI
              </span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-gray-300 hover:text-white transition-colors">
                Features
              </a>
              <a href="#pricing" className="text-sm text-gray-300 hover:text-white transition-colors">
                Pricing
              </a>
              <a href="#about" className="text-sm text-gray-300 hover:text-white transition-colors">
                About
              </a>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-gray-800">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Sparkles className="h-4 w-4 text-emerald-400" />
            <span className="text-sm text-emerald-300">AI-Powered Islamic Stock Analysis</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: '100ms', animationFillMode: 'backwards' }}>
            <span className="bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
              Invest with
            </span>
            <br />
            <span className="bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600 bg-clip-text text-transparent">
              Confidence & Faith
            </span>
          </h1>

          <p className="text-xl text-gray-400 mb-12 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: '200ms', animationFillMode: 'backwards' }}>
            The ultimate platform for Shariah-compliant stock analysis, powered by advanced AI and comprehensive technical indicators.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: '300ms', animationFillMode: 'backwards' }}>
            <Link href="/register">
              <Button size="lg" className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-8 py-6 text-lg group">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline" className="border-gray-700 hover:bg-gray-800 px-8 py-6 text-lg">
                Watch Demo
              </Button>
            </Link>
          </div>

          {/* Hero Image/Preview */}
          <div className="mt-20 animate-in fade-in slide-in-from-bottom-8 duration-1000" style={{ animationDelay: '400ms', animationFillMode: 'backwards' }}>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent z-10" />
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-purple-500/20 blur-3xl" />
              <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm overflow-hidden">
                <CardContent className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gray-950/50 rounded-lg p-6 border border-emerald-500/20">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                          <ShieldCheck className="h-6 w-6 text-emerald-400" />
                        </div>
                        <span className="text-sm font-semibold text-emerald-400">Shariah Compliant</span>
                      </div>
                      <div className="text-3xl font-bold text-white mb-2">AAPL</div>
                      <div className="text-sm text-gray-400">Apple Inc.</div>
                    </div>
                    <div className="bg-gray-950/50 rounded-lg p-6 border border-blue-500/20">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                          <Brain className="h-6 w-6 text-blue-400" />
                        </div>
                        <span className="text-sm font-semibold text-blue-400">AI Insight</span>
                      </div>
                      <div className="text-lg font-semibold text-white mb-2">Strong Buy</div>
                      <div className="text-sm text-gray-400">Confidence: 87%</div>
                    </div>
                    <div className="bg-gray-950/50 rounded-lg p-6 border border-purple-500/20">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-purple-500/10 rounded-lg">
                          <LineChart className="h-6 w-6 text-purple-400" />
                        </div>
                        <span className="text-sm font-semibold text-purple-400">Technical</span>
                      </div>
                      <div className="text-lg font-semibold text-emerald-400 mb-2">Bullish</div>
                      <div className="text-sm text-gray-400">RSI: 65 | MACD: +</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-950/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Everything You Need
              </span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Powerful tools and insights to make informed investment decisions
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <Card className="bg-gray-900/50 border-gray-800 hover:border-emerald-500/50 transition-all duration-300 group">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <ShieldCheck className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Shariah Compliance Screening</h3>
                <p className="text-gray-400">
                  Comprehensive screening based on AAOIFI standards. Know instantly if a stock is halal or haram with detailed compliance reports.
                </p>
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card className="bg-gray-900/50 border-gray-800 hover:border-blue-500/50 transition-all duration-300 group">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">AI-Powered Insights</h3>
                <p className="text-gray-400">
                  Advanced machine learning analyzes market trends, sentiment, and patterns to provide actionable investment recommendations.
                </p>
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card className="bg-gray-900/50 border-gray-800 hover:border-purple-500/50 transition-all duration-300 group">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <LineChart className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">13 Technical Indicators</h3>
                <p className="text-gray-400">
                  Full suite of technical analysis tools including RSI, MACD, Bollinger Bands, ATR, ADX, Stochastic, and more.
                </p>
              </CardContent>
            </Card>

            {/* Feature 4 */}
            <Card className="bg-gray-900/50 border-gray-800 hover:border-yellow-500/50 transition-all duration-300 group">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Real-Time Charts</h3>
                <p className="text-gray-400">
                  Interactive TradingView-powered charts with candlestick, line, and area views. Customize timeframes and overlays.
                </p>
              </CardContent>
            </Card>

            {/* Feature 5 */}
            <Card className="bg-gray-900/50 border-gray-800 hover:border-red-500/50 transition-all duration-300 group">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-red-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Bell className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Smart Alerts</h3>
                <p className="text-gray-400">
                  Set custom alerts for price movements, technical indicators, and Shariah compliance changes. Never miss an opportunity.
                </p>
              </CardContent>
            </Card>

            {/* Feature 6 */}
            <Card className="bg-gray-900/50 border-gray-800 hover:border-emerald-500/50 transition-all duration-300 group">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Portfolio Optimization</h3>
                <p className="text-gray-400">
                  AI-driven portfolio rebalancing and optimization to maximize returns while maintaining Shariah compliance.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Simple, Transparent Pricing
              </span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Choose the plan that fits your investment journey
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Free Plan */}
            <Card className="bg-gray-900/50 border-gray-800 hover:border-gray-700 transition-all duration-300">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold text-white mb-2">Starter</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-white">$0</span>
                  <span className="text-gray-400">/month</span>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2 text-gray-300">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    <span>Shariah Compliance Check</span>
                  </li>
                  <li className="flex items-center gap-2 text-gray-300">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    <span>Basic Technical Indicators</span>
                  </li>
                  <li className="flex items-center gap-2 text-gray-300">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    <span>5 Watchlist Stocks</span>
                  </li>
                  <li className="flex items-center gap-2 text-gray-400">
                    <CheckCircle2 className="h-5 w-5 text-gray-600" />
                    <span>AI Insights</span>
                  </li>
                  <li className="flex items-center gap-2 text-gray-400">
                    <CheckCircle2 className="h-5 w-5 text-gray-600" />
                    <span>Advanced Charts</span>
                  </li>
                </ul>
                <Link href="/register">
                  <Button variant="outline" className="w-full border-gray-700 hover:bg-gray-800">
                    Get Started
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Pro Plan */}
            <Card className="bg-gradient-to-br from-emerald-900/50 to-emerald-950/50 border-emerald-500 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                POPULAR
              </div>
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold text-white mb-2">Professional</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-white">$29</span>
                  <span className="text-gray-400">/month</span>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2 text-gray-300">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    <span>Everything in Starter</span>
                  </li>
                  <li className="flex items-center gap-2 text-gray-300">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    <span>AI-Powered Insights</span>
                  </li>
                  <li className="flex items-center gap-2 text-gray-300">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    <span>All 13 Technical Indicators</span>
                  </li>
                  <li className="flex items-center gap-2 text-gray-300">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    <span>Unlimited Watchlist</span>
                  </li>
                  <li className="flex items-center gap-2 text-gray-300">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    <span>Priority Support</span>
                  </li>
                </ul>
                <Link href="/register">
                  <Button className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700">
                    Start Free Trial
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Enterprise Plan */}
            <Card className="bg-gray-900/50 border-gray-800 hover:border-gray-700 transition-all duration-300">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold text-white mb-2">Enterprise</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-white">$99</span>
                  <span className="text-gray-400">/month</span>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2 text-gray-300">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    <span>Everything in Professional</span>
                  </li>
                  <li className="flex items-center gap-2 text-gray-300">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    <span>Portfolio Optimization</span>
                  </li>
                  <li className="flex items-center gap-2 text-gray-300">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    <span>Advanced Alerts</span>
                  </li>
                  <li className="flex items-center gap-2 text-gray-300">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    <span>API Access</span>
                  </li>
                  <li className="flex items-center gap-2 text-gray-300">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    <span>Dedicated Support</span>
                  </li>
                </ul>
                <Link href="/register">
                  <Button variant="outline" className="w-full border-gray-700 hover:bg-gray-800">
                    Contact Sales
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-emerald-900/20 to-purple-900/20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Ready to Start Investing Smarter?
            </span>
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Join thousands of Muslim investors making informed, halal investment decisions
          </p>
          <Link href="/register">
            <Button size="lg" className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-8 py-6 text-lg">
              Start Your Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 border-t border-gray-800 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-bold text-white">AlphaTrader AI</span>
              </div>
              <p className="text-sm text-gray-400">
                Empowering Muslim investors with AI-driven, Shariah-compliant stock analysis.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2">
                <li><a href="#features" className="text-sm text-gray-400 hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="text-sm text-gray-400 hover:text-white transition-colors">Pricing</a></li>
                <li><Link href="/scanner" className="text-sm text-gray-400 hover:text-white transition-colors">Stock Scanner</Link></li>
                <li><Link href="/screener" className="text-sm text-gray-400 hover:text-white transition-colors">Screener</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2">
                <li><a href="#about" className="text-sm text-gray-400 hover:text-white transition-colors">About Us</a></li>
                <li><a href="/terms" className="text-sm text-gray-400 hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="/privacy" className="text-sm text-gray-400 hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="/contact" className="text-sm text-gray-400 hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Connect</h4>
              <div className="flex gap-3">
                <a href="#" className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors">
                  <Twitter className="h-5 w-5 text-gray-400" />
                </a>
                <a href="#" className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors">
                  <Linkedin className="h-5 w-5 text-gray-400" />
                </a>
                <a href="#" className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors">
                  <Github className="h-5 w-5 text-gray-400" />
                </a>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-800 text-center">
            <p className="text-sm text-gray-400">
              © {new Date().getFullYear()} AlphaTrader AI. All rights reserved.
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Investment involves risk. Past performance is not indicative of future results.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
