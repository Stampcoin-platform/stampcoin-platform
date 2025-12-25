import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import serverlessExpress from "@vendia/serverless-express";
import { app } from "../../server/_core/serverless";

// Create the serverless handler once
let serverlessHandler: any;

const getHandler = () => {
  if (!serverlessHandler) {
    serverlessHandler = serverlessExpress({ app });
  }
  return serverlessHandler;
};

export const handler: Handler = async (
  event: HandlerEvent,
  context: HandlerContext
) => {
  // Log for debugging
  console.log('Netlify Function called:', event.path);
  
  // Get the serverless handler
  const expressHandler = getHandler();
  
  // Call the handler
  return expressHandler(event, context);
};
