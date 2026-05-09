export type Topic = {
  domain: string;
  weight: number;
  topic: string;
  services: string[];
  concepts: string[];
  misconceptions: string[];
};

export const SAA_TOPICS: Topic[] = [
  {
    domain: 'Design Secure Architectures',
    weight: 30,
    topic: 'IAM roles, policies, and least privilege',
    services: ['IAM', 'STS'],
    concepts: ['identity policies', 'resource policies', 'roles', 'least privilege'],
    misconceptions: ['Using long-lived access keys when a role is available', 'Granting broad AdministratorAccess for service integration']
  },
  {
    domain: 'Design Secure Architectures',
    weight: 30,
    topic: 'Network security boundaries',
    services: ['VPC', 'Security Groups', 'NACLs'],
    concepts: ['stateful security groups', 'stateless NACLs', 'public and private subnets'],
    misconceptions: ['Treating NACLs as stateful', 'Using an internet gateway for private subnet egress']
  },
  {
    domain: 'Design Secure Architectures',
    weight: 30,
    topic: 'Encryption and secret storage',
    services: ['KMS', 'Secrets Manager', 'SSM Parameter Store', 'S3'],
    concepts: ['customer managed keys', 'automatic rotation', 'encryption at rest', 'encryption in transit'],
    misconceptions: ['Storing credentials in user data', 'Using Parameter Store when automatic secret rotation is required']
  },
  {
    domain: 'Design Resilient Architectures',
    weight: 26,
    topic: 'RDS Multi-AZ vs read replicas',
    services: ['RDS', 'Aurora'],
    concepts: ['automatic failover', 'read scaling', 'standby instance', 'replication lag'],
    misconceptions: ['Using read replicas for automatic failover', 'Using Multi-AZ for read scaling']
  },
  {
    domain: 'Design Resilient Architectures',
    weight: 26,
    topic: 'Disaster recovery strategies',
    services: ['Route 53', 'RDS', 'S3', 'CloudFormation'],
    concepts: ['backup and restore', 'pilot light', 'warm standby', 'active-active', 'RTO', 'RPO'],
    misconceptions: ['Choosing active-active when cost is the primary constraint', 'Confusing backup retention with low RTO']
  },
  {
    domain: 'Design Resilient Architectures',
    weight: 26,
    topic: 'Decoupling with queues and events',
    services: ['SQS', 'SNS', 'EventBridge'],
    concepts: ['visibility timeout', 'fanout', 'event bus', 'dead-letter queue'],
    misconceptions: ['Using SNS when consumers need durable polling', 'Ignoring visibility timeout for long-running workers']
  },
  {
    domain: 'Design High-Performing Architectures',
    weight: 24,
    topic: 'Caching and edge performance',
    services: ['CloudFront', 'ElastiCache', 'DynamoDB DAX'],
    concepts: ['edge cache', 'TTL', 'cache invalidation', 'read-heavy workloads'],
    misconceptions: ['Using DAX for relational database caching', 'Using CloudFront for TCP acceleration instead of Global Accelerator']
  },
  {
    domain: 'Design High-Performing Architectures',
    weight: 24,
    topic: 'DynamoDB access patterns and capacity',
    services: ['DynamoDB', 'DAX'],
    concepts: ['partition key', 'sort key', 'GSI', 'LSI', 'on-demand capacity', 'provisioned capacity'],
    misconceptions: ['Choosing a low-cardinality partition key', 'Using scans for common access paths']
  },
  {
    domain: 'Design Cost-Optimized Architectures',
    weight: 20,
    topic: 'S3 storage classes and lifecycle policies',
    services: ['S3', 'S3 Glacier'],
    concepts: ['Standard', 'Intelligent-Tiering', 'Standard-IA', 'One Zone-IA', 'Glacier Instant Retrieval', 'lifecycle rules'],
    misconceptions: ['Using One Zone-IA when availability across AZs is required', 'Using Glacier for frequently accessed objects']
  },
  {
    domain: 'Design Cost-Optimized Architectures',
    weight: 20,
    topic: 'Compute pricing and right-sizing',
    services: ['EC2', 'Lambda', 'Auto Scaling'],
    concepts: ['On-Demand', 'Reserved Instances', 'Savings Plans', 'Spot Instances', 'serverless'],
    misconceptions: ['Using Spot for stateful workloads without interruption handling', 'Buying reserved capacity before workload baseline is known']
  }
];

export function topicPrompt() {
  return SAA_TOPICS.map((topic, index) => `${index + 1}. ${topic.domain} > ${topic.topic}\nServices: ${topic.services.join(', ')}\nConcepts: ${topic.concepts.join(', ')}\nMisconceptions: ${topic.misconceptions.join('; ')}`).join('\n\n');
}
