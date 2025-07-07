import {
  useLivestreamInfo,
  useSegmentTiming,
  usePlayerDimensions,
  PlayerUI,
  View,
  Text,
  Toast,
  Resizable,
  useKeyboardSlide,
} from "@streamplace/components";
import { Pressable } from "react-native";
import { Chat } from "./chat";

export function MyPlayerUI() {
  const {
    ingest,
    toggleGoLive,
    showCountdown,
    setShowCountdown,
    recordSubmitted,
    setRecordSubmitted,
  } = useLivestreamInfo();
  const { width, height } = usePlayerDimensions();

  const isSelfAndNotLive = ingest === "new";
  const isLive = ingest !== null && ingest !== "new";

  return (
    <View className="flex-1 justify-end p-5">
      {/* Metrics Panel */}
      {isLive && <PlayerUI.MetricsPanel showMetrics={isLive} />}

      {/* Input Panel for Streamer */}
      {isSelfAndNotLive ? (
        <View className="mb-5">
          <Text className="text-white text-base mb-2">Stream Title:</Text>
          <Pressable
            onPress={() => toggleGoLive()}
            className="bg-red-500 py-3 rounded-lg"
          >
            <Text className="text-white text-center font-bold text-base">
              Go Live!
            </Text>
          </Pressable>
        </View>
      ) : (
        <Resizable isPlayerRatioGreater={false}>
          <Chat />
        </Resizable>
      )}

      {/* Countdown Overlay */}
      <PlayerUI.CountdownOverlay
        visible={showCountdown}
        width={width}
        height={height}
        startFrom={3}
        onDone={() => setShowCountdown(false)}
      />

      {/* Toast Notification */}
      <Toast
        open={recordSubmitted}
        onOpenChange={setRecordSubmitted}
        title="You're live!"
        description="We're notifying your followers that you just went live."
        duration={5}
      />
    </View>
  );
}
