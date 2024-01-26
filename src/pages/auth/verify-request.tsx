import { Logo } from "@/components/logo";

export default function VerifyRequestPage() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="rounded-md border p-8 text-center">
        <h1 className="mb-2 scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
          Check your email
        </h1>
        <p className="text-xl text-muted-foreground">
          A sign in link has been sent to your email address.
        </p>
        <Logo className="mt-8 block" />
      </div>
    </div>
  );
}
