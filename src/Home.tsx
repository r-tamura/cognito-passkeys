import { Box, Button, Divider, Flex, Text } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import { Header } from "./App";

export const Home: React.FC = () => {
  const { data } = useQuery({
    queryKey: ["helloworld"],
    queryFn: async () => {
      return await fetch("/api/helloworld").then((res) => res.text());
    },
  });
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
        <Box>{data ? data : "loading..."}</Box>
      </Flex>
    </Box>
  );
};
