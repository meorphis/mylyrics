# AWS project

## Overview

This is an AWS SAM project to stream users' Spotify activity, analyze the lyrics, and add some info to a Search index and Spotify.

## Setup

- Create a zip file to store the content for CommonLayer
    - In `./shared`, run `zip -r layer-package.zip nodejs node_modules`
- An env.json file for running locally (check the template.yaml to figure out which variables each Lambda function needs)
- Set up the AWS SAM CLI, configured with AWS credentials, to run the following:
    - To invoke a Lambda function locally: `sam local invoke {FUNCTION_NAME} --region {REGION} --env-vars env.json --event {TEST_EVENT}`
    - To create a package in S3: `sam package --template-file template.yaml --output-template-file packaged.yaml --s3-bucket mylyrics-sam-package`
    - To deploy: `sam deploy --template-file packaged.yaml --stack-name mylyrics --capabilities CAPABILITY_IAM`
