import { GetSecretValueCommand , 
  SecretsManagerClient 
} from "@aws-sdk/client-secrets-manager";
import { Configuration, OpenAIApi } from "openai";
import { cachedFunction } from "./cache";
import { Client } from "@opensearch-project/opensearch";
import { AwsSigv4Signer } from "@opensearch-project/opensearch/aws";
import { defaultProvider } from "@aws-sdk/credential-provider-node";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { SQSClient } from "@aws-sdk/client-sqs";
import SpotifyWebApi from "spotify-web-api-node";

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

// client for the OpenAI API
const _getOpenAIClient = async () => {
  const openaiApiKey = await getSecretString("openaiApiKey");
  const configuration = new Configuration({
    apiKey: openaiApiKey,
  });
  return new OpenAIApi(configuration);
}
export const getOpenAIClient = cachedFunction(_getOpenAIClient);

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

// client for DynamoDB
export const dbClient = new DynamoDBClient({});

// client for Simple Queue Service
export const sqs = new SQSClient({});

// client for Spotify
export const getSpotifyClient = (accessToken: string) => {
  const sp = new SpotifyWebApi();
  sp.setAccessToken(accessToken);
  return sp;
}
