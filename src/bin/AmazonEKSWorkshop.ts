#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { VpcStack } from '../lib/vpc-stack';
import { EksStack } from '../lib/eks-stack';
import { EksNodegroupStack } from '../lib/eks-nodegroup-stack';

const app = new cdk.App();

// const account = app.node.tryGetContext('account') || process.env.CDK_INTEG_ACCOUNT || process.env.CDK_DEFAULT_ACCOUNT;
const env = {account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION};

console.log('accountId: ', env.account);
console.log('region: ', env.region);


const vpcStack = new VpcStack(
  app,
  "AmazonEksCdkWorkshopVpcStack",
  {
    prefixName: "EksCdkWorkshop",
    cidr: "10.0.0.0/16",
    maxAzs: 2,
    env: env,
  }
  // description: 'VPC Stack'
);

const eksStack = new EksStack(app, 'AmazonEksCdkWorkshopEksStack', {
  prefixName: 'EksCdkWorkshop',
  vpc: vpcStack.vpc,
  env: env,
});

const eksNodegroupStack = new EksNodegroupStack(
  app,
  "AmazonEksCdkWorkshopEksNgJobsStack",
  {
    prefixName: "EksCdkWorkshop",
    cluster: eksStack.cluster,
    env: env,
  }
);

app.synth();
