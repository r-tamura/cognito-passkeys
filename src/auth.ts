import { Auth } from "aws-amplify";
import { configureAuth } from "react-query-auth";

type AuthError = {
  code: string;
  messsage: string;
};

type CognitoUser = {};

type LoginParams = {
  username: string;
  password: string;
};

type RegisterParams = {
  username: string;
  password: string;
  publicKeyCred: string;
};

type AmplifyError = {
  code: string;
  message: string;
};

export const isAmplifyAuthError = (err: unknown): err is AmplifyError => {
  return (
    typeof err === "object" &&
    err != null &&
    "code" in err &&
    typeof err["code"] === "string" &&
    "message" in err &&
    typeof err["message"] === "string"
  );
};

const CUSTOM_ATTR_PUBLICK_KEY_NAME = "publicKeyCred";

export const { useUser, useLogin, useRegister, useLogout, AuthLoader } =
  configureAuth<CognitoUser, AuthError, LoginParams, RegisterParams>({
    userFn: async () => {
      console.log("current user");
      try {
        const cognitoUser = await Auth.currentAuthenticatedUser();
        console.log({ cognitoUser });
        return cognitoUser;
      } catch (err: unknown) {
        if (isAmplifyAuthError(err)) {
          console.error(`${err.code}: ${err.message}`);
        } else {
          console.error(`unexpected error occured: ${err}"`);
        }
        return null;
      }
    },
    loginFn: async (credentials) => {
      const cognitoUser = await Auth.signIn(
        credentials.username,
        credentials.password
      );
      return cognitoUser;
    },
    registerFn: async (credentials) => {
      await Auth.signUp({
        username: credentials.username,
        password: credentials.password,
        attributes: {
          [`custom:${CUSTOM_ATTR_PUBLICK_KEY_NAME}`]: "testpublickey",
        },
        autoSignIn: {
          enabled: true,
        },
      });
      return credentials;
    },
    logoutFn: () => Auth.signOut(),
  });
