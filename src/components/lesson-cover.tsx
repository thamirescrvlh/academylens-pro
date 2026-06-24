type Props = {
  subjectName: string;
  subjectColor?: string | null;
  lessonNumber?: number | null;
  className?: string;
  thumbnailUrl?: string | null;
};

// Gradientes lilás fixos por matéria (fallback: cor da matéria → roxo).
const GRADIENTS: Record<string, [string, string]> = {
  linguagens: ["#C084FC", "#8B5CF6"],
  matematica: ["#7C3AED", "#4C1D95"],
  "ciencias-humanas": ["#A78BFA", "#6D28D9"],
  "ciencias-da-natureza": ["#DDD6FE", "#8B5CF6"],
  redacao: ["#9333EA", "#581C87"],
  ingles: ["#E9D5FF", "#7C3AED"],
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function LessonCover({
  subjectName,
  subjectColor,
  lessonNumber,
  className,
  thumbnailUrl,
}: Props) {
  if (thumbnailUrl) {
    return (
      <div
        className={className}
        style={{
          backgroundImage: `url(${thumbnailUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
    );
  }
  const key = slugify(subjectName);
  const [a, b] =
    GRADIENTS[key] ??
    (subjectColor ? [subjectColor, "#7C3AED"] : ["#A855F7", "#6D28D9"]);

  return (
    <div
      className={className}
      style={{ background: `linear-gradient(135deg, ${a}, ${b})` }}
    >
      <div className="flex h-full w-full flex-col items-center justify-center p-3 text-center text-white">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-90 sm:text-xs">
          {subjectName}
        </p>
        {lessonNumber != null && (
          <p className="mt-1 text-xl font-extrabold leading-none drop-shadow sm:text-2xl">
            Aula {String(lessonNumber).padStart(2, "0")}
          </p>
        )}
      </div>
    </div>
  );
}
