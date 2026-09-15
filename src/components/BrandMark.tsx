type Props = {
  size?: "sm" | "md" | "lg";
  showSupermarket?: boolean;
  className?: string;
};

const sizeMap = {
  sm: { word: "text-xl md:text-2xl", sub: "text-[0.55rem] md:text-xs" },
  md: { word: "text-3xl md:text-4xl", sub: "text-xs md:text-sm" },
  lg: { word: "text-5xl md:text-6xl", sub: "text-sm md:text-base" },
};

/** CSS wordmark: COST+PLUS in yellow italic with red outline feel */
export function BrandMark({
  size = "md",
  showSupermarket = true,
  className = "",
}: Props) {
  const s = sizeMap[size];
  return (
    <div className={`flex flex-col items-start leading-none ${className}`}>
      <span
        className={`font-black italic tracking-tight text-cp-yellow brand-wordmark ${s.word}`}
      >
        COST+PLUS
      </span>
      {showSupermarket && (
        <span
          className={`mt-1 font-bold uppercase tracking-[0.35em] text-cp-yellow ${s.sub}`}
        >
          SUPERMARKET
        </span>
      )}
    </div>
  );
}
