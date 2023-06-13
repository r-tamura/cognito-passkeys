import * as cdk from "aws-cdk-lib";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as lambdaNodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as logs from "aws-cdk-lib/aws-logs";
import { Construct } from "constructs";

export class IdpStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

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

    const userpool = new cognito.UserPool(this, "UserPool", {
      lambdaTriggers: {
        defineAuthChallenge: defineAuthChallenge.triggerFn,
        createAuthChallenge: createAuthChallenge.triggerFn,
        verifyAuthChallengeResponse: verifyAuthChallenge.triggerFn,
      },
    });
    userpool.addClient("UserPoolClient", {});

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
