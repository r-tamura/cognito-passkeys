import {
  Box,
  Button,
  ChakraProvider,
  FormControl,
  FormLabel,
  Input,
  VStack,
} from "@chakra-ui/react";
import { Amplify, Auth } from "aws-amplify";
import { useRef } from "react";
import awsConfig from "./aws-exports";

Amplify.configure(awsConfig);

const CUSTOM_ATTR_PUBLICK_KEY_NAME = "publicKeyCred";

const SignUp: React.FC = () => {
  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("signup");

    const response = await Auth.signUp({
      username: usernameRef.current?.value ?? "",
      password: passwordRef.current?.value ?? "",
      attributes: {
        [`custom:${CUSTOM_ATTR_PUBLICK_KEY_NAME}`]: "testpublickey",
      },
      autoSignIn: {
        enabled: true,
      },
    });
    /*
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
    console.log({ response });
  };
  return (
    <Box maxInlineSize={"48"} marginInline={"auto"}>
      <form onSubmit={handleSubmit}>
        <VStack gap={"4"}>
          <FormControl>
            <FormLabel>User name</FormLabel>
            <Input
              id="username"
              name="username"
              type="text"
              ref={usernameRef}
            />
          </FormControl>
          <FormControl>
            <FormLabel>Password</FormLabel>
            <Input
              id="password"
              name="password"
              type="password"
              ref={passwordRef}
            />
          </FormControl>
          <Button type="submit" marginInlineStart={"auto"}>
            SIGN UP
          </Button>
        </VStack>
      </form>
    </Box>
  );
};

const SignIn: React.FC = () => {
  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const cognitoUser = await Auth.signIn({
      username: usernameRef.current?.value ?? "",
      password: passwordRef.current?.value ?? "",
    });
    console.log({ cognitoUser });
  };

  return (
    <Box maxInlineSize={"48"} marginInline={"auto"}>
      <form onSubmit={handleSubmit}>
        <VStack gap={"4"}>
          <FormControl>
            <FormLabel>User name</FormLabel>
            <Input name="username" type="text" ref={usernameRef} />
          </FormControl>
          <FormControl>
            <FormLabel>Password</FormLabel>
            <Input name="password" type="password" ref={passwordRef} />
          </FormControl>
          <Button type="submit" marginInlineStart={"auto"}>
            SIGN IN
          </Button>
        </VStack>
      </form>
    </Box>
  );
};

function App() {
  return (
    <Box>
      <SignUp />
      <SignIn />
    </Box>
  );
}

const Root: React.FC = () => {
  return (
    <ChakraProvider>
      <App />
    </ChakraProvider>
  );
};

export default Root;
