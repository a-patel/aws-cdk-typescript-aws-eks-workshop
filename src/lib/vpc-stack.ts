import  * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import { Helper } from './helper';

interface VpcProps extends cdk.StackProps {
  prefixName: string, // <--- prefix name, for all resource
  cidr: string, // <--- each VPC will need a Cidr
  maxAzs?: number, // <--- optionally the number of Availability Zones can be provided; defaults to 2 in our particular case
}

export class VpcStack extends cdk.Stack {
  readonly vpc: ec2.Vpc;
  readonly publicSubnetIds: string[] = [];
  readonly privateSubnetIds: string[] = [];
  readonly databaseSubnetIds: string[] = [];
  readonly workerSubnetIds: string[] = [];
  readonly ingressSecurityGroup: ec2.SecurityGroup;
  readonly egressSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props?: VpcProps) {
    super(scope, id, props);

    // get Account, Region, Availability Zones
    console.log('accountId 👉', cdk.Stack.of(this).account);
    console.log('region 👉', cdk.Stack.of(this).region);
    console.log('availability zones 👉', cdk.Stack.of(this).availabilityZones);

    this.vpc = new ec2.Vpc(this, "VPC", {
      vpcName: `${props?.prefixName}-vpc`,
      ipAddresses: ec2.IpAddresses.cidr(props?.cidr!),
      maxAzs: props?.maxAzs,
      natGateways: 2,
      subnetConfiguration: [
        {
          name: 'PublicSubnet',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'PrivateSubnet',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 20,
        },
        {
          name: 'DatabaseSubnet',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
        {
          name: 'WorkerSubnet',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 20,
        },
      ],

      
      createInternetGateway: true,

      enableDnsHostnames: true,
      enableDnsSupport: true,
      // defaultInstanceTenancy: DefaultInstanceTenancy.DEFAULT,
    });

    // VPC Tagging
    cdk.Tags.of(this.vpc).add(`kubernetes.io/cluster/${props?.prefixName}-cluster`, 'shared');

    // VPC Outputs
    new cdk.CfnOutput(this, "VPCId", {
      value: this.vpc.vpcId,
      description: "VPC ID",
      exportName: "VpcStack:vpcId"
    });


    /*****   Subnets   *****/
    const publicSubnets = this.vpc.selectSubnets({
      subnetType: ec2.SubnetType.PUBLIC,
    }).subnets
    // const publicSubnets = this.vpc.publicSubnets;
    
    const privateSubnets = this.vpc.selectSubnets({
      subnetGroupName: 'PrivateSubnet',
      // subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
    }).subnets
    // const publicSubnets = this.vpc.privateSubnets;
    
    const databaseSubnets = this.vpc.selectSubnets({
      subnetGroupName: 'DatabaseSubnet',
      // subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
    }).subnets

    const workerSubnets = this.vpc.selectSubnets({
      subnetGroupName: 'WorkerSubnet',
    }).subnets

    const allSubnets = [...publicSubnets, ...privateSubnets, ...databaseSubnets, ...workerSubnets];



  // Subnet Tagging
  for (const subnet of publicSubnets) {
    cdk.Aspects.of(subnet).add(
      new cdk.Tag(
        "Name",
        `${props?.prefixName}-Public-${Helper.getAZ(
          subnet.availabilityZone
        )}-snet`
      )
    );

    cdk.Tags.of(subnet).add(`kubernetes.io/cluster/${props?.prefixName}-cluster`, 'shared');
    cdk.Tags.of(subnet).add('kubernetes.io/role/elb', '1');

    this.publicSubnetIds.push(subnet.subnetId);
  };

  for (const subnet of privateSubnets) {
    cdk.Aspects.of(subnet).add(
      new cdk.Tag(
        'Name',
        `${props?.prefixName}-Private-${Helper.getAZ(subnet.availabilityZone)}-snet`
      )
    );

    cdk.Tags.of(subnet).add(`kubernetes.io/cluster/${props?.prefixName}-cluster`, 'shared');
    cdk.Tags.of(subnet).add('kubernetes.io/role/internal-elb', '1');

    this.privateSubnetIds.push(subnet.subnetId);
  };

  for (const subnet of databaseSubnets) {
    cdk.Aspects.of(subnet).add(
      new cdk.Tag(
        'Name',
        `${props?.prefixName}-Database-${Helper.getAZ(subnet.availabilityZone)}-snet`
      )
    );

    this.databaseSubnetIds.push(subnet.subnetId);
  };

  for (const subnet of workerSubnets) {
    cdk.Aspects.of(subnet).add(
      new cdk.Tag(
        'Name',
        `${props?.prefixName}-Worker-${Helper.getAZ(subnet.availabilityZone)}-snet`
      )
    );

    this.workerSubnetIds.push(subnet.subnetId);
  };


  // Subnet Output




    // const publicSubnetA = new PublicSubnet(this, "PublicSubnetA", {
    //   // name: "EksCdkWorkshop-public-snet",
    //   vpcId: vpc.vpcId,
    //   cidrBlock: "10.0.0.0/24",
    //   availabilityZone: vpc.availabilityZones[0],
    //   mapPublicIpOnLaunch: true
    // });





    // const securityGroup = new SecurityGroup(this, 'sg', {
    //   vpc: vpc
    // });


    // this.ingressSecurityGroup = new SecurityGroup(this, 'ingress-security-group', {
    //   vpc: this.vpc,
    //   allowAllOutbound: false,
    //   securityGroupName: 'IngressSecurityGroup',
    // });
    
    // this.ingressSecurityGroup.addIngressRule(Peer.ipv4('10.0.0.0/16'), Port.tcp(3306));
    
    
    // this.egressSecurityGroup = new SecurityGroup(this, 'egress-security-group', {
    //     vpc: this.vpc,
    //     allowAllOutbound: false,
    //     securityGroupName: 'EgressSecurityGroup',
    // });

    // this.egressSecurityGroup.addEgressRule(Peer.anyIpv4(), Port.tcp(80));




    // const nacl = new NetworkAcl(this, 'MyApp-NetworkAcl', {
    //   vpc,
    //   networkAclName: 'IsolatedSubnetNACL',
    //   subnetSelection: databaseSubnets,
    // })


    // Add tags to all assets within this stack
    cdk.Tags.of(this).add("CreatedBy", "CDK", { priority: 300 })
    cdk.Tags.of(this).add("Project", "AmazonEksCdkWorkshop", { priority: 300 })
    cdk.Tags.of(this).add('Owner', 'Ashish Patel', { priority: 300 });

  }
}
