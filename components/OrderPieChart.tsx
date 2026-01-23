'use client';

type Props = {
  data: { name: string; value: number }[];
  colors: string[];
};

export default function OrderPieChart({ data, colors }: Props) {

  const safeData = data.map(d => ({
    name: d.name,
    value: Number.isFinite(d.value) ? d.value : 0
  }));

  const total = safeData.reduce((sum, d) => sum + d.value, 0);

  const finalData = total > 0
    ? safeData.filter(d => d.value > 0)
    : [{ name: 'No Data', value: 1 }];

  let cumulative = 0;
  const radius = 130;
  const center = 160;

  const describeArc = (cx: number, cy: number, r: number, start: number, end: number) => {
    const polarToCartesian = (angle: number) => {
      const rad = (angle - 90) * Math.PI / 180.0;
      return {
        x: cx + r * Math.cos(rad),
        y: cy + r * Math.sin(rad)
      };
    };

    const startPoint = polarToCartesian(end);
    const endPoint = polarToCartesian(start);

    const largeArcFlag = end - start <= 180 ? "0" : "1";

    return [
      "M", cx, cy,
      "L", startPoint.x, startPoint.y,
      "A", r, r, 0, largeArcFlag, 0, endPoint.x, endPoint.y,
      "Z"
    ].join(" ");
  };

  return (
    <div className="flex flex-col items-center gap-4">

      {/* PIE */}
      <svg width="320" height="320" viewBox="0 0 320 320">
        {finalData.map((slice, i) => {
          const value = slice.value;
          const percent = total === 0 ? 0 : value / total;
          const startAngle = cumulative * 360;
          const endAngle = (cumulative + percent) * 360;
          cumulative += percent;

          return (
            <path
              key={i}
              d={describeArc(center, center, radius, startAngle, endAngle)}
              fill={colors[i % colors.length]}
            />
          );
        })}
      </svg>

      {/* LEGEND */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
        {finalData.map((item, i) => (
          <div key={item.name} className="flex items-center gap-2">
            <span 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: colors[i % colors.length] }} 
            />
            <span className="text-gray-700 font-medium">
              {item.name}
            </span>
            <span className="text-gray-500">
              ({item.value})
            </span>
          </div>
        ))}
      </div>

    </div>
  );
}
