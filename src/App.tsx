import {
  Box,
  Button,
  ChakraProvider,
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
import { Home } from "./Home";
import {
  AuthLoader,
  isAmplifyAuthError,
  useLogin,
  useLogout,
  useRegister,
} from "./auth";

Amplify.configure({
  Auth: {
    userPoolId: import.meta.env.VITE_AMAZON_COGNITO_USERPOOL_ID,
    userPoolWebClientId: import.meta.env.VITE_AMAZON_COGNITO_APP_ID,
  },
});

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

export const Header: React.FC = () => {
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

const Index: React.FC = () => {
  return <Navigate to="/signin" />;
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

const App: React.FC = () => {
  return (
    <ChakraProvider>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ChakraProvider>
  );
};

export default App;
