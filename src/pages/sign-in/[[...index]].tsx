import { GetServerSideProps } from "next";
import { getServerSession } from "next-auth/next";
import { signIn, getProviders } from "next-auth/react";
import { authOptions } from "@/lib/auth-config";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

interface SignInProps {
  providers: any;
}

export default function SignInPage({ providers }: SignInProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleOAuthSignIn = async (providerId: string) => {
    setIsLoading(true);
    try {
      console.log(`🔄 Starting OAuth sign-in with ${providerId}`);
      const result = await signIn(providerId, {
        callbackUrl: "/",
        redirect: true,
      });
      console.log(`🔄 SignIn result:`, result);
    } catch (error) {
      console.error("OAuth sign in error:", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4 dark:from-slate-900 dark:to-slate-800">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Welcome Back
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Sign in to access your collaborative documents
          </p>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-center text-lg">Sign In</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* OAuth Providers */}
            {Object.values(providers || {}).map((provider: any) => {
              if (provider.id === "credentials") return null;

              return (
                <Button
                  key={provider.name}
                  variant="outline"
                  className="w-full"
                  onClick={() => handleOAuthSignIn(provider.id)}
                  disabled={isLoading}
                >
                  {isLoading
                    ? "Signing in..."
                    : `Sign in with ${provider.name}`}
                </Button>
              );
            })}

            {/* Show message if no OAuth providers are configured */}
            {Object.values(providers || {}).filter(
              (p: any) => p.id !== "credentials"
            ).length === 0 && (
              <div className="py-8 text-center">
                <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
                  No authentication providers are currently configured.
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-500">
                  Please contact your administrator or configure OAuth
                  providers.
                </p>
              </div>
            )}

            <div className="text-center">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Don&apos;t have an account?{" "}
                <Link
                  href="/sign-up"
                  className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <Link
            href="/welcome"
            className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            ← Back to welcome
          </Link>
        </div>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async context => {
  const session = await getServerSession(context.req, context.res, authOptions);

  // Redirect to dashboard if already authenticated
  if (session) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  const providers = await getProviders();

  return {
    props: {
      providers: providers || {},
    },
  };
};
