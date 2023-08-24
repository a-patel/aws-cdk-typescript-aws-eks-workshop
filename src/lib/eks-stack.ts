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
  readonly cluster: eks.Cluster;

  constructor(scope: Construct, id: string, props?: EksStackProps) {
    super(scope, id, props);

    const vpc = props?.vpc;
    const clusterName = `${props?.prefixName}-cluster`
    const nodegroupName = `${props?.prefixName}-App-nodegroup`

    const clusterAdminRole = this.createClusterRole(`${props?.prefixName}-ClusterRole`);
    const workerRole = this.createNodegroupRole(`${props?.prefixName}-App-WorkerRole`);

    this.cluster = new eks.Cluster(this, clusterName, {
      clusterName: clusterName,
      version: eks.KubernetesVersion.V1_27,
      vpc: vpc,
      vpcSubnets: [
        { subnetType: ec2.SubnetType.PUBLIC },
        { subnetGroupName: "PrivateSubnet" },
      ],
      mastersRole: clusterAdminRole,
      defaultCapacity: 0,

      endpointAccess: eks.EndpointAccess.PUBLIC_AND_PRIVATE,
    });


    this.cluster.addNodegroupCapacity(nodegroupName, {
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


    // const primaryRegion = 'ap-south-1';
    // this.cluster.addAutoScalingGroupCapacity(`${props?.prefixName}-App-spotnodegroup`, {
    //   autoScalingGroupName: `${props?.prefixName}-App-spotnodegroup`,
    //   instanceType: new ec2.InstanceType('t2.medium'),
    //   spotPrice: cdk.Stack.of(this).region==primaryRegion ? '0.248' : '0.192',
    // });



    // Add tags to all assets within this stack
    cdk.Tags.of(this).add("CreatedBy", "CDK", { priority: 300 })
    cdk.Tags.of(this).add("Project", "AmazonEksCdkWorkshop", { priority: 300 })
    cdk.Tags.of(this).add('Owner', 'Ashish Patel', { priority: 300 });
  }

  /* IAM Roles */
  // Create Cluster IAM role
  public createClusterRole(id: string): iam.Role {
    const role = new iam.Role(this, id, {
      assumedBy: new iam.AccountRootPrincipal(),
    });

    role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEKSClusterPolicy'));

    return role;
  }

  // Create Nodegroup IAM role
  public createNodegroupRole(id: string): iam.Role {
    const role = new iam.Role(this, id, {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
    });

    role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEKSWorkerNodePolicy'));
    role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2ContainerRegistryReadOnly'));
    role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEKS_CNI_Policy'));

    return role;
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