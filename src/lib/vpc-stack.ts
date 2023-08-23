import  * as cdk from 'aws-cdk-lib';
import { Peer, Port, SecurityGroup, SubnetType, IpAddresses, Vpc, PublicSubnet, NetworkAcl, SubnetFilter, ISubnet, SubnetSelection } from 'aws-cdk-lib/aws-ec2';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import { Helper } from './helper';

interface VpcProps extends cdk.StackProps {
  prefixName: string, // <--- prefix name, for all resource
  cidr: string, // <--- each VPC will need a Cidr
  maxAzs?: number, // <--- optionally the number of Availability Zones can be provided; defaults to 2 in our particular case
}

export class VpcStack extends cdk.Stack {
  readonly vpc: Vpc;
  readonly ingressSecurityGroup: SecurityGroup;
  readonly egressSecurityGroup: SecurityGroup;
  readonly publicSubnetIds: string[] = [];
  readonly privateSubnetIds: string[] = [];
  readonly databaseSubnetIds: string[] = [];

  constructor(scope: Construct, id: string, props?: VpcProps) {
    super(scope, id, props);

    // get Account, Region, Availability Zones
    console.log('accountId 👉', cdk.Stack.of(this).account);
    console.log('region 👉', cdk.Stack.of(this).region);
    console.log('availability zones 👉', cdk.Stack.of(this).availabilityZones);

    this.vpc = new Vpc(this, "VPC", {
      vpcName: `${props?.prefixName}-vpc`,
      ipAddresses: IpAddresses.cidr(props?.cidr!),
      maxAzs: props?.maxAzs,
      natGateways: 2,
      subnetConfiguration: [
        {
          name: 'PublicSubnet',
          subnetType: SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'PrivateSubnet',
          subnetType: SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
        {
          name: 'DatabaseSubnet',
          subnetType: SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
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
      subnetType: SubnetType.PUBLIC,
    })
    
    const privateSubnets = this.vpc.selectSubnets({
      subnetType: SubnetType.PRIVATE_WITH_EGRESS,
    })
    
    const databaseSubnets = this.vpc.selectSubnets({
      subnetType: SubnetType.PRIVATE_ISOLATED,
    })

    // const allSubnets = [...this.publicSubnets, ...this.privateSubnets, ...this.isolatedSubnets];



  // Subnet Tagging
  for (const subnet of this.vpc.publicSubnets) {
    cdk.Aspects.of(subnet).add(
      new cdk.Tag(
        'Name',
        `${props?.prefixName}-Public-${Helper.getAZ(subnet.availabilityZone)}-snet`
      )
    );

    cdk.Tags.of(subnet).add(`kubernetes.io/cluster/${props?.prefixName}-cluster`, 'shared');
    cdk.Tags.of(subnet).add('kubernetes.io/role/elb', '1');

    this.publicSubnetIds.push(subnet.subnetId);
  };

  const privateSubnetsSelected = this.vpc.selectSubnets({
    subnetGroupName: 'PrivateSubnet' 
  });

  for (const subnet of privateSubnetsSelected.subnets) {
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

  const databaseSubnetsSelected = this.vpc.selectSubnets({
    subnetGroupName: 'DatabaseSubnet' 
  });

  for (const subnet of databaseSubnetsSelected.subnets) {
    cdk.Aspects.of(subnet).add(
      new cdk.Tag(
        'Name',
        `${props?.prefixName}-Database-${Helper.getAZ(subnet.availabilityZone)}-snet`
      )
    );

    this.databaseSubnetIds.push(subnet.subnetId);
  };


  // Subnet Output





    // for(let i = 0; i < 2-1; i++){
    //   new PublicSubnet(this, "PublicSubnetA", {
    //     // name: "EksCdkWorkshop-public-snet",
    //     vpcId: vpc.vpcId,
    //     cidrBlock: "10.0.0.0/24",
    //     availabilityZone: vpc.availabilityZones[i],
    //     mapPublicIpOnLaunch: true
    //   });
    // }

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
