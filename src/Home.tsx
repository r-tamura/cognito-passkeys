import { Box, Button, Divider, Flex, Text } from "@chakra-ui/react";
import { useMutation } from "@tanstack/react-query";
import { hc } from "hono/client";
import React from "react";
import { AppType } from "../functions/api/[[routes]]";
import { Header } from "./App";
import { useUser } from "./auth";
import { decodeServerOptions, encodeCredential } from "./webauthn";

function invariant(
  condition: unknown,
  message: string = "invariant error occured"
): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function invariantPublicKey(
  cred: Credential | null
): asserts cred is PublicKeyCredential {
  invariant(cred !== null);
}

export const Home: React.FC = () => {
  const client = hc<AppType>("/");
  const { data: user } = useUser();
  const requestRegister = useMutation({
    mutationKey: ["register/request"],
    mutationFn: async () => {
      if (user === undefined) {
        throw new Error("user is undefined");
      }
      const idToken = user
        .getSignInUserSession()
        ?.getIdToken()
        .getJwtToken()
        .toString();
      if (idToken === undefined) {
        throw new Error("idToken is undefined");
      }
      const encodedServerOptions = await client.api.register.request
        .$post(undefined, { headers: { Authorization: idToken } })
        .then((res) => res.json());

      const serverOptions = decodeServerOptions(encodedServerOptions);
      console.log(serverOptions);

      const publicKeyCred = await navigator.credentials.create({
        publicKey: serverOptions,
      });

      invariantPublicKey(publicKeyCred);
      const encodePublicKeyCred = encodeCredential(publicKeyCred);

      await client.api.register.response.$post(
        {
          json: encodePublicKeyCred,
        },
        { headers: { Authorization: idToken } }
      );

      return null;
    },
  });
  const onPassKeyRemove = () => {
    console.log("passkey remove clicked");
  };

  const onCreateNewKey = () => {
    requestRegister.mutate();
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
          <Flex w="full" marginBlockEnd="2">
            <Box>
              <Text fontWeight={"bold"}>Passkeys</Text>
            </Box>
            <Box onClick={onCreateNewKey} marginInlineStart={"auto"}>
              <Button>新しいキーを追加</Button>
            </Box>
          </Flex>

          <Flex direction={"column"} inlineSize={"full"}>
            <Flex alignItems={"center"} gap={"4"} inlineSize={"full"}>
              <Text>Passkey 1</Text>
              <Button onClick={onPassKeyRemove} marginInlineStart={"auto"}>
                Remove
              </Button>
            </Flex>
          </Flex>
        </Box>
        <Box>
          {requestRegister.isLoading ? "loading..." : requestRegister.data}
        </Box>
      </Flex>
    </Box>
  );
};
