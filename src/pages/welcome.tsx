import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { SignInButton, SignUpButton, useUser } from "@clerk/nextjs";
import { FileText, Users, Zap, Shield } from "lucide-react";
import { useRouter } from "next/router";
import { useEffect } from "react";

export default function Welcome() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  // Redirect authenticated users to dashboard (home page)
  useEffect(() => {
    if (isLoaded && user) {
      router.replace("/");
    }
  }, [isLoaded, user, router]);

  // Show loading while checking auth
  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Don't render if user is authenticated (they'll be redirected)
  if (user) {
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
      <div className="container mx-auto px-6 py-12">
        {/* Header */}
        <motion.div
          className="mb-16 text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="mb-6 text-5xl font-bold text-slate-900 dark:text-white">
            Welcome to <span className="text-gradient">CoWrite</span>
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-xl text-slate-600 dark:text-slate-300">
            The collaborative document editor that brings your team together.
            Create, edit, and share documents in real-time.
          </p>

          <div className="flex justify-center space-x-4">
            <SignUpButton mode="modal">
              <Button
                size="lg"
                className="button-gradient rounded-xl px-8 py-3 text-white"
              >
                Get Started Free
              </Button>
            </SignUpButton>

            <SignInButton mode="modal">
              <Button
                size="lg"
                variant="outline"
                className="rounded-xl px-8 py-3"
              >
                Sign In
              </Button>
            </SignInButton>
          </div>
        </motion.div>

        {/* Features */}
        <motion.div
          className="grid gap-8 md:grid-cols-2 lg:grid-cols-4"
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
      </div>
    </div>
  );
}
