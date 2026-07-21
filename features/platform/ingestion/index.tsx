import { OnboardSteps } from "@/features/platform/components/OnboardSteps";
import { ConnectForm } from "./components/ConnectForm";
import { SampleRepos } from "./components/SampleRepos";

export function Ingestion() {
  return (
    <div className="relative mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-xl flex-col justify-center px-6 py-6">
      <OnboardSteps current={1} />

      <div className="mt-10">
        <p className="ow-mono-micro text-signal">INGESTION // CONNECT A SOURCE</p>
        <h1 className="ow-heading mt-3 text-text-hi">
          Connect a repository to watch
        </h1>
        <p className="ow-body mt-2 text-text-mid">
          Overwatch clones and parses your repo with Tree-sitter, resolves every
          dependency edge, and writes the structure to the graph. Then the
          intelligence layers begin.
        </p>
      </div>

      <div className="mt-8 rounded-lg border border-line-1 bg-surface-1 p-6 shadow-[var(--ow-shadow-card)]">
        <ConnectForm />
      </div>

      <div className="mt-6">
        <SampleRepos />
      </div>
    </div>
  );
}
