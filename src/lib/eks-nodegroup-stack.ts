import  * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as eks from 'aws-cdk-lib/aws-eks';
import { PhysicalName } from 'aws-cdk-lib/core';
import { Construct } from 'constructs';

interface EksNodegroupStackProps extends cdk.StackProps {
  prefixName: string,
  cluster: eks.Cluster;
}

export class EksNodegroupStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: EksNodegroupStackProps) {
    super(scope, id, props);

    const cluster = props?.cluster!;
    const nodegroupName = `${props?.prefixName}-Jobs-nodegroup`;

    const workerRole = this.createNodegroupRole(
      `${props?.prefixName}-Jobs-WorkerRole`
    );

    const nodegroup = new eks.Nodegroup(this, nodegroupName, {
      cluster: cluster,
      nodegroupName: nodegroupName,
      nodeRole: workerRole,
      subnets: { subnetGroupName: "PrivateSubnet" },

      instanceTypes: [new ec2.InstanceType("t2.medium")],
      minSize: 1,
      maxSize: 2,
      desiredSize: 1,
      diskSize: 20,
      capacityType: eks.CapacityType.ON_DEMAND,
      amiType: eks.NodegroupAmiType.AL2_X86_64,
    });

    // Add tags to all assets within this stack
    cdk.Tags.of(this).add("CreatedBy", "CDK", { priority: 300 });
    cdk.Tags.of(this).add("Project", "AmazonEksCdkWorkshop", { priority: 300 });
    cdk.Tags.of(this).add("Owner", "Ashish Patel", { priority: 300 });
  }

  // Create Nodegroup IAM role
  public createNodegroupRole(id: string): iam.Role {
    const role = new iam.Role(this, id, {
      assumedBy: new iam.ServicePrincipal("ec2.amazonaws.com"),
    });

    role.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonEKSWorkerNodePolicy")
    );
    role.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        "AmazonEC2ContainerRegistryReadOnly"
      )
    );
    role.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonEKS_CNI_Policy")
    );

    return role;
  }
}
