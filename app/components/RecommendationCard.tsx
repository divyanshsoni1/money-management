// Lightbulb icon as inline SVG
function LightbulbIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className="w-6 h-6 shrink-0 text-amber-400"
    >
      <path d="M12 2a7 7 0 0 0-4 12.73V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.27A7 7 0 0 0 12 2Z" />
      <path d="M9 21h6" />
      <path d="M10 21h4" />
    </svg>
  );
}

export default function RecommendationCard() {
  return (
    <section
      aria-label="Recommendation"
      className="rounded-2xl bg-[#161618] border border-amber-700/30 shadow-[0_4px_24px_rgba(0,0,0,0.5)] p-4 sm:p-5"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="mt-0.5 shrink-0">
          <LightbulbIcon />
        </div>

        {/* Text */}
        <p className="text-sm sm:text-base leading-relaxed text-gray-400 break-words">
          <span className="font-bold text-amber-400">Team Superstar</span>{" "}
          wants to suggest you that use{" "}
          <span className="font-bold text-amber-400">100 trades</span> and{" "}
          <span className="font-bold text-amber-400">40 expected wins</span>{" "}
          combination as much as possible, you will get{" "}
          <span className="font-bold text-amber-400">more success</span>.
        </p>
      </div>
    </section>
  );
}
