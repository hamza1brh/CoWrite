import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { FileText, Users, Zap, Shield, ArrowRight } from "lucide-react";
import { useRouter } from "next/router";
import { useEffect } from "react";
import Link from "next/link";

export default function Welcome() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isLoaded = status !== "loading";

  // Redirect authenticated users to dashboard (home page)
  useEffect(() => {
    if (isLoaded && session?.user) {
      router.replace("/");
    }
  }, [isLoaded, session, router]);

  // Show loading while checking auth
  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Don't render if user is authenticated (they'll be redirected)
  if (session?.user) {
    return null;
  }

  const features = [
    {
      icon: FileText,
      title: "Rich Text Editing",
      description:
        "Powerful editor with real-time formatting and collaboration",
    },
    {
      icon: Users,
      title: "Real-time Collaboration",
      description: "Work together with your team in real-time",
    },
    {
      icon: Zap,
      title: "Fast & Responsive",
      description: "Lightning-fast performance with instant sync",
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Your documents are encrypted and secure",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800">
      {/* Navigation Header */}
      <nav className="container mx-auto flex items-center justify-between px-6 py-4">
        <div className="text-2xl font-bold text-slate-900 dark:text-white">
          <span className="text-gradient">CoWrite</span>
        </div>
        <div className="flex items-center space-x-4">
          <Link href="/sign-in">
            <Button
              variant="ghost"
              className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
            >
              Sign In
            </Button>
          </Link>
          <Link href="/sign-up">
            <Button className="bg-blue-600 text-white hover:bg-blue-700">
              Get Started
            </Button>
          </Link>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-12">
        {/* Hero Section */}
        <motion.div
          className="mb-16 text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="mb-6 text-5xl font-bold text-slate-900 dark:text-white md:text-6xl">
            Collaborate on documents <br />
            <span className="text-gradient">in real-time</span>
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-xl text-slate-600 dark:text-slate-300">
            Create, edit, and share documents with your team. See changes as
            they happen with powerful real-time collaboration features.
          </p>

          <div className="flex flex-col items-center justify-center space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
            <Link href="/sign-up">
              <Button
                size="lg"
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 sm:w-auto"
              >
                Start Collaborating
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>

            <Link href="/sign-in">
              <Button
                size="lg"
                variant="outline"
                className="w-full border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800 sm:w-auto"
              >
                Sign In to Continue
              </Button>
            </Link>
          </div>

          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            Free to get started • No credit card required
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          className="mb-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              className="glass-effect rounded-xl p-6 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
            >
              <feature.icon className="mx-auto mb-4 h-12 w-12 text-blue-600" />
              <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">
                {feature.title}
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Call to Action Section */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="mx-auto max-w-3xl rounded-2xl bg-white/50 p-8 backdrop-blur-sm dark:bg-slate-800/50">
            <h2 className="mb-4 text-3xl font-bold text-slate-900 dark:text-white">
              Ready to get started?
            </h2>
            <p className="mb-6 text-lg text-slate-600 dark:text-slate-300">
              Join thousands of teams already collaborating on CoWrite. Create
              your account in seconds and start your first document.
            </p>
            <div className="flex flex-col items-center justify-center space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
              <Link href="/sign-up">
                <Button
                  size="lg"
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 sm:w-auto"
                >
                  Create Your Account
                </Button>
              </Link>
              <Link href="/sign-in">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  I already have an account
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200/50 bg-white/30 py-8 backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-800/30">
        <div className="container mx-auto px-6 text-center">
          <p className="text-slate-600 dark:text-slate-400">
            © 2024 CoWrite. Built for seamless collaboration.
          </p>
        </div>
      </footer>
    </div>
  );
}
