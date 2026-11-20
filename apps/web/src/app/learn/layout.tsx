import { StudioShell } from "../../components/learn/studio-shell";
import "./learn.css";
export default function LearnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <StudioShell>{children}</StudioShell>;
}
