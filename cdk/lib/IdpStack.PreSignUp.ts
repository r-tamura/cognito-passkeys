// [Pre sign-up Lambda trigger - Amazon Cognito](https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-lambda-pre-sign-up.html)
type PreSignUpTriggerEvent = {
  request: {
    userAttributes: Record<string, string>;
    validationData: Record<string, string>;
    clientMetadata: Record<string, string>;
  };
  response: {
    autoConfirmUser: boolean;
    autoVerifyPhone: boolean;
    autoVerifyEmail: boolean;
  };
};

export async function handler(event: PreSignUpTriggerEvent) {
  event.response = {
    autoConfirmUser: true,
    autoVerifyPhone: false,
    autoVerifyEmail: false,
  };
  return event;
}
