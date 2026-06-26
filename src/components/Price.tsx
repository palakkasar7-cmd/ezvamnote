import { usePrice } from "@/lib/cover-names";

export function Price({
  slug,
  price,
  originalPrice,
  showStrike = true,
  className = "",
  strikeClassName = "",
}: {
  slug: string;
  price: number;
  originalPrice?: number;
  showStrike?: boolean;
  className?: string;
  strikeClassName?: string;
}) {
  const eff = usePrice(slug, { price, originalPrice });
  return (
    <span className={className}>
      ₹{eff.price}
      {showStrike && eff.originalPrice && eff.originalPrice > eff.price && (
        <span className={strikeClassName ? ` ${strikeClassName}` : " line-through opacity-50 ml-2"}>
          ₹{eff.originalPrice}
        </span>
      )}
    </span>
  );
}
