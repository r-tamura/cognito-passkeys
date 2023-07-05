import {
  Box,
  Button,
  ChakraProvider,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Amplify } from "aws-amplify";
import React, { useRef } from "react";
import {
  Link,
  Navigate,
  RouterProvider,
  createBrowserRouter,
  useNavigate,
} from "react-router-dom";
import {
  AuthLoader,
  isAmplifyAuthError,
  useLogin,
  useLogout,
  useRegister,
} from "./auth";
import awsConfig from "./aws-exports";

Amplify.configure(awsConfig);

const SignUp: React.FC = () => {
  const register = useRegister();
  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.debug("signup start");

    register.mutate(
      {
        username: usernameRef.current?.value ?? "",
        password: passwordRef.current?.value ?? "",
        publicKeyCred: "testpublickey",
      },
      {
        onSuccess: (cognitoUser) => {
          console.log({ cognitoUser });
          console.debug("signup end");
          navigate("/signin");
        },
        onError: (err: unknown) => {
          if (isAmplifyAuthError(err)) {
            console.error(err.message);
            navigate("/signin");
          } else {
            console.error("unknown error", err);
          }
        },
      }
    );

    // try {
    //   const response = await Auth.signUp({
    //     username: usernameRef.current?.value ?? "",
    //     password: passwordRef.current?.value ?? "",
    //     attributes: {
    //       [`custom:${CUSTOM_ATTR_PUBLICK_KEY_NAME}`]: "testpublickey",
    //     },
    //     autoSignIn: {
    //       enabled: true,
    //     },
    //   });
    //   console.log({ response });
    //   console.debug("signup end");
    //   navigate("/signin");
    // } catch (err: unknown) {
    //   if (isAmplifyError(err)) {
    //     console.error(err.message);
    //     navigate("/signin");
    //   } else {
    //     console.error("unknown error", err);
    //   }
    // }

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
  const login = useLogin();
  const navigate = useNavigate();
  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    login.mutate(
      {
        username: usernameRef.current?.value ?? "",
        password: passwordRef.current?.value ?? "",
      },
      {
        onSuccess: (cognitoUser) => {
          console.log({ cognitoUser });
          console.debug("signup end");
          navigate("/home");
        },
        onError: (err: unknown) => {
          if (isAmplifyAuthError(err)) {
            console.error(err.message);
          } else {
            console.error("unknown error", err);
          }
        },
      }
    );
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
          <HStack>
            <Link to="/signup">or sign up?</Link>
            <Button type="submit" marginInlineStart={"auto"}>
              SIGN IN
            </Button>
          </HStack>
        </VStack>
      </form>
    </Box>
  );
};

const Header: React.FC = () => {
  const logout = useLogout();
  const navigate = useNavigate();

  const handleSingOut = () => {
    logout.mutate(
      {},
      {
        onSuccess: () => {
          navigate("/signin");
        },
      }
    );
  };

  return (
    <Flex h={"16"} w={"full"} alignItems={"center"} p={"4"}>
      <Text marginInlineEnd="auto">
        Password less authentication with Amazon Cognito demo
      </Text>
      <Flex
        marginInlineStart="auto"
        justifyContent={"center"}
        alignItems={"center"}
        h={"full"}
        gap={"2"}
      >
        <Box>
          <Button onClick={handleSingOut}>Sign out</Button>
        </Box>
      </Flex>
    </Flex>
  );
};

const Home: React.FC = () => {
  const onPassKeyRemove = () => {
    console.log("passkey remove clicked");
  };

  return (
    <Box>
      <Header />
      <Flex
        direction={"column"}
        m={"0 auto"}
        maxInlineSize={"540px"}
        p={"4"}
        gap={"4"}
      >
        <Box p={"2"}>Email: random@mail.local</Box>
        <Divider />
        <Box p={"2"}>
          <Box marginBlockEnd="2">
            <Text fontWeight={"bold"}>Passkeys</Text>
          </Box>
          <Flex direction={"column"} inlineSize={"full"}>
            <Flex alignItems={"center"} gap={"4"} inlineSize={"full"}>
              <Text>Passkey 1</Text>
              <Button onClick={onPassKeyRemove} marginInlineStart={"auto"}>
                Remove
              </Button>
            </Flex>
          </Flex>
        </Box>
      </Flex>
    </Box>
  );
};

const Index: React.FC = () => {
  return <Navigate to="/signin" />;
};

const App: React.FC = () => {
  return <></>;
};

const AuthRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AuthLoader
      renderLoading={() => <p>loading...</p>}
      renderUnauthenticated={() => <Navigate to="/signin" />}
    >
      {children}
    </AuthLoader>
  );
};

const router = createBrowserRouter([
  {
    path: "/",
    element: <Index />,
  },
  {
    path: "/signup",
    element: <SignUp />,
  },
  { path: "/signin", element: <SignIn /> },
  {
    path: "/home",
    element: (
      <AuthRoute>
        <Home />
      </AuthRoute>
    ),
  },
]);

const queryClient = new QueryClient();

const Providers: React.FC = () => {
  return (
    <ChakraProvider>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ChakraProvider>
  );
};

export default Providers;
