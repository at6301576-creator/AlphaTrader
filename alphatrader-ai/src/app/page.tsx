import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { PremiumCard } from "@/components/ui/premium-card";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Users,
  DollarSign,
  Activity,
  Target,
} from "lucide-react";

export default async function LandingPage() {
  // If user is already logged in, redirect to dashboard
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Animated background gradient */}
      <div className="fixed inset-0 bg-gradient-animated opacity-30 pointer-events-none" />

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass-strong border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-premium">
                <TrendingUp className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-gradient">
                AlphaTrader AI
              </span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <a
                href="#features"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-smooth"
              >
                Features
              </a>
              <a
                href="#pricing"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-smooth"
              >
                Pricing
              </a>
              <a
                href="#testimonials"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-smooth"
              >
                Testimonials
              </a>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost" className="button-press">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="gradient" size="lg" className="group">
                  Get Started
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center relative z-10">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 glass rounded-full mb-8 fade-in shadow-premium">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">AI-Powered Islamic Stock Analysis</span>
            </div>

            {/* Heading */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 slide-in-left">
              <span className="block mb-2">Invest with</span>
              <span className="text-gradient block">Confidence & Faith</span>
            </h1>

            <p className="text-xl text-muted-foreground mb-12 max-w-3xl mx-auto slide-in-right">
              The ultimate platform for Shariah-compliant stock analysis, powered by advanced AI and comprehensive technical indicators.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 fade-in">
              <Link href="/register">
                <Button variant="gradient" size="lg" className="group px-8 h-12 text-lg">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="#features">
                <Button variant="outline" size="lg" className="px-8 h-12 text-lg">
                  Watch Demo
                </Button>
              </Link>
            </div>

            {/* Hero Preview Cards */}
            <div className="relative max-w-5xl mx-auto fade-in">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-chart-2/20 blur-3xl opacity-50" />

              <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Shariah Compliance Card */}
                <PremiumCard variant="glass" className="group">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 bg-gradient-success rounded-xl shadow-premium">
                        <ShieldCheck className="h-6 w-6 text-white" />
                      </div>
                      <span className="text-sm font-semibold text-success">Shariah Compliant</span>
                    </div>
                    <div className="text-3xl font-bold mb-2">AAPL</div>
                    <div className="text-sm text-muted-foreground">Apple Inc.</div>
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Compliance Score</span>
                        <span className="font-semibold text-success">98%</span>
                      </div>
                    </div>
                  </CardContent>
                </PremiumCard>

                {/* AI Insight Card */}
                <PremiumCard variant="gradient" className="relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-primary opacity-90" />
                  <CardContent className="p-6 relative z-10 text-primary-foreground">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                        <Brain className="h-6 w-6" />
                      </div>
                      <span className="text-sm font-semibold opacity-90">AI Insight</span>
                    </div>
                    <div className="text-2xl font-bold mb-2">Strong Buy</div>
                    <div className="text-sm opacity-90">Confidence: 87%</div>
                    <div className="mt-4 pt-4 border-t border-white/20">
                      <div className="flex items-center gap-2 text-xs opacity-90">
                        <Activity className="h-3 w-3" />
                        <span>12 indicators analyzed</span>
                      </div>
                    </div>
                  </CardContent>
                </PremiumCard>

                {/* Technical Card */}
                <PremiumCard variant="glass" className="group">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 bg-gradient-to-br from-chart-4 to-chart-3 rounded-xl shadow-premium">
                        <LineChart className="h-6 w-6 text-white" />
                      </div>
                      <span className="text-sm font-semibold text-chart-4">Technical</span>
                    </div>
                    <div className="text-2xl font-bold text-success mb-2">Bullish</div>
                    <div className="text-sm text-muted-foreground">RSI: 65 | MACD: +</div>
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Trend Strength</span>
                        <span className="font-semibold text-success">Strong</span>
                      </div>
                    </div>
                  </CardContent>
                </PremiumCard>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center fade-in">
              <div className="text-4xl sm:text-5xl font-bold text-gradient mb-2">10K+</div>
              <div className="text-sm text-muted-foreground">Active Investors</div>
            </div>
            <div className="text-center fade-in" style={{ animationDelay: "100ms" }}>
              <div className="text-4xl sm:text-5xl font-bold text-gradient mb-2">$2.5B+</div>
              <div className="text-sm text-muted-foreground">Assets Tracked</div>
            </div>
            <div className="text-center fade-in" style={{ animationDelay: "200ms" }}>
              <div className="text-4xl sm:text-5xl font-bold text-gradient mb-2">500K+</div>
              <div className="text-sm text-muted-foreground">Analyses Run</div>
            </div>
            <div className="text-center fade-in" style={{ animationDelay: "300ms" }}>
              <div className="text-4xl sm:text-5xl font-bold text-gradient mb-2">98%</div>
              <div className="text-sm text-muted-foreground">Satisfaction Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              Everything You Need
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Powerful tools and insights to make informed investment decisions
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <PremiumCard className="group">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-gradient-success rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-premium">
                  <ShieldCheck className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">Shariah Compliance Screening</h3>
                <p className="text-muted-foreground">
                  Comprehensive screening based on AAOIFI standards. Know instantly if a stock is halal or haram with detailed compliance reports.
                </p>
              </CardContent>
            </PremiumCard>

            {/* Feature 2 */}
            <PremiumCard className="group">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-premium">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">AI-Powered Insights</h3>
                <p className="text-muted-foreground">
                  Advanced machine learning analyzes market trends, sentiment, and patterns to provide actionable investment recommendations.
                </p>
              </CardContent>
            </PremiumCard>

            {/* Feature 3 */}
            <PremiumCard className="group">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-gradient-to-br from-chart-4 to-chart-3 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-premium">
                  <LineChart className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">13 Technical Indicators</h3>
                <p className="text-muted-foreground">
                  Full suite of technical analysis tools including RSI, MACD, Bollinger Bands, ATR, ADX, Stochastic, and more.
                </p>
              </CardContent>
            </PremiumCard>

            {/* Feature 4 */}
            <PremiumCard className="group">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-gradient-to-br from-chart-5 to-chart-2 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-premium">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">Real-Time Charts</h3>
                <p className="text-muted-foreground">
                  Interactive TradingView-powered charts with candlestick, line, and area views. Customize timeframes and overlays.
                </p>
              </CardContent>
            </PremiumCard>

            {/* Feature 5 */}
            <PremiumCard className="group">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-gradient-danger rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-premium">
                  <Bell className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">Smart Alerts</h3>
                <p className="text-muted-foreground">
                  Set custom alerts for price movements, technical indicators, and Shariah compliance changes. Never miss an opportunity.
                </p>
              </CardContent>
            </PremiumCard>

            {/* Feature 6 */}
            <PremiumCard className="group">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-premium">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">Portfolio Optimization</h3>
                <p className="text-muted-foreground">
                  AI-driven portfolio rebalancing and optimization to maximize returns while maintaining Shariah compliance.
                </p>
              </CardContent>
            </PremiumCard>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Choose the plan that fits your investment journey
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Free Plan */}
            <PremiumCard>
              <CardHeader>
                <CardTitle>Starter</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">$0</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
                    <span>Shariah Compliance Check</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
                    <span>Basic Technical Indicators</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
                    <span>5 Watchlist Stocks</span>
                  </li>
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle2 className="h-5 w-5 opacity-30 flex-shrink-0" />
                    <span>AI Insights</span>
                  </li>
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle2 className="h-5 w-5 opacity-30 flex-shrink-0" />
                    <span>Advanced Charts</span>
                  </li>
                </ul>
                <Link href="/register">
                  <Button variant="outline" className="w-full mt-6">
                    Get Started
                  </Button>
                </Link>
              </CardContent>
            </PremiumCard>

            {/* Pro Plan */}
            <PremiumCard variant="glow" className="relative border-2 border-primary">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <div className="bg-gradient-primary text-primary-foreground text-xs font-bold px-4 py-1 rounded-full shadow-premium">
                  MOST POPULAR
                </div>
              </div>
              <CardHeader>
                <CardTitle>Professional</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">$29</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
                    <span>Everything in Starter</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
                    <span>AI-Powered Insights</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
                    <span>All 13 Technical Indicators</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
                    <span>Unlimited Watchlist</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
                    <span>Priority Support</span>
                  </li>
                </ul>
                <Link href="/register">
                  <Button variant="gradient" className="w-full mt-6">
                    Start Free Trial
                  </Button>
                </Link>
              </CardContent>
            </PremiumCard>

            {/* Enterprise Plan */}
            <PremiumCard>
              <CardHeader>
                <CardTitle>Enterprise</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">$99</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
                    <span>Everything in Professional</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
                    <span>Portfolio Optimization</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
                    <span>Advanced Alerts</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
                    <span>API Access</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
                    <span>Dedicated Support</span>
                  </li>
                </ul>
                <Link href="/register">
                  <Button variant="outline" className="w-full mt-6">
                    Contact Sales
                  </Button>
                </Link>
              </CardContent>
            </PremiumCard>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              Trusted by Muslim Investors Worldwide
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              See what our users have to say about their experience
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <PremiumCard className="shine">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center text-primary-foreground font-bold">
                    AK
                  </div>
                  <div>
                    <div className="font-semibold">Ahmed Khan</div>
                    <div className="text-sm text-muted-foreground">Portfolio: $125K</div>
                  </div>
                </div>
                <p className="text-muted-foreground italic">
                  "Finally, a platform that respects both my financial goals and religious values. The AI insights are incredibly accurate!"
                </p>
              </CardContent>
            </PremiumCard>

            <PremiumCard className="shine">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-success rounded-full flex items-center justify-center text-white font-bold">
                    FH
                  </div>
                  <div>
                    <div className="font-semibold">Fatima Hassan</div>
                    <div className="text-sm text-muted-foreground">Portfolio: $89K</div>
                  </div>
                </div>
                <p className="text-muted-foreground italic">
                  "The Shariah compliance screening saves me hours of research. I can invest with confidence knowing everything is halal."
                </p>
              </CardContent>
            </PremiumCard>

            <PremiumCard className="shine">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-chart-4 to-chart-3 rounded-full flex items-center justify-center text-white font-bold">
                    YA
                  </div>
                  <div>
                    <div className="font-semibold">Yusuf Ali</div>
                    <div className="text-sm text-muted-foreground">Portfolio: $210K</div>
                  </div>
                </div>
                <p className="text-muted-foreground italic">
                  "Best investment tool I've used. The technical indicators and alerts help me time my trades perfectly."
                </p>
              </CardContent>
            </PremiumCard>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-primary/10 to-chart-2/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-bold mb-6">
            Ready to Start Investing Smarter?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of Muslim investors making informed, halal investment decisions
          </p>
          <Link href="/register">
            <Button variant="gradient" size="lg" className="px-8 h-14 text-lg">
              Start Your Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-premium">
                  <TrendingUp className="h-6 w-6 text-primary-foreground" />
                </div>
                <span className="text-lg font-bold">AlphaTrader AI</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Empowering Muslim investors with AI-driven, Shariah-compliant stock analysis.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-4">Product</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-smooth">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-smooth">
                    Pricing
                  </a>
                </li>
                <li>
                  <Link href="/scanner" className="text-sm text-muted-foreground hover:text-foreground transition-smooth">
                    Stock Scanner
                  </Link>
                </li>
                <li>
                  <Link href="/screener" className="text-sm text-muted-foreground hover:text-foreground transition-smooth">
                    Screener
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#testimonials" className="text-sm text-muted-foreground hover:text-foreground transition-smooth">
                    Testimonials
                  </a>
                </li>
                <li>
                  <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-smooth">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-smooth">
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-4">Connect</h4>
              <div className="flex gap-3">
                <a
                  href="#"
                  className="p-2 glass rounded-lg hover:bg-muted transition-smooth"
                  aria-label="Twitter"
                >
                  <Twitter className="h-5 w-5" />
                </a>
                <a
                  href="#"
                  className="p-2 glass rounded-lg hover:bg-muted transition-smooth"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="h-5 w-5" />
                </a>
                <a
                  href="#"
                  className="p-2 glass rounded-lg hover:bg-muted transition-smooth"
                  aria-label="GitHub"
                >
                  <Github className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-border text-center">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} AlphaTrader AI. All rights reserved.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Investment involves risk. Past performance is not indicative of future results.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
