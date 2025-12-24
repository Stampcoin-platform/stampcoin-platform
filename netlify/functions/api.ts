import type { Handler } from "@netlify/functions";
import serverlessExpress from "@vendia/serverless-express";
import { app } from "../../server/_core/serverless";

// Create the serverless handler
const serverlessHandler = serverlessExpress({ app });

export const handler: Handler = async (event, context) => {
  // Rewrite path to remove /.netlify/functions/api prefix
  if (event.path.startsWith('/.netlify/functions/api')) {
    event.path = event.path.replace('/.netlify/functions/api', '');
  }
  
  // Ensure path starts with /api for Express routing
  if (!event.path.startsWith('/api')) {
    event.path = '/api' + event.path;
  }
  
  return serverlessHandler(event, context);
};
