import type { SceneMode } from "../../types";
import {
  ContractCard,
  FlowCard,
  ParsedFileCard,
  PushCard,
  QuestionCard,
  StaleDiagramCard,
  SummaryCard,
  TicketsCard,
} from "./cards/SceneCards";

interface SceneCardProps {
  mode: SceneMode;
  flowStep: number;
}

export function SceneCard({ mode, flowStep }: SceneCardProps) {
  switch (mode) {
    case "intro":
      return <StaleDiagramCard />;
    case "map":
      return <ParsedFileCard />;
    case "ask":
      return <QuestionCard />;
    case "flow":
      return <FlowCard step={flowStep} />;
    case "tickets":
      return <TicketsCard />;
    case "contracts":
      return <ContractCard />;
    case "live":
      return <PushCard />;
    case "complete":
      return <SummaryCard />;
  }
}
