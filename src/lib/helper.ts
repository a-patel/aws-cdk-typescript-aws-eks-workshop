import  * as cdk from 'aws-cdk-lib';
import { Peer, Port, SecurityGroup, SubnetType, IpAddresses, Vpc, PublicSubnet, NetworkAcl } from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';


export class Helper {
  public static getAZ(azName: string): string {
      return azName.slice(-1);;
  }
}
