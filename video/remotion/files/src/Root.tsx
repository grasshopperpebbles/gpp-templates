import { Composition } from "remotion";
import { CountryComparison } from "./compositions/CountryComparison";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="CountryComparison"
        component={CountryComparison}
        durationInFrames={180}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          title: "Example From Different Countries",
          items: [
            { country: "United States", value: "Example Item", flag: "🇺🇸" },
            { country: "Japan", value: "Example Item", flag: "🇯🇵" },
            { country: "Brazil", value: "Example Item", flag: "🇧🇷" },
            { country: "Germany", value: "Example Item", flag: "🇩🇪" },
            { country: "India", value: "Example Item", flag: "🇮🇳" },
          ],
        }}
      />
    </>
  );
};
