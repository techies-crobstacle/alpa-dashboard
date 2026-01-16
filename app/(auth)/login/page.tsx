// "use client";

// import { zodResolver } from "@hookform/resolvers/zod";
// import { useForm } from "react-hook-form";
// import { z } from "zod";
// import { toast } from "sonner";
// import { useState } from "react";
// import { useRouter } from "next/navigation";

// import { Button } from "@/components/ui/button";
// import {
// 	Form,
// 	FormControl,
// 	FormField,
// 	FormItem,
// 	FormLabel,
// 	FormMessage,
// } from "@/components/ui/form";
// import { Input } from "@/components/ui/input";
// import {
// 	Card,
// 	CardContent,
// 	CardDescription,
// 	CardFooter,
// 	CardHeader,
// 	CardTitle,
// } from "@/components/ui/card";
// import { LogIn, Mail, Lock, Loader2 } from "lucide-react";
// import Link from "next/link";

// const formSchema = z.object({
// 	email: z.string().email({
// 		message: "Please enter a valid email address.",
// 	}),
// 	password: z.string().min(6, {
// 		message: "Password must be at least 6 characters.",
// 	}),
// });

// // API Configuration - Use consistent URL
// const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://alpa-be-1.onrender.com";

// // Login API function - Backend will set the session cookie via Set-Cookie header
// async function loginUser(email: string, password: string) {
// 	const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
// 		method: "POST",
// 		headers: {
// 			"Content-Type": "application/json",
// 		},
// 		credentials: "include",
// 		body: JSON.stringify({ email, password }),
// 	});
// 	if (!response.ok) {
// 		const error = await response.json().catch(() => ({
// 			message: "Login failed. Please try again.",
// 		}));
// 		throw new Error(error.message || "Invalid credentials");
// 	}
// 	return response.json();
// }

// // Send login verification OTP
// async function sendLoginVerification(email: string, password: string) {
// 	const response = await fetch(`${API_BASE_URL}/api/auth/send-login-verification`, {
// 		method: "POST",
// 		headers: { "Content-Type": "application/json" },
// 		body: JSON.stringify({ email, password }),
// 	});
// 	if (!response.ok) {
// 		const error = await response.json().catch(() => ({ message: "Failed to send OTP." }));
// 		throw new Error(error.message || "Failed to send OTP");
// 	}
// 	return response.json();
// }

// // Verify login OTP
// async function verifyLoginOTP(email: string, otp: string) {
// 	const response = await fetch(`${API_BASE_URL}/api/auth/verify-login-otp`, {
// 		method: "POST",
// 		headers: { "Content-Type": "application/json" },
// 		body: JSON.stringify({ email, otp }),
// 	});
// 	if (!response.ok) {
// 		const error = await response.json().catch(() => ({ message: "OTP verification failed." }));
// 		throw new Error(error.message || "OTP verification failed");
// 	}
// 	return response.json();
// }

// export default function LoginPage() {
// 	const [isLoading, setIsLoading] = useState(false);
// 	const [showOTP, setShowOTP] = useState(false);
// 	const [otp, setOTP] = useState("");
// 	const [loginData, setLoginData] = useState<{ email: string; password: string } | null>(null);
// 	const [isOTPLoading, setIsOTPLoading] = useState(false);
// 	const router = useRouter();

// 	const form = useForm<z.infer<typeof formSchema>>({
// 		resolver: zodResolver(formSchema),
// 		defaultValues: {
// 			email: "",
// 			password: "",
// 		},
// 	});

