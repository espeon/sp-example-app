import { $Typed } from "@atproto/api";
import {
  Link,
  Mention,
} from "@atproto/api/dist/client/types/app/bsky/richtext/facet";
import { memo, useCallback } from "react";
import { Linking, View } from "react-native";
import { ChatMessageViewHydrated } from "streamplace";
import { RichtextSegment, segmentize } from "../../lib/facet";
import { borders } from "@streamplace/components";
import { atoms, layout } from "@streamplace/components";

const { flex, gap, ml, mr, opacity, pl, w } = atoms;

interface Facet {
  index: {
    byteStart: number;
    byteEnd: number;
  };
  features: Array<{
    $type: string;
    uri?: string;
    did?: string;
  }>;
}

import { Text } from "../ui/text";

const getRgbColor = (color?: { red: number; green: number; blue: number }) =>
  color ? `rgb(${color.red}, ${color.green}, ${color.blue})` : "$accentColor";

const segmentedObject = (
  obj: RichtextSegment,
  index: number,
  userCache?: Map<string, ChatMessageViewHydrated["chatProfile"]>,
) => {
  if (obj.features && obj.features.length > 0) {
    let ftr = obj.features[0];
    // afaik there shouldn't be a case where facets overlap, at least currently
    if (ftr.$type === "app.bsky.richtext.facet#link") {
      let linkftr = ftr as $Typed<Link>;
      return (
        <Text
          key={`mention-${index}`}
          style={[{ color: atoms.colors.ios.systemBlue, cursor: "pointer" }]}
          onPress={() => Linking.openURL(linkftr.uri || "")}
        >
          {obj.text}
        </Text>
      );
    } else if (ftr.$type === "app.bsky.richtext.facet#mention") {
      let mtnftr = ftr as $Typed<Mention>;
      const profile = userCache?.get(mtnftr.did);
      console.log(profile, mtnftr.did, userCache);
      return (
        <Text
          key={`mention-${index}`}
          style={[
            {
              cursor: "pointer",
              color: getRgbColor(profile?.color),
            },
          ]}
          onPress={() =>
            Linking.openURL(`https://bsky.app/profile/${mtnftr.did || ""}`)
          }
        >
          {obj.text}
        </Text>
      );
    }
  } else {
    return <Text key={`text-${index}`}>{obj.text}</Text>;
  }
};

const RichTextMessage = ({
  text,
  facets,
  userCache,
}: {
  text: string;
  facets: ChatMessageViewHydrated["record"]["facets"];
  userCache?: Map<string, ChatMessageViewHydrated["chatProfile"]>;
}) => {
  if (!facets?.length) return <Text>{text}</Text>;

  let segs = segmentize(text, facets as Facet[]);

  return segs.map((seg, i) => segmentedObject(seg, i, userCache));
};
export const RenderChatMessage = memo(
  function RenderChatMessage({
    item,
    userCache,
  }: {
    item: ChatMessageViewHydrated;
    userCache?: Map<string, ChatMessageViewHydrated["chatProfile"]>;
  }) {
    const formatTime = useCallback((dateString: string) => {
      return new Date(dateString).toLocaleString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    }, []);

    return (
      <>
        {item.replyTo && (
          <View
            style={[
              gap.all[2],
              layout.flex.row,
              w.percent[100],
              borders.left.width.medium,
              borders.left.color.gray[700],
              ml[4],
              pl[4],
              opacity[80],
            ]}
          >
            <Text numberOfLines={1} style={[flex.shrink[1], mr[4]]}>
              <Text
                style={{
                  color: getRgbColor((item.replyTo.chatProfile as any).color),
                  fontWeight: "thin",
                }}
              >
                @{(item.replyTo.author as any).handle}
              </Text>{" "}
              <Text
                style={{
                  color: atoms.colors.gray[300],
                  fontStyle: "italic",
                }}
              >
                {(item.replyTo.record as any).text}
              </Text>
            </Text>
          </View>
        )}
        <View style={[gap.all[2], layout.flex.row, w.percent[100]]}>
          <Text
            style={{
              fontVariant: ["tabular-nums"],
              color: atoms.colors.gray[300],
            }}
          >
            {formatTime(item.record.createdAt)}
          </Text>
          <Text className="text-base" style={[flex.shrink[1]]}>
            <Text
              style={[
                {
                  cursor: "pointer",
                  color: getRgbColor(item.chatProfile?.color),
                },
              ]}
            >
              @{item.author.handle}
            </Text>
            :{" "}
            <RichTextMessage
              text={item.record.text}
              facets={item.record.facets || []}
              userCache={userCache}
            />
          </Text>
        </View>
      </>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.item.author.handle === nextProps.item.author.handle &&
      prevProps.item.record.text === nextProps.item.record.text
    );
  },
);
