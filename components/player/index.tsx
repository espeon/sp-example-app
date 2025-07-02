import {
  LivestreamProvider,
  Player as PlayerInner,
  PlayerProps,
  PlayerProvider,
} from "@streamplace/components";
import { MyPlayerUI } from "./ui"; // Custom UI component for player controls

export function Player(props: Partial<PlayerProps>) {
  return (
    <LivestreamProvider src={props.src ?? ""}>
      <PlayerProvider defaultId={props.playerId || undefined}>
        <PlayerInner {...props} />
        <MyPlayerUI />
      </PlayerProvider>
    </LivestreamProvider>
  );
}