// 	// Handles login form submit
// 	async function onSubmit(values: z.infer<typeof formSchema>) {
// 		setIsLoading(true);
// 		try {
// 			const response = await loginUser(values.email, values.password);
// 			// If backend says verification required, show OTP UI
// 			if (response.verificationRequired) {
// 				setLoginData({ email: values.email, password: values.password });
// 				setShowOTP(true);
// 				toast.info("Verification required. Please request and enter the OTP sent to your email.");
// 				return;
// 			}
// 			// Normal login flow
// 			if (!response.token) {
// 				throw new Error("No token received from server");
// 			}
// 			localStorage.setItem("alpa_token", response.token);
// 			document.cookie = `alpa_token=${response.token}; path=/; max-age=${60 * 60 * 24 * 7}`;
// 			localStorage.removeItem("user_data");
// 			toast.success("Login successful!", { description: "Welcome back! You have been logged in successfully." });
// 			let role = null;
// 			try {
// 				const { decodeJWT } = await import("@/lib/jwt");
// 				const decoded = decodeJWT(response.token);
// 				role = decoded?.role || null;
// 			} catch {}
// 			setTimeout(() => {
// 				if (role === "admin") {
// 					router.push("/dashboard/admin/dashboard");
// 				} else if (role === "seller") {
// 					router.push("/dashboard");
// 				} else {
// 					router.push("/dashboard/customer/profile");
// 				}
// 			}, 1000);
// 		} catch (error) {
// 			const err = error as Error;
// 			console.error("❌ Login error:", err);
// 			localStorage.removeItem("alpa_token");
// 			localStorage.removeItem("auth_token");
// 			localStorage.removeItem("user_data");
// 			toast.error("Login failed", { description: err.message || "Invalid email or password. Please try again." });
// 		} finally {
// 			setIsLoading(false);
// 		}
// 	}

// 	// Handles sending OTP
// 	async function handleSendOTP() {
// 		if (!loginData) return;
// 		setIsOTPLoading(true);
// 		try {
// 			await sendLoginVerification(loginData.email, loginData.password);
// 			toast.success("OTP sent to your email.");
// 		} catch (error) {
// 			const err = error as Error;
// 			toast.error("Failed to send OTP", { description: err.message });
// 		} finally {
// 			setIsOTPLoading(false);
// 		}
// 	}

// 	// Handles verifying OTP
// 	async function handleVerifyOTP(e: React.FormEvent) {
// 		e.preventDefault();
// 		if (!loginData) return;
// 		setIsOTPLoading(true);
// 		try {
// 			const response = await verifyLoginOTP(loginData.email, otp);
// 			if (!response.token) {
// 				throw new Error("No token received after OTP verification");
// 			}
// 			localStorage.setItem("alpa_token", response.token);
// 			document.cookie = `alpa_token=${response.token}; path=/; max-age=${60 * 60 * 24 * 7}`;
// 			localStorage.removeItem("user_data");
// 			toast.success("Login successful!", { description: "You have been logged in successfully." });
// 			let role = null;
// 			try {
// 				const { decodeJWT } = await import("@/lib/jwt");
// 				const decoded = decodeJWT(response.token);
// 				role = decoded?.role || null;
// 			} catch {}
// 			setTimeout(() => {
// 				if (role === "admin") {
// 					router.push("/dashboard/admin/dashboard");
// 				} else if (role === "seller") {
// 					router.push("/dashboard");
// 				} else {
// 					router.push("/dashboard/customer/profile");
// 				}
// 			}, 1000);
// 		} catch (error) {
// 			const err = error as Error;
// 			toast.error("OTP verification failed", { description: err.message });
// 		} finally {
// 			setIsOTPLoading(false);
// 		}
// 	}

