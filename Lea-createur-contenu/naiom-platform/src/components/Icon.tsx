import * as Lucide from "lucide-react";
import type { LucideProps } from "lucide-react";

type Props = LucideProps & { name: string };

export function Icon({ name, ...rest }: Props) {
  const Cmp = (Lucide as unknown as Record<string, React.ComponentType<LucideProps>>)[name] ?? Lucide.Circle;
  return <Cmp {...rest} />;
}
