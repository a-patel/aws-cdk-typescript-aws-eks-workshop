import  * as cdk from 'aws-cdk-lib';
import { Peer, Port, SecurityGroup, SubnetType, IpAddresses, Vpc, PublicSubnet, NetworkAcl } from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';


// interface vpcStackProps extends cdk.StackProps {
// }

// const vpc = new Vpc(cdk.constr, 'EksCdkWorkshopVPC', {
//   ipAddresses: IpAddresses.cidr('10.0.0.0/16'),
// });

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

    // 👇 get Availability Zones, Region, Account
    console.log('availability zones 👉', cdk.Stack.of(this).availabilityZones);
    console.log('region 👉', cdk.Stack.of(this).region);
    console.log('accountId 👉', cdk.Stack.of(this).account);

    this.vpc = new Vpc(this, "VPC", {
      vpcName: `${props?.prefixName}-vpc`,
      ipAddresses: IpAddresses.cidr(props?.cidr!),
      maxAzs: props?.maxAzs,
      natGateways: 2,
      subnetConfiguration: [
        {
          name: `${props?.prefixName}-Public-snet`,
          subnetType: SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: `${props?.prefixName}-Private`,
          subnetType: SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
        {
          name: "EksCdkWorkshop-database-snet",
          subnetType: SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],

      
      createInternetGateway: true,

      enableDnsHostnames: true,
      enableDnsSupport: true,
      // defaultInstanceTenancy: DefaultInstanceTenancy.DEFAULT,
    });

  }
}
