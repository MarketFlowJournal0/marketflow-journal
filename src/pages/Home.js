import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTradingContext } from '../context/TradingContext';

function Home() {
  const navigate = useNavigate();
  const { trades, globalStats } = useTradingContext();
  const [activePricing, setActivePricing] = useState('monthly');

  // Features data
  const features = [
    {
      icon: '📊',
      title: 'Advanced Analytics',
      description: 'Institutional-grade performance metrics with Monte Carlo simulations and risk analysis',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      icon: '🧠',
      title: 'AI Psychology Analysis',
      description: 'Behavioral pattern detection with emotional intelligence scoring and insights',
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      icon: '💰',
      title: 'Equity Tracking',
      description: 'Real-time equity curve with drawdown analysis and 6-month projections',
      gradient: 'from-green-500 to-emerald-500',
    },
    {
      icon: '🎯',
      title: 'Confluence Detection',
      description: 'Automatic setup identification with performance scoring and optimization',
      gradient: 'from-yellow-500 to-orange-500',
    },
    {
      icon: '📅',
      title: 'Smart Calendar',
      description: 'Interactive trading calendar with daily performance visualization',
      gradient: 'from-red-500 to-rose-500',
    },
    {
      icon: '⚡',
      title: 'Lightning Fast',
      description: 'Built with React and optimized for speed with instant data processing',
      gradient: 'from-indigo-500 to-purple-500',
    },
  ];

  // Pricing plans
  const pricingPlans = [
    {
      name: 'Starter',
      price: activePricing === 'monthly' ? '29' : '290',
      period: activePricing === 'monthly' ? '/month' : '/year',
      description: 'Perfect for individual traders starting their journey',
      features: [
        '✅ Up to 500 trades',
        '✅ Basic analytics',
        '✅ Equity tracking',
        '✅ Calendar view',
        '❌ AI Psychology',
        '❌ Advanced confluences',
        '❌ Monte Carlo projections',
      ],
      gradient: 'from-blue-500 to-cyan-500',
      popular: false,
    },
    {
      name: 'Professional',
      price: activePricing === 'monthly' ? '79' : '790',
      period: activePricing === 'monthly' ? '/month' : '/year',
      description: 'For serious traders who need advanced tools',
      features: [
        '✅ Unlimited trades',
        '✅ Advanced analytics',
        '✅ AI Psychology analysis',
        '✅ Confluence detection',
        '✅ Monte Carlo projections',
        '✅ Priority support',
        '✅ Export to PDF/Excel',
      ],
      gradient: 'from-purple-500 to-pink-500',
      popular: true,
    },
    {
      name: 'Enterprise',
      price: activePricing === 'monthly' ? '199' : '1990',
      period: activePricing === 'monthly' ? '/month' : '/year',
      description: 'For trading teams and prop firms',
      features: [
        '✅ Everything in Professional',
        '✅ Team collaboration',
        '✅ Multi-account management',
        '✅ Custom integrations',
        '✅ API access',
        '✅ White-label option',
        '✅ Dedicated account manager',
      ],
      gradient: 'from-yellow-500 to-orange-500',
      popular: false,
    },
  ];

  // Testimonials
  const testimonials = [
    {
      name: 'John Smith',
      role: 'Professional Day Trader',
      avatar: '👨‍💼',
      comment: 'MarketFlow transformed my trading. The psychology analysis alone is worth 10x the price. My win rate improved by 23% in 3 months!',
      rating: 5,
    },
    {
      name: 'Sarah Johnson',
      role: 'Prop Trader',
      avatar: '👩‍💻',
      comment: 'The Monte Carlo projections help me plan my risk management perfectly. Best trading journal I\'ve ever used.',
      rating: 5,
    },
    {
      name: 'Mike Chen',
      role: 'Swing Trader',
      avatar: '🧑‍💼',
      comment: 'Finally, a journal that understands trader psychology. The AI insights are spot-on and have saved me from revenge trading multiple times.',
      rating: 5,
    },
  ];

  // Stats animation
  const stats = [
    { label: 'Active Traders', value: '10,000+', icon: '👥' },
    { label: 'Trades Analyzed', value: '5M+', icon: '📊' },
    { label: 'Win Rate Improvement', value: '+18%', icon: '📈' },
    { label: 'Customer Satisfaction', value: '98%', icon: '⭐' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative overflow-hidden pt-20 pb-32 px-8"
      >
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0],
            }}
            transition={{ duration: 20, repeat: Infinity }}
            className="absolute -top-1/2 -left-1/4 w-96 h-96 bg-[#60A5FA] rounded-full mix-blend-multiply filter blur-3xl opacity-20"
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              rotate: [90, 0, 90],
            }}
            transition={{ duration: 20, repeat: Infinity }}
            className="absolute -bottom-1/2 -right-1/4 w-96 h-96 bg-[#8B5CF6] rounded-full mix-blend-multiply filter blur-3xl opacity-20"
          />
        </div>

        <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-6"
            >
              <span className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-bold text-sm mb-8">
                🚀 The Ultimate Trading Journal
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 mb-6 leading-tight"
            >
              Trade Smarter.<br />Win Consistently.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-2xl text-[#CBD5E0] mb-12 max-w-3xl mx-auto leading-relaxed"
            >
              Professional trading journal with AI-powered psychology analysis, institutional-grade analytics, and Monte Carlo projections.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex items-center justify-center space-x-6"
            >
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(59, 130, 246, 0.6)" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/all-trades')}
                className="px-12 py-5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-black text-xl shadow-2xl"
              >
                Start Trading Now →
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-12 py-5 bg-[#1E2536] bg-opacity-50 backdrop-blur-xl text-white rounded-xl font-bold text-xl border-2 border-[#2D3548] hover:border-gray-500 transition"
              >
                Watch Demo 🎥
              </motion.button>
            </motion.div>
          </div>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="grid grid-cols-4 gap-6"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                whileHover={{ scale: 1.05, y: -10 }}
                className="bg-[#1E2536] bg-opacity-50 backdrop-blur-xl rounded-2xl p-6 border border-[#2D3548] text-center"
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 2, delay: index * 0.2 }}
                  className="text-5xl mb-3"
                >
                  {stat.icon}
                </motion.div>
                <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-2">
                  {stat.value}
                </div>
                <div className="text-[#A0AEC0] text-sm font-semibold">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="py-24 px-8 bg-[#1A1F2E] bg-opacity-50"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-5xl font-black text-white mb-4"
            >
              Everything You Need to Succeed
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-xl text-[#A0AEC0]"
            >
              Professional tools designed for serious traders
            </motion.p>
          </div>

          <div className="grid grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05, y: -10 }}
                className={`bg-gradient-to-br ${feature.gradient} bg-opacity-10 backdrop-blur-xl rounded-2xl p-8 border border-[#2D3548] hover:border-gray-500 transition-all`}
              >
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 5, delay: index * 0.3 }}
                  className="text-6xl mb-4"
                >
                  {feature.icon}
                </motion.div>
                <h3 className="text-2xl font-black text-white mb-3">{feature.title}</h3>
                <p className="text-[#CBD5E0] leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Pricing Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="py-24 px-8"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-5xl font-black text-white mb-4"
            >
              Simple, Transparent Pricing
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-xl text-[#A0AEC0] mb-8"
            >
              Choose the plan that fits your trading style
            </motion.p>

            {/* Pricing Toggle */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="inline-flex items-center bg-[#1E2536] bg-opacity-50 backdrop-blur-xl rounded-full p-2 border border-[#2D3548]"
            >
              <button
                onClick={() => setActivePricing('monthly')}
                className={`px-8 py-3 rounded-full font-bold transition-all ${
                  activePricing === 'monthly'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                    : 'text-[#A0AEC0]'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setActivePricing('yearly')}
                className={`px-8 py-3 rounded-full font-bold transition-all ${
                  activePricing === 'yearly'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                    : 'text-[#A0AEC0]'
                }`}
              >
                Yearly
                <span className="ml-2 px-2 py-1 bg-green-500 text-white text-xs rounded-full">Save 20%</span>
              </button>
            </motion.div>
          </div>

          <div className="grid grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05, y: -10 }}
                className={`relative bg-[#1E2536] bg-opacity-50 backdrop-blur-xl rounded-2xl p-8 border-2 ${
                  plan.popular ? 'border-purple-500' : 'border-[#2D3548]'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-bold text-sm shadow-xl">
                      ⭐ Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-3xl font-black text-white mb-2">{plan.name}</h3>
                  <p className="text-[#A0AEC0] text-sm mb-6">{plan.description}</p>
                  <div className="mb-6">
                    <span className={`text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r ${plan.gradient}`}>
                      ${plan.price}
                    </span>
                    <span className="text-[#A0AEC0] text-xl">{plan.period}</span>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`w-full px-8 py-4 rounded-xl font-black text-lg shadow-xl ${
                      plan.popular
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                        : 'bg-[#252D42] text-white hover:bg-[#2D3548]'
                    }`}
                  >
                    Get Started →
                  </motion.button>
                </div>

                <div className="space-y-3">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <span className="text-lg">{feature.split(' ')[0]}</span>
                      <span className="text-[#CBD5E0] text-sm">{feature.substring(2)}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Testimonials Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="py-24 px-8 bg-[#1A1F2E] bg-opacity-50"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-5xl font-black text-white mb-4"
            >
              Loved by Traders Worldwide
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-xl text-[#A0AEC0]"
            >
              See what our customers are saying
            </motion.p>
          </div>

          <div className="grid grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05, y: -10 }}
                className="bg-[#1E2536] bg-opacity-50 backdrop-blur-xl rounded-2xl p-8 border border-[#2D3548]"
              >
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <span key={i} className="text-[#FBBF24] text-2xl">⭐</span>
                  ))}
                </div>
                <p className="text-[#CBD5E0] mb-6 leading-relaxed italic">"{testimonial.comment}"</p>
                <div className="flex items-center space-x-4">
                  <div className="text-5xl">{testimonial.avatar}</div>
                  <div>
                    <div className="text-white font-bold text-lg">{testimonial.name}</div>
                    <div className="text-[#A0AEC0] text-sm">{testimonial.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="py-24 px-8"
      >
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-3xl p-16 text-center shadow-2xl"
          >
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-5xl font-black text-white mb-6"
            >
              Ready to Transform Your Trading?
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-2xl text-white mb-10 opacity-90"
            >
              Join 10,000+ traders using MarketFlow to achieve consistent profitability
            </motion.p>
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              whileHover={{ scale: 1.1, boxShadow: "0 0 40px rgba(255, 255, 255, 0.5)" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/all-trades')}
              className="px-16 py-6 bg-white text-purple-600 rounded-xl font-black text-2xl shadow-2xl"
            >
              Start Free Trial →
            </motion.button>
            <p className="text-white text-sm mt-6 opacity-75">No credit card required • 14-day free trial</p>
          </motion.div>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="py-12 px-8 border-t border-[#252D42]">
        <div className="max-w-7xl mx-auto text-center">
          <div className="text-[#A0AEC0] mb-4">
            © 2024 MarketFlow Journal. All rights reserved.
          </div>
          <div className="flex items-center justify-center space-x-8 text-[#718096]">
            <a href="#" className="hover:text-white transition">Privacy Policy</a>
            <a href="#" className="hover:text-white transition">Terms of Service</a>
            <a href="#" className="hover:text-white transition">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;