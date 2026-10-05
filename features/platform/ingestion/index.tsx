import { OnboardSteps } from "@/features/platform/components/OnboardSteps";
import { ConnectForm } from "./components/ConnectForm";

export function Ingestion() {
  return (
    <div className="relative mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-2xl flex-col justify-center px-3 py-12">
      <OnboardSteps current={1} />

      <div className="mt-10">
        <p className="ow-micro text-signal">INGESTION // CONNECT YOUR TOOLS</p>
        <h1 className="ow-heading mt-3 text-text-hi">Set up your workspace</h1>
        <p className="ow-body mt-2 text-text-mid">
          Choose the GitHub repository Overwatch should analyze and optionally
          connect a Jira project for ticket context.
        </p>
      </div>

      <div className="ow-pop mt-8 rounded-lg border border-line-1 bg-surface-1 p-6 shadow-card">
        <ConnectForm />
      </div>

    </div>
  );
}
