import { resolveFromIdentity } from "~/lib/atp/pid";
import { Agent } from "@atproto/api";
import { ProfileViewDetailed } from "@atproto/api/dist/client/types/app/bsky/actor/defs";
import { OAuthSession } from "@atproto/oauth-client";

import * as Lexicons from "streamplace";

import createOAuthClient, { AquareumOAuthClient } from "../lib/atp/oauth";
import { StateCreator } from ".";

export interface AllProfileViews {
  bsky: null | ProfileViewDetailed;
  // todo: teal profile view
}

export interface AuthenticationSlice {
  auth: AquareumOAuthClient;
  status: "start" | "loggedIn" | "loggedOut";
  oauthState: null | string;
  oauthSession: null | OAuthSession;
  unauthedAgent: Agent;
  pdsAgent: null | Agent;
  isAgentReady: boolean;
  profiles: { [key: string]: AllProfileViews };
  client: null | AquareumOAuthClient;
  login: {
    loading: boolean;
    error: null | string;
  };
  pds: null | {
    url: string;
    loading: boolean;
    error: null | string;
  };
  getAgent: () => Agent | null;
  getLoginUrl: (handle: string) => Promise<URL | null>;
  oauthCallback: (state: URLSearchParams) => Promise<void>;
  restorePdsAgent: () => void;
  logOut: () => void;
  populateLoggedInProfile: () => Promise<void>;
}

export const createAuthenticationSlice: StateCreator<AuthenticationSlice> = (
  set,
  get,
) => {
  // check if we have CF_PAGES_URL set. if not, use localhost
  const baseUrl = process.env.EXPO_PUBLIC_BASE_URL || "http://localhost:8081";
  console.log("Using base URL:", baseUrl);
  const initialAuth = createOAuthClient(baseUrl, "bsky.social");

  console.log("Auth client created!");

  return {
    auth: initialAuth,
    status: "start",
    oauthState: null,
    oauthSession: null,
    unauthedAgent: new Agent("https://stream.place"),
    pdsAgent: null,
    isAgentReady: false,
    profiles: {},
    client: null,
    login: {
      loading: false,
      error: null,
    },
    pds: null,

    getAgent: () => {
      const agent = get().pdsAgent;
      if (!agent) {
        const unauthedAgent = get().unauthedAgent;
        return unauthedAgent;
      }
      return agent;
    },

    getLoginUrl: async (handle: string) => {
      try {
        // resolve the handle to a PDS URL
        const r = resolveFromIdentity(handle);
        let auth = createOAuthClient(baseUrl, (await r).pds.hostname);
        const url = await auth.authorize(handle);
        set({
          auth,
          pds: {
            url: url.toString(),
            loading: false,
            error: null,
          },
        });
        return url;
      } catch (error) {
        console.error("Failed to get login URL:", error);
        return null;
      }
    },

    oauthCallback: async (state: URLSearchParams) => {
      try {
        if (!(state.has("code") && state.has("state") && state.has("iss"))) {
          throw new Error("Missing params, got: " + state);
        }
        // are we already logged in?
        if (get().status === "loggedIn") {
          return;
        }
        const { session, state: oauthState } =
          await initialAuth.callback(state);
        const agent = new Agent(session);
        set({
          // TODO: fork or update auth lib
          oauthSession: session as any,
          oauthState,
          status: "loggedIn",
          pdsAgent: addDocs(agent),
          isAgentReady: true,
        });
        get().populateLoggedInProfile();
      } catch (error: any) {
        console.error("OAuth callback failed:", error);
        set({
          status: "loggedOut",
          login: {
            loading: false,
            error:
              (error?.message as string) ||
              "Unknown error during OAuth callback",
          },
        });
      }
    },
    restorePdsAgent: async () => {
      let did = get().oauthSession?.sub;
      if (!did) {
        //
        // throw new Error("No session");
        return;
      }
      try {
        // restore session
        let sess = await initialAuth.restore(did);

        if (!sess) {
          throw new Error("Failed to restore session");
        }

        const agent = new Agent(sess);

        set({
          pdsAgent: addDocs(agent),
          isAgentReady: true,
          status: "loggedIn",
        });
        get().populateLoggedInProfile();
        console.log("Restored agent");
      } catch (error) {
        console.error("Failed to restore agent:", error);
        get().logOut();
      }
    },
    logOut: () => {
      console.log("Logging out");
      let profiles = { ...get().profiles };
      // TODO: something better than 'delete'
      delete profiles[get().pdsAgent?.did ?? ""];
      set({
        status: "loggedOut",
        oauthSession: null,
        oauthState: null,
        profiles,
        pdsAgent: null,
        client: null,
        pds: null,
      });
    },
    populateLoggedInProfile: async () => {
      console.log("Populating logged in profile");
      const agent = get().pdsAgent;
      if (!agent) {
        throw new Error("No agent");
      }
      if (!agent.did) {
        throw new Error("No agent did! This is bad!");
      }
      try {
        let bskyProfile = await agent
          .getProfile({ actor: agent.did })
          .then((profile) => {
            console.log(profile);
            return profile.data || null;
          });
      } catch (error) {
        console.error("Failed to get profile:", error);
      }
    },
  };
};

function addDocs(agent: Agent) {
  Lexicons.schemas
    .filter((schema) => !schema.id.startsWith("app.bsky."))
    .map((schema) => {
      try {
        agent.lex.add(schema);
      } catch (e) {
        console.error("Failed to add schema:", e);
      }
    });
  return agent;
}
