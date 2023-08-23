import  * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as eks from 'aws-cdk-lib/aws-eks';
import { PhysicalName } from 'aws-cdk-lib/core';
import { Construct } from 'constructs';

interface EksProps extends cdk.StackProps {
  prefixName: string,
}

export class EksStack extends cdk.Stack {

  constructor(scope: Construct, id: string, props?: EksProps) {
    super(scope, id, props);

    const primaryRegion = 'ap-south-1';


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