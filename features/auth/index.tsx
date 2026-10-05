import Link from "next/link";
import { describeLoginError } from "./api";
import { AuthShell } from "./components/AuthShell";
import { LoginForm } from "./components/LoginForm";
import { RegisterForm } from "./components/RegisterForm";

export { AuthComplete } from "./components/AuthComplete";

export function Login({ errorCode }: { errorCode?: string }) {
  return (
    <AuthShell
      eyebrow="ACCESS // SIGN IN"
      title="Welcome back"
      subtitle="Sign in to resume watching your systems."
      footer={
        <>
          No account yet?{" "}
          <Link href="/register" className="text-signal hover:underline">
            CREATE ONE
          </Link>
        </>
      }
    >
      <LoginForm errorMessage={describeLoginError(errorCode)} />
    </AuthShell>
  );
}

export function Register() {
  return (
    <AuthShell
      eyebrow="ACCESS // REGISTER"
      title="Create your account"
      subtitle="Spin up an Overwatch workspace in seconds."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="text-signal hover:underline">
            SIGN IN
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
