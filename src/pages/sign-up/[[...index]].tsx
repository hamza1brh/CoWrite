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

interface SignUpProps {
  providers: any;
}

export default function SignUpPage({ providers }: SignUpProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleCredentialsSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Since our credentials provider auto-creates users, we can use signIn
      const result = await signIn("credentials", {
        email,
        password,
        callbackUrl: "/",
        redirect: false,
      });

      if (result?.error) {
        alert(result.error);
      } else if (result?.ok) {
        // Force redirect on successful sign up
        router.push("/");
      }
    } catch (error) {
      console.error("Sign up error:", error);
      alert("Sign up failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthSignUp = (providerId: string) => {
    signIn(providerId, {
      callbackUrl: "/",
      redirect: true,
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4 dark:from-slate-900 dark:to-slate-800">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Join CoWrite
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Create your account and start collaborating
          </p>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-center text-lg">
              Create Account
            </CardTitle>
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
                  onClick={() => handleOAuthSignUp(provider.id)}
                >
                  Continue with {provider.name}
                </Button>
              );
            })}

            {/* Credentials Form */}
            {providers?.credentials && (
              <>
                {Object.values(providers || {}).length > 1 && (
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        Or create account with email
                      </span>
                    </div>
                  </div>
                )}

                <form onSubmit={handleCredentialsSignUp} className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="Enter your email address"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Create a password"
                      required
                      minLength={4}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Creating Account..." : "Create Account"}
                  </Button>
                  <p className="text-center text-xs text-muted-foreground">
                    By creating an account, you agree to our terms of service
                  </p>
                </form>
              </>
            )}

            <div className="text-center">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Already have an account?{" "}
                <Link
                  href="/sign-in"
                  className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
                >
                  Sign in
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
