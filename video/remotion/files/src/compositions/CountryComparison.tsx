import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

interface CountryItem {
  country: string;
  value: string;
  flag: string;
}

interface CountryComparisonProps {
  title: string;
  items: CountryItem[];
}

const TitleCard: React.FC<{ title: string }> = ({ title }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#1a1a2e",
        justifyContent: "center",
        alignItems: "center",
        opacity,
      }}
    >
      <h1
        style={{
          color: "#ffffff",
          fontSize: 72,
          fontFamily: "Arial, sans-serif",
          fontWeight: "bold",
          textAlign: "center",
          padding: "0 100px",
        }}
      >
        {title}
      </h1>
    </AbsoluteFill>
  );
};

const CountryCard: React.FC<{ item: CountryItem }> = ({ item }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 200 },
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#16213e",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          transform: `scale(${scale})`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 24,
        }}
      >
        <span style={{ fontSize: 120 }}>{item.flag}</span>
        <h2
          style={{
            color: "#ffffff",
            fontSize: 64,
            fontFamily: "Arial, sans-serif",
            fontWeight: "bold",
          }}
        >
          {item.country}
        </h2>
        <p
          style={{
            color: "#e2e8f0",
            fontSize: 48,
            fontFamily: "Arial, sans-serif",
          }}
        >
          {item.value}
        </p>
      </div>
    </AbsoluteFill>
  );
};

export const CountryComparison: React.FC<CountryComparisonProps> = ({
  title,
  items,
}) => {
  const titleDuration = 45; // 1.5 seconds at 30fps
  const cardDuration = Math.floor((180 - titleDuration) / items.length);

  return (
    <AbsoluteFill>
      <Sequence from={0} durationInFrames={titleDuration}>
        <TitleCard title={title} />
      </Sequence>
      {items.map((item, index) => (
        <Sequence
          key={item.country}
          from={titleDuration + index * cardDuration}
          durationInFrames={cardDuration}
        >
          <CountryCard item={item} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
