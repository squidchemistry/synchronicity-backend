import { Link } from 'react-router-dom';
import { 
  ChartBarIcon, 
  CpuChipIcon, 
  ChatBubbleLeftRightIcon,
  BriefcaseIcon,
  ArrowRightIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

const features = [
  {
    name: 'Real-Time Crypto Data',
    description: 'Live cryptocurrency prices, charts, and analytics with professional presentation.',
    icon: ChartBarIcon,
  },
  {
    name: 'Portfolio Tracking',
    description: 'Add and monitor your crypto investments. See profits, losses, and trends.',
    icon: BriefcaseIcon,
  },
  {
    name: 'AI-Powered Tools',
    description: 'Trading signals, predictions, and AI assistant for decision-making.',
    icon: CpuChipIcon,
  },
  {
    name: 'Synchronicity Community',
    description: 'Discord-like servers focused on AI & crypto. Share insights and interact.',
    icon: ChatBubbleLeftRightIcon,
  },
];

const benefits = [
  'Real-time cryptocurrency market data',
  'Advanced portfolio analytics',
  'AI-powered trading insights',
  'Community-driven discussions',
  'Professional-grade charts',
  'Risk assessment tools',
];

const HomePage = () => {
  return (
    <div className="min-h-screen bg-gray-950">
      {/* Navigation */}
      <nav className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <span className="ml-3 text-xl font-bold gradient-text">
                Synchronicity
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="text-gray-300 hover:text-white transition-colors"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="btn-primary btn-md"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/20 via-gray-950 to-gray-950" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
              Your AI & Cryptocurrency
              <span className="gradient-text block">Platform</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Synchronicity brings seamless connections between people, markets, and intelligence systems. 
              Track crypto, get AI insights, and connect with the community.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="btn-primary btn-lg group"
              >
                Start Your Journey
                <ArrowRightIcon className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/login"
                className="btn-secondary btn-lg"
              >
                Sign In
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Everything You Need in One Platform
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              AI + Crypto + Community in one ecosystem. 
              Experience meaningful coincidences in your trading journey.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="card p-8 hover:border-primary-500/50 transition-colors"
              >
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-primary-500/10 rounded-lg flex items-center justify-center">
                    <feature.icon className="h-6 w-6 text-primary-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white ml-4">
                    {feature.name}
                  </h3>
                </div>
                <p className="text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
                Why Choose Synchronicity?
              </h2>
              <p className="text-lg text-gray-400 mb-8">
                Our platform synchronizes different technologies to create meaningful 
                value in your cryptocurrency journey. Just like Jung's synchronicity 
                concept, we bring together meaningful coincidences in data, AI, and community.
              </p>
              
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={benefit}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="flex items-center"
                  >
                    <CheckIcon className="h-5 w-5 text-success-400 mr-3 flex-shrink-0" />
                    <span className="text-gray-300">{benefit}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="card p-8 bg-gradient-to-br from-primary-900/20 to-gray-900">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-white font-bold text-2xl">S</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">
                    Join the Platform
                  </h3>
                  <p className="text-gray-400 mb-6">
                    Experience the synchronicity of AI, crypto, and community. 
                    Start your journey today.
                  </p>
                  <Link
                    to="/register"
                    className="btn-primary btn-lg w-full"
                  >
                    Get Started Now
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col items-center">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <span className="ml-3 text-xl font-bold gradient-text">
                Synchronicity
              </span>
            </div>
            <p className="text-gray-400 text-center max-w-md">
              AI & Cryptocurrency platform designed to bring seamless connections 
              between people, markets, and intelligence systems.
            </p>
            <div className="mt-8 text-sm text-gray-500">
              © 2024 Synchronicity Platform. Built with ❤️ by the Synchronicity Team.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;