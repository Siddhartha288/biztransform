import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';

export default function RadarScoreChart({ categories = [] }) {
  const data = categories.map((c) => ({
    category: c.label,
    score: c.score,
    fullMark: 100,
  }));

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="#2A2A42" />
          <PolarAngleAxis
            dataKey="category"
            tick={{ fill: '#9C9BB3', fontSize: 11, fontFamily: 'IBM Plex Mono' }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 100]}
            tick={{ fill: '#9C9BB3', fontSize: 10 }}
            axisLine={false}
          />
          <Radar
            name="Score"
            dataKey="score"
            stroke="#4FD1C5"
            fill="#4FD1C5"
            fillOpacity={0.35}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
