import { Reply, ShieldEllipsis } from "lucide-react-native";
import { ComponentProps, useCallback, useMemo, useRef, useState } from "react";
import {
  FlatList,
  ListRenderItemInfo,
  Platform,
  Pressable,
} from "react-native";
import Swipeable, {
  SwipeableMethods,
} from "react-native-gesture-handler/ReanimatedSwipeable";
import Reanimated, {
  SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";
import { ChatMessageViewHydrated } from "streamplace";
import {
  atoms,
  Text,
  useChat,
  useSetReplyToMessage,
  View,
} from "wagaga-components-beta-wagaga";

import { RenderChatMessage } from "./chat-message";

function RightAction(prog: SharedValue<number>, drag: SharedValue<number>) {
  const styleAnimation = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: drag.value + 25 }],
    };
  });

  return (
    <Reanimated.View style={[styleAnimation]}>
      <Reply color="white" />
    </Reanimated.View>
  );
}

function LeftAction(prog: SharedValue<number>, drag: SharedValue<number>) {
  const styleAnimation = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: drag.value - 25 }],
    };
  });

  return (
    <Reanimated.View style={[styleAnimation]}>
      <ShieldEllipsis color="white" />
    </Reanimated.View>
  );
}

const SHOWN_MSGS =
  Platform.OS === "android" || Platform.OS === "ios" ? 100 : 25;

export function Chat({
  shownMessages = SHOWN_MSGS,
  style: propsStyle,
  ...props
}: ComponentProps<typeof View> & {
  shownMessages?: number;
  style?: ComponentProps<typeof View>["style"];
}) {
  const chat = useChat();
  // const { width } = useWindowDimensions(); // 'width' is declared but its value is never read.
  const setReply = useSetReplyToMessage();

  const [modMsg, setModMsg] = useState<ChatMessageViewHydrated | null>(null);

  // Map to store refs for each swipeable row
  const swipeableRefs = useRef<Map<string, SwipeableMethods | null>>(new Map());

  const authors = useMemo(() => {
    if (!chat) return null;
    return chat.reduce((acc, msg) => {
      acc.set(msg.author.handle, msg.chatProfile);
      return acc;
    }, new Map<string, ChatMessageViewHydrated["chatProfile"]>());
  }, [chat]);

  const keyExtractor = useCallback(
    (item: ChatMessageViewHydrated, index: number) => {
      return `${item.author.handle}-${item.record.text}-${index}`;
    },
    [],
  );

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<ChatMessageViewHydrated>) => {
      if (!authors) {
        return <Text>Loading author cache...</Text>;
      }
      const key = keyExtractor(item, index);

      return (
        <Pressable onLongPress={() => setModMsg(item)}>
          <Swipeable
            friction={2}
            rightThreshold={40}
            renderRightActions={
              Platform.OS === "android" ? undefined : RightAction
            }
            renderLeftActions={
              Platform.OS === "android" ? undefined : LeftAction
            }
            overshootFriction={9}
            ref={(ref) => {
              swipeableRefs.current.set(key, ref);
            }}
            onSwipeableOpen={(r) => {
              if (r === (Platform.OS === "android" ? "right" : "left")) {
                setReply(item);
              }
              // close this swipeable
              const swipeable = swipeableRefs.current.get(key);
              if (swipeable) {
                swipeable.close();
              }
            }}
          >
            <RenderChatMessage item={item} userCache={authors} />
          </Swipeable>
        </Pressable>
      );
    },
    [authors, setReply, keyExtractor],
  );

  if (!chat || !authors)
    return (
      <View style={[atoms.flex.shrink[1]]}>
        <Text>Loading chaat...</Text>
      </View>
    );

  return (
    <View style={[atoms.flex.shrink[1]]}>
      <FlatList
        style={[atoms.flex.grow[1], atoms.flex.shrink[1], atoms.w.percent[100]]}
        data={chat.slice(0, shownMessages)}
        inverted={true}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        initialNumToRender={20}
        updateCellsBatchingPeriod={50}
      />
    </View>
  );
}
