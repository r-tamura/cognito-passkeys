#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import "source-map-support/register";
import { IdpStack } from "../lib/IdpStack";

const app = new cdk.App();
new IdpStack(app, "IdpStack", {});
