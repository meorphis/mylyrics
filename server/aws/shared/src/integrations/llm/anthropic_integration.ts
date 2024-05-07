import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { 
  LABEL_PASSAGES_ASSISTANT_EXAMPLE_MESSAGE, LABEL_PASSAGES_SYSTEM_MESSAGE,
  LABEL_PASSAGES_USER_EXAMPLE_MESSAGE 
} from "./prompt";
import { LabelPassagesOutput, labelPassages } from "./label_passages";

// *** PUBLIC INTERFACE ***
// invokes the Anthropic API to label passages as described in the docstring for
// labelPassages
export const labelPassagesAnthropic = async ({lyrics}: {lyrics: string}): Promise<{
    status: "success",
    content: LabelPassagesOutput
  } | {
    status: "error",
  }> => {

  return await labelPassages({
    lyrics,
    invokeModel: async ({lyrics}: {lyrics: string}) => {
      const client = new BedrockRuntimeClient({region: "us-east-1"});
      // eslint-disable-next-line max-len
      const prompt = `\n\nHuman ${LABEL_PASSAGES_SYSTEM_MESSAGE}\n\nHuman: ${LABEL_PASSAGES_USER_EXAMPLE_MESSAGE}\n\nAssistant: ${LABEL_PASSAGES_ASSISTANT_EXAMPLE_MESSAGE}\n\nHuman: ${lyrics}\n\nAssistant:`
      const command = new InvokeModelCommand({
        modelId: "anthropic.claude-3-haiku-20240307-v1:0",
        body: JSON.stringify({
          prompt: prompt,
          max_tokens_to_sample: 4096,
          temperature: 0.0,
          top_p: 0.999
        }),
        contentType: "application/json",
        accept: "*/*",
      })
      const response = await client.send(command);
      const textDecoder = new TextDecoder("utf-8");
      return removeTrailingQuote(JSON.parse(textDecoder.decode(response.body)).completion);
    },
    modelName: "anthropic.claude-3-haiku-20240307-v1:0",
  })
}

// anthropic adds an extranenous trailing quote to the end of its JSON in some rare cases
const removeTrailingQuote = (str: string) => {
  if (str.endsWith("\"")) {
    return str.slice(0, -1);
  }
  return str;
}

  