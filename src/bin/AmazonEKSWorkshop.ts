#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { EksStack } from '../lib/eks-stack';
import { VpcStack } from '../lib/vpc-stack';

const app = new cdk.App();

const vpcStack = new VpcStack(app, 'AmazonEksCdkWorkshopVpcStack', {
  prefixName: 'EksCdkWorkshop',
  cidr: '10.0.0.0/16',
  maxAzs: 2,
  
  env: { 
    account: process.env.CDK_DEFAULT_ACCOUNT, 
    region: process.env.CDK_DEFAULT_REGION },
  },
  // description: 'VPC Stack'
);

const eksStack = new EksStack(app, 'AmazonEksCdkWorkshopEksStack', {
  env: { 
    account: process.env.CDK_DEFAULT_ACCOUNT, 
    region: process.env.CDK_DEFAULT_REGION },
  }
);