// 	return (
// 		<Card className="w-full max-w-md">
// 			<CardHeader className="text-center">
// 				<LogIn className="mx-auto h-12 w-12 text-gray-400" />
// 				<CardTitle className="mt-4 text-2xl">Welcome back</CardTitle>
// 				<CardDescription>
// 					Enter your credentials to access your account
// 				</CardDescription>
// 			</CardHeader>
// 			<CardContent>
// 				{!showOTP ? (
// 					<Form {...form}>
// 						<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
// 							<FormField
// 								control={form.control}
// 								name="email"
// 								render={({ field }) => (
// 									<FormItem>
// 										<FormLabel>Email</FormLabel>
// 										<FormControl>
// 											<div className="relative">
// 												<Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
// 												<Input
// 													placeholder="Enter your email"
// 													className="pl-10"
// 													disabled={isLoading}
// 													{...field}
// 												/>
// 											</div>
// 										</FormControl>
// 										<FormMessage />
// 									</FormItem>
// 								)}
// 							/>
// 							<FormField
// 								control={form.control}
// 								name="password"
// 								render={({ field }) => (
// 									<FormItem>
// 										<FormLabel>Password</FormLabel>
// 										<FormControl>
// 											<div className="relative">
// 												<Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
// 												<Input
// 													type="password"
// 													placeholder="Enter your password"
// 													className="pl-10"
// 													disabled={isLoading}
// 													{...field}
// 												/>
// 											</div>
// 										</FormControl>
// 										<FormMessage />
// 									</FormItem>
// 								)}
// 							/>
// 							<Button type="submit" className="w-full" disabled={isLoading}>
// 								{isLoading ? (
// 									<>
// 										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
// 										Signing in...
// 									</>
// 								) : (
// 									"Sign In"
// 								)}
// 							</Button>
// 						</form>
// 					</Form>
// 				) : (
// 					<form onSubmit={handleVerifyOTP} className="space-y-4">
// 						<div>
// 							<FormLabel>OTP</FormLabel>
// 							<Input
// 								type="text"
// 								placeholder="Enter OTP"
// 								value={otp}
// 								onChange={e => setOTP(e.target.value)}
// 								disabled={isOTPLoading}
// 							/>
// 						</div>
// 						<Button type="button" className="w-full" onClick={handleSendOTP} disabled={isOTPLoading}>
// 							{isOTPLoading ? (
// 								<>
// 									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
// 									Sending OTP...
// 								</>
// 							) : (
// 								"Send OTP"
// 							)}
// 						</Button>
// 						<Button type="submit" className="w-full" disabled={isOTPLoading || !otp}>
// 							{isOTPLoading ? (
// 								<>
// 									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
// 									Verifying...
// 								</>
// 							) : (
// 								"Verify OTP & Login"
// 							)}
// 						</Button>
// 					</form>
// 				)}
// 			</CardContent>
// 			<CardFooter className="flex flex-col gap-4">
// 				<div className="text-center text-sm">
// 					<Link
// 						href="/forgot-password"
// 						className="text-blue-600 hover:text-blue-800 underline"
// 					>
// 						Forgot your password?
// 					</Link>
// 				</div>
// 				<div className="text-center text-sm">
// 					Don&apos;t have an account?{" "}
// 					<Link
// 						href="/register"
// 						className="text-blue-600 hover:text-blue-800 underline"
// 					>
// 						Sign up
// 					</Link>
// 				</div>
// 			</CardFooter>
// 		</Card>
// 	);
// }

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LogIn, Mail, Lock, Loader2 } from "lucide-react";
import Link from "next/link";

const formSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
});

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://alpa-be-1.onrender.com";

// Login API function
async function loginUser(email: string, password: string) {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Login failed. Please try again.");
  }
  return data;
}


