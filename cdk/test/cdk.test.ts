import * as cdk from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { IdpStack } from "../lib/IdpStack";

test("Snapshot Test", () => {
  const app = new cdk.App();
  // WHEN
  const stack = new IdpStack(app, "MyTestStack");
  const template = Template.fromStack(stack).toJSON();
  // THEN
  expect(template).toMatchSnapshot();
});
