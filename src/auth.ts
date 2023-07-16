import { type CognitoUser } from "amazon-cognito-identity-js";
import { Auth } from "aws-amplify";
import { configureAuth } from "react-query-auth";

type AuthError = {
  code: string;
  messsage: string;
};

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

const CUSTOM_ATTR_PUBLIC_KEY_NAME = "publicKeyCred";

export const { useUser, useLogin, useRegister, useLogout, AuthLoader } =
  configureAuth<CognitoUser, AuthError, LoginParams, RegisterParams>({
    userFn: async () => {
      try {
        const cognitoUser = await Auth.currentAuthenticatedUser();
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
      const result = await Auth.signUp({
        username: credentials.username,
        password: credentials.password,
        attributes: {
          [`custom:${CUSTOM_ATTR_PUBLIC_KEY_NAME}`]: credentials.publicKeyCred,
        },
        autoSignIn: {
          enabled: true,
        },
      });
      return result.user;
    },
    logoutFn: () => Auth.signOut(),
  });
/* Auth.signUp Response sample
{
  "response": {
      "user": {
          "username": "webauthntest",
          "pool": {
              "userPoolId": "...",
              "clientId": "...",
              "client": {
                  "endpoint": "https://cognito-idp.ap-northeast-1.amazonaws.com/",
                  "fetchOptions": {}
              },
              "advancedSecurityDataCollectionFlag": true,
              "storage": {
                  "amplify-auto-sign-in": "true"
              }
          },
          "Session": null,
          "client": {
              "endpoint": "https://cognito-idp.ap-northeast-1.amazonaws.com/",
              "fetchOptions": {}
          },
          "signInUserSession": null,
          "authenticationFlowType": "USER_SRP_AUTH",
          "storage": {
              "amplify-auto-sign-in": "true"
          },
      },
      "userConfirmed": false,
      "userSub": "..."
    }
}
*/
