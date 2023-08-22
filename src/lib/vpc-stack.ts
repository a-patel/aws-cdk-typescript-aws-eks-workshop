import  * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';


// interface vpcStackProps extends cdk.StackProps {
// }

// const vpc = new ec2.Vpc(cdk.constr, 'EksCdkWorkshopVPC', {
//   ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
// });


export class VpcStack extends cdk.Stack {
  readonly vpc: ec2.Vpc;
  readonly ingressSecurityGroup: ec2.SecurityGroup;
  readonly egressSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 👇 get Availability Zones, Region, Account
    console.log('availability zones 👉', cdk.Stack.of(this).availabilityZones);
    console.log('region 👉', cdk.Stack.of(this).region);
    console.log('accountId 👉', cdk.Stack.of(this).account);

    const vpc = new ec2.Vpc(this, "VPC", {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 2,
      natGateways: 2,
      // subnetConfiguration: [
      //   {
      //     name: "EksCdkWorkshop-public-snet",
      //     subnetType: ec2.SubnetType.PUBLIC,
      //     cidrMask: 24,
      //   },
      //   {
      //     name: "EksCdkWorkshop-private-snet",
      //     subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      //     cidrMask: 24,
      //   },
      //   {
      //     name: "isolated-subnet",
      //     subnetType: ec2.SubnetType.ISOLATED,
      //     cidrMask: 24,
      //   },
      // ],

      
      createInternetGateway: true,
    });


  }
}
