import { GetSecretValueCommand , 
  SecretsManagerClient 
} from "@aws-sdk/client-secrets-manager";
import { Client } from "@opensearch-project/opensearch";
import { AwsSigv4Signer } from "@opensearch-project/opensearch/aws";
import { defaultProvider } from "@aws-sdk/credential-provider-node";
import { SQSClient } from "@aws-sdk/client-sqs";

// client for the AWS Secrets Manager
const secretsManager = new SecretsManagerClient({});
export const getSecretString = async (secretId: string) => {
  const secret = await secretsManager.send(
    new GetSecretValueCommand({ SecretId: secretId })
  );

  if (secret.SecretString == null) {
    throw new Error(`secret string with ID ${secretId} is missing`);
  }

  return secret.SecretString;
}

export const getSecretObject = async (secretId: string) => {
  const secret = await secretsManager.send(
    new GetSecretValueCommand({ SecretId: secretId })
  );
  
  const json = secret.SecretString;

  if (json == null) {
    throw new Error(`secret object with ID ${secretId} is missing`);
  }

  try {
    return JSON.parse(json);
  } catch (e) {
    throw new Error(`secret object with ID ${secretId} is not valid JSON`);
  }
}

// client for the AWS OpenSearch
export const getSearchClient = () => {
  if (process.env.AWS_REGION == null) {
    throw new Error("AWS_REGION is not defined in the environment");
  }

  return new Client({
    ...AwsSigv4Signer({
      region: process.env.AWS_REGION,
      service: "es",
      getCredentials: defaultProvider(),
    }),
    node: process.env.OPENSEARCH_URL,
  })
};

// client for Simple Queue Service
export const sqs = new SQSClient({});
