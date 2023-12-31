# AWS project

## Overview

This is an AWS SAM project to stream users' Spotify activity, analyze the lyrics, and add some info to a Search index and Spotify.

Uses the following components:
- An OpenSearch domain (OpenSearchServiceDomain) to maintain an index with key lyric passages, along with metadata:
    - Vectorized lyrics
    - Sentiments
    - Song metadata
- A Lambda function (ProcessSongFunction) to analyze a song and add the data to the search index
    - Integrates with Genius to get the lyrics
    - Integrates with OpenAI for analysis and vectorization
- An SQS Queue (ProcessSongQueue) to invoke ProcessSongFunction
    - Has an associated DLQ (ProcessSongDeadLetterQueue)
- A Lambda function (ProcessUsersFunction) to stream users' Spotify activity and enqueue songs to ProcessSongQueue
    - Integrates with Spotify to stream users' Spotify activity
- Three DynamoDB tables
    - UserTable: stores users' Spotify credentials and other settings
    - SongTable: stores metadata about the songs that we've analyzed and indexed in search
    - SongListenTable: stores a record of each users' song listens
- A Layer (CommonLayer) with Node code used by the Lambda function handlers
    - The layer includes the JS output of a TypeScript project implemented in the `./shared` directory
    - Almost all code for the Lambda functions is delegated to the layer; the handlers themselves only deal with parsing input and constructing responses

## Setup

- Create a zip file to store the content for CommonLayer
    - In `./shared`, run `zip -r layer-package.zip nodejs node_modules`
- An env.json file for running locally (check the template.yaml to figure out which variables each Lambda function needs)
- Set up the AWS SAM CLI, configured with AWS credentials, to run the following:
    - To invoke a Lambda function locally: `sam local invoke {FUNCTION_NAME} --region {REGION} --env-vars env.json --event {TEST_EVENT}`
    - To create a package in S3: `sam package --template-file template.yaml --output-template-file packaged.yaml --s3-bucket mylyrics-sam-package`
    - To deploy: `sam deploy --template-file packaged.yaml --stack-name mylyrics --capabilities CAPABILITY_IAM`
