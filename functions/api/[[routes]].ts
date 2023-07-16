import {
  AdminUpdateUserAttributesCommand,
  CognitoIdentityProviderClient,
} from "@aws-sdk/client-cognito-identity-provider";
import { zValidator } from "@hono/zod-validator";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";
import { isoBase64URL } from "@simplewebauthn/server/helpers";
import { CognitoJwtVerifier } from "aws-jwt-verify";
import { Hono } from "hono";
import { handle } from "hono/cloudflare-pages";
import { getCookie, setCookie } from "hono/cookie";
import z from "zod";
const app = new Hono();

const CUSTOM_ATTR_PUBLIC_KEY_NAME = "publicKeyCred";

const envSchema = z.object({
  AWS_ACCESS_KEY_ID: z.string(),
  AWS_SECRET_ACCESS_KEY: z.string(),
  AMAZON_COGNITO_USERPOOL_ID: z.string(),
  AMAZON_COGNITO_APP_ID: z.string(),
});
type Env = z.infer<typeof envSchema>;

const errorSchema = z.object({
  message: z.string(),
  name: z.string(),
});

function invariant(
  condition: unknown,
  message: string = "invariant error occured"
): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function parseError(err: unknown) {
  const result = errorSchema.safeParse(err);
  if (result.success) {
    return result.data;
  } else {
    return null;
  }
}

function parseEnv(env: unknown): Env | null {
  const result = envSchema.safeParse(env);
  if (result.success) {
    return result.data;
  } else {
    return null;
  }
}

async function jwt({
  idTokenRaw,
  userPoolId,
  clientId,
}: {
  idTokenRaw: string;
  userPoolId: string;
  clientId: string;
}) {
  const verifier = CognitoJwtVerifier.create({
    userPoolId: userPoolId,
    tokenUse: "id",
    clientId: clientId,
  });
  invariant(typeof idTokenRaw === "string");
  const payload = await (verifier as any).verify(idTokenRaw);

  const idToken = cognitoIdTokenSchema.parse(payload);
  return idToken;
}

type PublicKeyCredential = {
  id: string;
  name: string;
  publicKey: string;
  transports: string[];
};

type AwsCredentials = {
  accessKeyId: string;
  secretAccessKey: string;
};

async function createPasskey({
  userPoolId,
  username,
  publicKeyCred,
  credentials,
}: {
  userPoolId: string;
  username: string;
  publicKeyCred: PublicKeyCredential;
  credentials: AwsCredentials;
}) {
  const cognitoClient = new CognitoIdentityProviderClient({
    region: "ap-northeast-1",
    credentials,
  });

  const base64PublicKeyCredential = isoBase64URL.fromString(
    JSON.stringify(publicKeyCred)
  );

  const params = {
    UserPoolId: userPoolId,
    Username: username,
    UserAttributes: [
      {
        Name: `custom:${CUSTOM_ATTR_PUBLIC_KEY_NAME}`,
        Value: base64PublicKeyCredential,
      },
    ],
  };
  const command = new AdminUpdateUserAttributesCommand(params);

  try {
    const result = await cognitoClient.send(command);
    return result;
  } catch (err) {
    console.error(err);
    throw err;
  }
}

function getHostFromOrigin(origin: string) {
  const url = new URL(origin);
  return url.hostname;
}

const registerResponseRequestSchema = z.object({
  id: z.string(),
  rawId: z.string(),
  response: z.object({
    attestationObject: z.string(),
    clientDataJSON: z.string(),
    transports: z.array(z.string()),
  }),
  type: z.string(),
});

export type RegistrationResponseRequestSchema = z.infer<
  typeof registerResponseRequestSchema
>;

// https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-using-the-id-token.html
const cognitoIdTokenSchema = z.object({
  sub: z.string(),
  "cognito:groups": z.optional(z.array(z.string())),
  "cognito:roles": z.optional(z.array(z.string())),
  "cognito:preferred_role": z.optional(z.string()),
  "cognito:username": z.string(),
  email_verified: z.optional(z.boolean()),
  iss: z.string(),
  origin_jti: z.string(),
  aud: z.string(),
  event_id: z.string(),
  token_use: z.string(),
  auth_time: z.number(),
  exp: z.number(),
  iat: z.number(),
  jti: z.string(),
});

