import  * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as eks from 'aws-cdk-lib/aws-eks';
import { PhysicalName } from 'aws-cdk-lib/core';
import { Construct } from 'constructs';

interface EksStackProps extends cdk.StackProps {
  prefixName: string,
  vpc: ec2.Vpc;
}

export class EksStack extends cdk.Stack {

  constructor(scope: Construct, id: string, props?: EksStackProps) {
    super(scope, id, props);

    const vpc = props?.vpc;
    const primaryRegion = 'ap-south-1';
    const clusterName = `${props?.prefixName}-cluster`
  }
}

function createDeployRole(scope: Construct, id: string, cluster: eks.Cluster): iam.Role {
  const role = new iam.Role(scope, id, {
    roleName: PhysicalName.GENERATE_IF_NEEDED,
    assumedBy: new iam.AccountRootPrincipal()
  });
  cluster.awsAuth.addMastersRole(role);

  return role;
}