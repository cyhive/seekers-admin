  // "use client";

  // import { useState, useEffect } from "react";
  // import { useRouter, useSearchParams } from "next/navigation";
  // import { Mountain, Eye, EyeOff } from "lucide-react";
  // import Link from "next/link";
  // import { signIn } from "next-auth/react";

  // export default function LoginPage() {
  //   const [email, setEmail] = useState("");
  //   const [password, setPassword] = useState("");
  //   const [showPassword, setShowPassword] = useState(false);
  //   const router = useRouter();
  //   const searchParams = useSearchParams();

  //   // useEffect(() => {
  //   //   const error = searchParams.get("error");
  //   //   if (error === "CredentialsSignin") {
  //   //     // Clean the URL
  //   //     router.replace("/login", { scroll: false });
  //   //   } else if (searchParams.get("callbackUrl")) {
  //   //     // Clean the URL
  //   //     router.replace("/login", { scroll: false });
  //   //   }
  //   // }, [searchParams, router]);

  //   const handleLogin =() => {
    
  //       router.push("/dashboard");
    
  //   };

  //   return (
  //     <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
  //       <div className="w-full max-w-md space-y-8">
  //         <div className="text-center">
  //           <div className="flex justify-center items-center gap-2 mb-4">
  //             <Mountain className="h-8 w-8 text-primary" />
  //             <h1 className="text-3xl font-bold tracking-tight text-foreground font-headline">
  //               Pacha Bhoomi
  //             </h1>
  //           </div>
  //           <h2 className="mt-6 text-center text-2xl font-bold tracking-tight text-foreground">
  //             Sign in to your account
  //           </h2>
  //         </div>
  //         <form className="mt-8 space-y-6" onSubmit={()=>handleLogin()}>
  //           <div className="rounded-md shadow-sm -space-y-px">
  //             <div>
  //               <label htmlFor="email-address" className="sr-only">
  //                 Email address
  //               </label>
  //               <input
  //                 id="email-address"
  //                 name="email"
  //                 type="email"
  //                 autoComplete="email"
  //                 required
  //                 className="relative block w-full appearance-none rounded-t-md border border-input bg-background px-3 py-2 text-foreground placeholder-muted-foreground focus:z-10 focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
  //                 placeholder="Email address"
  //                 value={email}
  //                 onChange={(e) => setEmail(e.target.value)}
  //               />
  //             </div>
  //             <div className="relative">
  //               <label htmlFor="password" className="sr-only">
  //                 Password
  //               </label>
  //               <input
  //                 id="password"
  //                 name="password"
  //                 type={showPassword ? "text" : "password"}
  //                 autoComplete="current-password"
  //                 required
  //                 className="relative block w-full appearance-none rounded-b-md border border-input bg-background px-3 py-2 text-foreground placeholder-muted-foreground focus:z-10 focus:border-primary focus:outline-none focus:ring-primary sm:text-sm pr-10"
  //                 placeholder="Password"
  //                 value={password}
  //                 onChange={(e) => setPassword(e.target.value)}
  //               />
  //               <button
  //                 type="button"
  //                 className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground"
  //                 onClick={() => setShowPassword(!showPassword)}
  //               >
  //                 {showPassword ? (
  //                   <EyeOff className="h-5 w-5" />
  //                 ) : (
  //                   <Eye className="h-5 w-5" />
  //                 )}
  //                 <span className="sr-only">
  //                   {showPassword ? "Hide password" : "Show password"}
  //                 </span>
  //               </button>
  //             </div>
  //           </div>

  //           <div className="flex items-center justify-between">
  //             <div className="text-sm">
  //               <Link
  //                 href="#"
  //                 className="font-medium text-primary hover:text-primary/90"
  //               >
  //                 Forgot your password?
  //               </Link>
  //             </div>
  //           </div>

  //           <div>
  //             <button
  //               type="submit"
  //               className="group relative flex w-full justify-center rounded-md border border-transparent bg-primary py-2 px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
  //             >
  //               Sign in
  //             </button>
  //           </div>
  //         </form>
  //         <p className="mt-2 text-center text-sm text-muted-foreground">
  //           Don&apos;t have an account?{" "}
  //           {/* <Link
  //             href="#"
  //             className="font-medium text-primary hover:text-primary/90"
  //           >
  //             Sign up
  //           </Link> */}
  //         </p>
  //       </div>
  //     </div>
  //   );
  // }
