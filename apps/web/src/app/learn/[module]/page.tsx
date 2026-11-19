import { notFound } from "next/navigation";
import { content } from "../../../content/loader";
import { LessonStudio } from "../../../components/learn/lesson-studio";
export function generateStaticParams() {
  return content.lessons.map((m) => ({ module: m.module_id }));
}
export default async function LessonPage({
  params,
}: {
  params: Promise<{ module: string }>;
}) {
  const { module } = await params;
  const lesson = content.lessons.find((m) => m.module_id === module);
  if (!lesson) notFound();
  return <LessonStudio moduleId={lesson.module_id} />;
}
