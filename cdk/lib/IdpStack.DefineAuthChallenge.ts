/**
 * 1- if user doesn't exist, throw exception
 * 2- if CUSTOM_CHALLENGE answer is correct, authentication successful
 * 3- if PASSWORD_VERIFIER challenge answer is correct, return custom challeneg (3,4 will be appliable if password+fido is selected)
 * 4- if challenge name is SRP_A, return PASSWORD_VERIFIER challenge (3,4 will be appliable if password+fido is selected)
 * 5- if 5 attempts with no correct answer, fail authentication
 * 6- default is to respond with CUSTOM_CHALLENEG --> password-less authentication
 * */

// refer: https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-lambda-define-auth-challenge.html

type ChallengeName =
  | "CUSTOM_CHALLENGE"
  | "SRP_A"
  | "PASSWORD_VERIFIER"
  | "SMS_MFA"
  | "DEVICE_SRP_AUTH"
  | "DEVICE_PASSWORD_VERIFIER"
  | "ADMIN_NO_SRP_AUTH.";

type ChallengeResult = {
  challengeName: ChallengeName;
  challengeResult: boolean;
  challengeMetadata: string;
};
interface DefineAuthChallentgeEvent {
  request: {
    userAttributes: Record<string, string>;
    session: ChallengeResult[];
    clientMetadata: Record<string, string>;
    userNotFound: boolean;
  };
  response: {
    challengeName: string;
    issueTokens: boolean;
    failAuthentication: boolean;
  };
}

export async function handler(event: DefineAuthChallentgeEvent, context: any) {
  const request = event.request;

  console.log(
    JSON.stringify({
      event,
      context,
    })
  );

  // If user is not registered
  if (request.userNotFound) {
    event.response.issueTokens = false;
    event.response.failAuthentication = true;
    throw new Error("User does not exist");
  }

  if (
    request.session &&
    request.session.length > 0 &&
    request.session.at(-1)?.challengeName === "CUSTOM_CHALLENGE" &&
    request.session.at(-1)?.challengeResult === true
  ) {
    // 3
    // カスタム認証が成功したらトークンを発行する
    event.response.issueTokens = true;
    event.response.failAuthentication = false;
  } else if (
    request.session &&
    request.session.length > 0 &&
    request.session.at(-1)?.challengeName === "PASSWORD_VERIFIER" &&
    request.session.at(-1)?.challengeResult === true
  ) {
    // 2
    // CreateAuthChallenge/VerifyAuthChallengeResponseでカスタム認証を行う
    event.response.issueTokens = false;
    event.response.failAuthentication = false;
    event.response.challengeName = "CUSTOM_CHALLENGE";
  } else if (
    request.session &&
    request.session.length > 0 &&
    request.session.at(-1)?.challengeName === "SRP_A"
  ) {
    // 1
    // Cognito側でパスワード認証する
    event.response.issueTokens = false;
    event.response.failAuthentication = false;
    event.response.challengeName = "PASSWORD_VERIFIER";
  } else if (
    request.session.length >= 5 &&
    request.session.at(-1)?.challengeResult === false
  ) {
    event.response.issueTokens = false;
    event.response.failAuthentication = true;
  } else {
    event.response.issueTokens = false;
    event.response.failAuthentication = false;
    event.response.challengeName = "CUSTOM_CHALLENGE";
  }

  return event;
}
