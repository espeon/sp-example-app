import "~/global.css";

import {
  DarkTheme,
  DefaultTheme,
  Theme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as React from "react";
import { Appearance, Platform } from "react-native";
import { NAV_THEME } from "~/lib/constants";
import { useColorScheme } from "~/lib/useColorScheme";
import { PortalHost } from "@rn-primitives/portal";
import { ThemeToggle } from "~/components/ThemeToggle";
import { setAndroidNavigationBar } from "~/lib/android-navigation-bar";
import {
  StreamplaceProvider,
  TextContext,
  ThemeProvider as StreamplaceThemeProvider,
} from "wagaga-components-beta-wagaga";
import { useStore } from "~/stores";
import { SafeAreaProvider } from "react-native-safe-area-context";

const LIGHT_THEME: Theme = {
  ...DefaultTheme,
  colors: NAV_THEME.light,
};

const DARK_THEME: Theme = {
  ...DarkTheme,
  colors: NAV_THEME.dark,
};

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

const usePlatformSpecificSetup = Platform.select({
  web: useSetWebBackgroundClassName,
  android: useSetAndroidNavigationBar,
  default: noop,
});

function useTheme() {
  const { colorScheme, setColorScheme } = useColorScheme();

  // what??? how does this not break something
  setColorScheme(colorScheme || "system");

  console.log("Current scheme is", colorScheme);

  return {
    navigationTheme: colorScheme === "dark" ? DARK_THEME : LIGHT_THEME,
    themeName: colorScheme,
  };
}

export default function RootLayout() {
  usePlatformSpecificSetup();
  const { isDarkColorScheme } = useColorScheme();
  const agent = useStore((state) => state.getAgent());

  let theme = useTheme();

  return (
    <SafeAreaProvider>
      <ThemeProvider value={theme.navigationTheme}>
        <StreamplaceThemeProvider forcedTheme={theme.themeName}>
          <StreamplaceProvider
            url={"https://stream.place"}
            oauthSession={agent?.sessionManager}
          >
            <TextContext.Provider value={{ fontFamily: "Courier New" }}>
              <StatusBar style={isDarkColorScheme ? "light" : "dark"} />
              <Stack>
                <Stack.Screen
                  name="index"
                  options={{
                    title: "Starter Base",
                    headerRight: () => <ThemeToggle />,
                  }}
                />
              </Stack>
              <PortalHost />
            </TextContext.Provider>
          </StreamplaceProvider>
        </StreamplaceThemeProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const useIsomorphicLayoutEffect =
  Platform.OS === "web" && typeof window === "undefined"
    ? React.useEffect
    : React.useLayoutEffect;

function useSetWebBackgroundClassName() {
  useIsomorphicLayoutEffect(() => {
    // Adds the background color to the html element to prevent white background on overscroll.
    document.documentElement.classList.add("bg-background");
  }, []);
}

function useSetAndroidNavigationBar() {
  React.useLayoutEffect(() => {
    setAndroidNavigationBar(Appearance.getColorScheme() ?? "light");
  }, []);
}

function noop() {}