const route = app
  .post("/api/register/request", async (ctx) => {
    let idToken: z.infer<typeof cognitoIdTokenSchema>;
    const env = parseEnv(ctx.env);
    invariant(env != null, "env should not be null");
    const idTokenRaw = ctx.req.header("authorization");
    invariant(idTokenRaw != null, "idTokenRaw should not be null");

    try {
      idToken = await jwt({
        userPoolId: env.AMAZON_COGNITO_USERPOOL_ID,
        clientId: env.AMAZON_COGNITO_APP_ID,
        idTokenRaw,
      });
    } catch (err) {
      const error = parseError(err);
      if (error) {
        return ctx.json(error.message, 400);
      } else {
        return ctx.jsonT("unknown error", 500);
      }
    }

    const origin = ctx.req.header("origin");
    invariant(typeof origin === "string");
    const rpID = getHostFromOrigin(origin);
    try {
      generateRegistrationOptions;
      const options = generateRegistrationOptions({
        rpName: "Cognito Passkeys",
        rpID: rpID,
        userID: idToken.sub,
        userName: idToken["cognito:username"],
      });

      // TODO: データベースでユーザごとに管理する
      setCookie(ctx, "challenge", options.challenge);
      return ctx.json(options);
    } catch (err: unknown) {
      const error = parseError(err);
      if (error) {
        return ctx.json(error, 400);
      }
      return ctx.jsonT("unknown error", 500);
    }
  })
  .post(
    "/api/register/response",
    zValidator("json", registerResponseRequestSchema),
    async (ctx) => {
      const env = parseEnv(ctx.env);
      invariant(env != null, "'env' should not be null");
      const idTokenRaw = ctx.req.header("authorization");
      invariant(idTokenRaw != null, "'idTokenRaw' should not be null");
      let idToken: z.infer<typeof cognitoIdTokenSchema>;
      try {
        idToken = await jwt({
          userPoolId: env.AMAZON_COGNITO_USERPOOL_ID,
          clientId: env.AMAZON_COGNITO_APP_ID,
          idTokenRaw,
        });
      } catch (err) {
        invariant(typeof err === "object" && err != null);
        const error = parseError(err);
        if (error) {
          return ctx.json(error.message, 400);
        } else {
          return ctx.jsonT("unknown error", 500);
        }
      }

      // 登録チャレンジのレスポンス
      const registrationResponse =
        await ctx.req.json<RegistrationResponseRequestSchema>();

      // TODO: データベースでユーザごとに管理する
      const challengeGeneratedByServer = getCookie(ctx, "challenge");
      invariant(typeof challengeGeneratedByServer === "string");
      const expectedOrigin = ctx.req.header("origin");
      invariant(typeof expectedOrigin === "string");
      const expectedRPID = getHostFromOrigin(expectedOrigin);
      const { verified, registrationInfo } = await verifyRegistrationResponse({
        // TODO: @simplewebauthn/serverのresponseに従った型を検証する
        response: registrationResponse as any,
        expectedChallenge: challengeGeneratedByServer,
        expectedOrigin,
        expectedRPID,
      });

      if (!verified) {
        return new Response(JSON.stringify({ error: "VERIFICATION_FAILED" }), {
          status: 200,
        });
      }
      invariant(
        typeof registrationInfo === "object" && registrationInfo != null
      );

      const { credentialPublicKey, credentialID } = registrationInfo;
      const base64CredentialPublicKey =
        isoBase64URL.fromBuffer(credentialPublicKey);
      const base64CredentialId = isoBase64URL.fromBuffer(credentialID);

      const publicKeyCred: PublicKeyCredential = {
        id: base64CredentialId,
        name: "Unnamed Credential",
        publicKey: base64CredentialPublicKey,
        transports: registrationResponse.response.transports,
      };

      await createPasskey({
        userPoolId: env.AMAZON_COGNITO_USERPOOL_ID,
        username: idToken["cognito:username"],
        publicKeyCred: publicKeyCred,
        credentials: {
          accessKeyId: env.AWS_ACCESS_KEY_ID,
          secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
        },
      });

      return new Response("ok");
    }
  );

export type AppType = typeof route;

export const onRequest: PagesFunction<Env> = handle(app);
