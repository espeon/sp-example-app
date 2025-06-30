import { useLocalSearchParams } from "expo-router";
import { Player } from "~/components/player";

export default function Stream() {
  // get handle
  let { handle } = useLocalSearchParams();

  return <Player src={Array.isArray(handle) ? handle[0] : handle} />;
}
