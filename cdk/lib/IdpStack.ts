import * as cdk from "aws-cdk-lib";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as lambdaNodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as logs from "aws-cdk-lib/aws-logs";
import { Construct } from "constructs";

const CUSTOM_ATTR_PUBLICK_KEY_NAME = "publicKeyCred";
export class IdpStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const preSignUp = new UserPoolCustomAuthLambda(this, "PreSignUp", {
      name: "PreSignUp",
    });
    const defineAuthChallenge = new UserPoolCustomAuthLambda(
      this,
      "DefineAuthChallenge",
      { name: "DefineAuthChallenge" }
    );

    const createAuthChallenge = new UserPoolCustomAuthLambda(
      this,
      "CreateAuthChallenge",
      { name: "CreateAuthChallenge" }
    );

    const verifyAuthChallenge = new UserPoolCustomAuthLambda(
      this,
      "VerifyAuthChallenge",
      { name: "VerifyAuthChallenge" }
    );

    // Note: 自動生成されるリソース名にStack名が含まれない
    const userpool = new cognito.UserPool(this, `${id}-UserPool`, {
      selfSignUpEnabled: true,
      passwordPolicy: {
        minLength: 6,
        requireLowercase: false,
        requireUppercase: false,
        requireDigits: false,
        requireSymbols: false,
      },
      customAttributes: {
        [CUSTOM_ATTR_PUBLICK_KEY_NAME]: new cognito.StringAttribute(),
      },
      lambdaTriggers: {
        preSignUp: preSignUp.triggerFn, // Confirmationを自動化するため
        defineAuthChallenge: defineAuthChallenge.triggerFn,
        createAuthChallenge: createAuthChallenge.triggerFn,
        verifyAuthChallengeResponse: verifyAuthChallenge.triggerFn,
      },
    });
    userpool.addClient(`${id}-UserPoolClient`, {
      authFlows: {
        custom: true,
        userSrp: true,
        adminUserPassword: true,
      },
    });

    new cdk.CfnOutput(this, "UserPoolId", { value: userpool.userPoolId });
  }
}

interface LambdaLogGroupProps {
  name: string;
}

class UserPoolCustomAuthLambda extends Construct {
  readonly triggerFn: lambdaNodejs.NodejsFunction;

  constructor(scope: Construct, id: string, { name }: LambdaLogGroupProps) {
    super(scope, id);
    this.triggerFn = new lambdaNodejs.NodejsFunction(this, name);
    new logs.LogGroup(this, "LogGroup", {
      logGroupName: `/aws/lambda/${this.triggerFn.functionName}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      retention: logs.RetentionDays.ONE_DAY,
    });
  }
}
