import * as React from "react";
import { View, Image } from "react-native";
import { Text } from "~/components/ui/text";
import { useStreamplaceStore } from "wagaga-components-beta-wagaga";
import { PlaceStreamLivestream } from "streamplace";
import { Link } from "expo-router";

export default function Screen() {
  const [progress, setProgress] = React.useState(78);
  const liveUsers = useStreamplaceStore((state) => state.liveUsers);
  const liveUsersLoading = useStreamplaceStore(
    (state) => state.liveUsersLoading,
  );

  const base = useStreamplaceStore((state) => state.url);

  return (
    <View className="flex-1 justify-center items-center gap-5 p-6 bg-secondary/30">
      {!liveUsers ? (
        <View className="flex-1 justify-center items-center">
          <Text>Loading...</Text>
        </View>
      ) : (
        <View className="flex-1 justify-center items-center gap-4">
          {liveUsers.map((view) => (
            <LivestreamCard
              key={view.author.handle}
              imageUri={`${base}/api/playback/${view.author.handle}/stream.jpg?ts=${(Date.now() / 120000).toFixed(0)}`}
              view={view}
            />
          ))}
        </View>
      )}
    </View>
  );
}

function LivestreamCard({
  view,
  imageUri,
}: {
  view: PlaceStreamLivestream.LivestreamView;
  imageUri?: string;
}) {
  let record = view.record as PlaceStreamLivestream.Record;
  return (
    <Link href={`/stream/${view.author.handle}`}>
      <View className="flex-1 bg-white dark:bg-gray-800 rounded-xl p-4 min-w-md max-w-md shadow-md gap-2">
        <Image
          source={{ uri: imageUri }}
          height={720}
          width={1280}
          className="max-w-full w-screen h-full"
          style={{ resizeMode: "contain", aspectRatio: 16 / 9 }}
        />
        <View>
          <Text className="text-lg font-semibold">{record.title}</Text>
          <Text className="text-lg font-semibold">@{view.author.handle}</Text>
        </View>
      </View>
    </Link>
  );
}