// Verify login OTP
async function verifyLoginOTP(email: string, otp: string) {
  const response = await fetch(`${API_BASE_URL}/api/auth/verify-login-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp }),
  });
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.message || "OTP verification failed");
  }
  return data;
}

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [otp, setOTP] = useState("");
  const [loginData, setLoginData] = useState<{
    email: string;
    password: string;
  } | null>(null);
  const [isOTPLoading, setIsOTPLoading] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Handles login form submit
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const response = await loginUser(values.email, values.password);
      if (response.requiresVerification) {
        setLoginData({ email: values.email, password: values.password });
        setShowOTP(true);
        toast.info(
          response.message ||
            "Device verification required. Please enter the OTP sent to your email."
        );
        // Optionally auto-send OTP on first show
        await sendLoginVerification(values.email, values.password);
        return;
      }
      if (!response.token) {
        throw new Error("No token received from server");
      }
      localStorage.setItem("alpa_token", response.token);
      document.cookie = `alpa_token=${response.token}; path=/; max-age=${
        60 * 60 * 24 * 7
      }`;
      localStorage.removeItem("user_data");
      toast.success("Login successful!", {
        description: "Welcome back! You have been logged in successfully.",
      });
      let role = response.role || null;
      try {
        if (!role) {
          const { decodeJWT } = await import("@/lib/jwt");
          const decoded = decodeJWT(response.token);
          role = decoded?.role || null;
        }
      } catch {}
      setTimeout(() => {
        if (role === "admin") {
          router.push("/dashboard/admin/dashboard");
        } else if (role === "seller") {
          router.push("/dashboard");
        } else {
          router.push("/dashboard/customer/profile");
        }
      }, 1000);
    } catch (error) {
      const err = error as Error;
      console.error("❌ Login error:", err);
      localStorage.removeItem("alpa_token");
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user_data");
      toast.error("Login failed", {
        description:
          err.message || "Invalid email or password. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  // Handles verifying OTP
  async function handleVerifyOTP(e: React.FormEvent) {
    e.preventDefault();
    if (!loginData) return;
    setIsOTPLoading(true);
    try {
      const response = await verifyLoginOTP(loginData.email, otp);
      if (!response.token) {
        throw new Error("No token received after OTP verification");
      }
      localStorage.setItem("alpa_token", response.token);
      document.cookie = `alpa_token=${response.token}; path=/; max-age=${
        60 * 60 * 24 * 7
      }`;
      localStorage.removeItem("user_data");
      toast.success("Login successful!", {
        description: "You have been logged in successfully.",
      });
      let role = response.role || null;
      try {
        if (!role) {
          const { decodeJWT } = await import("@/lib/jwt");
          const decoded = decodeJWT(response.token);
          role = decoded?.role || null;
        }
      } catch {}
      setTimeout(() => {
        if (role === "admin") {
          router.push("/dashboard/admin/dashboard");
        } else if (role === "seller") {
          router.push("/dashboard");
        } else {
          router.push("/dashboard/customer/profile");
        }
      }, 1000);
    } catch (error) {
      const err = error as Error;
      toast.error("OTP verification failed", { description: err.message });
    } finally {
      setIsOTPLoading(false);
    }
  }

  // Handles resending OTP
  async function handleResendOTP() {
    if (!loginData) return;
    setIsOTPLoading(true);
    try {
      await sendLoginVerification(loginData.email, loginData.password);
      toast.success("OTP resent to your email.");
    } catch (error) {
      const err = error as Error;
      toast.error("Failed to resend OTP", { description: err.message });
    } finally {
      setIsOTPLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <LogIn className="mx-auto h-12 w-12 text-gray-400" />
        <CardTitle className="mt-4 text-2xl">Welcome back</CardTitle>
        <CardDescription>
          Enter your credentials to access your account
        </CardDescription>
      </CardHeader>
      <CardContent>
  {!showOTP ? (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter your email"
                  disabled={isLoading}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Enter your password"
                  disabled={isLoading}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Signing in..." : "Sign In"}
        </Button>
      </form>
    </Form>
  ) : (
    <form onSubmit={handleVerifyOTP} className="space-y-4">
      <div>
        <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-200">
          Enter OTP
        </label>
        <Input
          type="text"
          placeholder="Enter OTP"
          value={otp}
          onChange={e => setOTP(e.target.value)}
          disabled={isOTPLoading}
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
          maxLength={6}
          autoFocus
        />
      </div>
      <Button
        type="submit"
        className="w-full"
        disabled={isOTPLoading || !otp}
        variant="default"
      >
        {isOTPLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Verifying...
          </>
        ) : (
          "Verify OTP & Login"
        )}
      </Button>
    </form>
  )}
</CardContent>
      <CardFooter className="flex flex-col gap-4">
        <div className="text-center text-sm">
          <Link
            href="/forgot-password"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Forgot your password?
          </Link>
        </div>
        <div className="text-center text-sm">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Sign up
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
function sendLoginVerification(email: string, password: string) {
	throw new Error("Function not implemented.");
}

